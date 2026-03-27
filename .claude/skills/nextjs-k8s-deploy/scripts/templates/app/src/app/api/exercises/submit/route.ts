import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import OpenAI from "openai";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

function calcLevel(score: number): string {
  if (score >= 91) return "Mastered";
  if (score >= 71) return "Proficient";
  if (score >= 41) return "Learning";
  return "Beginner";
}

function runCode(code: string): Promise<{ output?: string; error?: string }> {
  return new Promise((resolve) => {
    execFile("python3", ["-c", code], {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    }, (err, stdout, stderr) => {
      if (err) {
        if (err.killed) resolve({ error: "Execution timed out (5s limit)" });
        else resolve({ error: (stderr || err.message).slice(0, 5000) });
        return;
      }
      resolve({ output: (stdout || "(no output)").slice(0, 5000) });
    });
  });
}

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { exercise_id, code } = await req.json();
  if (!exercise_id || !code) return NextResponse.json({ error: "exercise_id and code required" }, { status: 400 });

  // Load exercise
  const ex = await pool.query(
    `SELECT id, title, description, starter_code, expected_output, topic, difficulty
     FROM assigned_exercises WHERE id = $1 AND student_id = $2`,
    [exercise_id, user.user_id]
  );
  if (ex.rows.length === 0) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  const exercise = ex.rows[0];

  // Run the code
  const result = await runCode(code);

  // Auto-grade: compare output + AI review
  let grade = 0;
  let feedback = "";

  if (result.error) {
    grade = 10;
    feedback = `Code has errors:\n${result.error}\n\nTry fixing the error and resubmit.`;
  } else {
    // Check output match
    const outputMatch = exercise.expected_output
      ? (result.output || "").trim() === exercise.expected_output.trim()
      : false;

    if (outputMatch) {
      grade = 90;
      feedback = "Output matches expected result! Great job!";
    } else {
      grade = 50;
      feedback = `Output doesn't match expected.\nYour output: ${(result.output || "").slice(0, 200)}\nExpected: ${(exercise.expected_output || "N/A").slice(0, 200)}`;
    }

    // AI code review for detailed feedback (if API key available)
    if (OPENAI_API_KEY && OPENAI_API_KEY !== "mock") {
      try {
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a Python code grader. Grade the student's code on a scale of 0-100 and provide brief feedback.
Exercise: ${exercise.title} — ${exercise.description || ""}
Expected output: ${exercise.expected_output || "N/A"}
Actual output: ${(result.output || "").slice(0, 500)}

Return ONLY valid JSON: {"grade": 85, "feedback": "Your brief feedback here"}`,
            },
            { role: "user", content: code.slice(0, 5000) },
          ],
          max_tokens: 200,
          temperature: 0.3,
        });
        const raw = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
        if (parsed.grade !== undefined) grade = Math.min(100, Math.max(0, parsed.grade));
        if (parsed.feedback) feedback = parsed.feedback;
      } catch { /* keep basic grade */ }
    }
  }

  // Save submission to assigned_exercises
  await pool.query(
    `UPDATE assigned_exercises SET student_code = $2, grade = $3, feedback = $4, graded_at = NOW(),
     status = CASE WHEN $3 >= 70 THEN 'completed' ELSE 'in_progress' END,
     completed_at = CASE WHEN $3 >= 70 THEN NOW() ELSE NULL END
     WHERE id = $1`,
    [exercise_id, code.slice(0, 10000), grade, feedback]
  );

  // Also save as a regular submission
  await pool.query(
    `INSERT INTO submissions (user_id, exercise_id, code, result, feedback)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.user_id, exercise_id, code.slice(0, 10000), grade >= 70 ? "success" : "error", feedback]
  );

  // Update progress for this topic
  if (exercise.topic) {
    try {
      const prog = await pool.query(
        `SELECT id, exercises_completed, quiz_score, code_quality, streak
         FROM progress WHERE user_id = $1 AND topic = $2`,
        [user.user_id, exercise.topic]
      );
      if (prog.rows.length > 0) {
        const p = prog.rows[0];
        const newEC = Math.min(100, Number(p.exercises_completed || 0) + (grade >= 70 ? 10 : 2));
        const newCQ = Math.min(100, Number(p.code_quality || 0) + Math.round(grade / 20));
        const qs = Number(p.quiz_score || 0);
        const st = Math.min(Number(p.streak || 0) * 10, 100);
        const score = Math.round(newEC * 0.4 + qs * 0.3 + newCQ * 0.2 + st * 0.1);
        await pool.query(
          `UPDATE progress SET exercises_completed = $2, code_quality = $3, mastery_score = $4, level = $5, updated_at = NOW()
           WHERE id = $1`,
          [p.id, newEC, newCQ, score, calcLevel(score)]
        );
      }
    } catch { /* silent */ }
  }

  return NextResponse.json({
    grade,
    feedback,
    output: result.output || result.error || "",
    passed: grade >= 70,
    status: grade >= 70 ? "completed" : "in_progress",
  });
}
