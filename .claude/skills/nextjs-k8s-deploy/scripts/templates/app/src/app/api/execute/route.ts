import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";
import { publishStruggleEvent } from "@/lib/kafka";

const TIMEOUT_MS = 5000;
const MAX_OUTPUT = 10000; // chars

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  if (code.length > 50000) {
    return NextResponse.json({ error: "Code too long (max 50KB)" }, { status: 400 });
  }

  try {
    const result = await executeCode(code);

    // Save submission and update progress if user is authenticated
    const user = getUser(req);
    if (user) {
      try {
        await pool.query(
          `INSERT INTO submissions (user_id, code, result, feedback)
           VALUES ($1, $2, $3, $4)`,
          [user.user_id, code.slice(0, 10000), result.error ? "error" : "success", result.output || result.error || ""]
        );

        // Get active topic progress (most recently updated)
        const prog = await pool.query(
          `SELECT id, topic, exercises_completed, quiz_score, code_quality, streak
           FROM progress WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
          [user.user_id]
        );

        if (result.error) {
          // Track failed execution streaks — check last 5 submissions
          const recent = await pool.query(
            `SELECT result FROM submissions WHERE user_id = $1
             ORDER BY submitted_at DESC LIMIT 5`,
            [user.user_id]
          );
          const consecutiveFails = recent.rows.length;
          const allFailed = consecutiveFails >= 5 && recent.rows.every((r: { result: string }) => r.result === "error");
          if (allFailed && prog.rows.length > 0) {
            const topic = prog.rows[0].topic || "Code Execution";
            // Create struggle alert for teacher dashboard
            await pool.query(
              `INSERT INTO struggle_alerts (user_id, topic, alert_type, attempts, message)
               VALUES ($1, $2, 'repeated_error', $3, $4)`,
              [user.user_id, topic, consecutiveFails, (result.error || "").slice(0, 500)]
            );
            // Publish Kafka event for real-time processing
            publishStruggleEvent({
              event_type: "repeated_error",
              user_id: user.user_id,
              user_name: user.name,
              topic,
              details: { consecutive_failures: consecutiveFails, last_error: (result.error || "").slice(0, 200) },
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          // Successful run: update code_quality + exercises_completed + recalculate mastery
          if (prog.rows.length > 0) {
            const p = prog.rows[0];
            const newCQ = Math.min(100, Number(p.code_quality || 0) + 5);
            const newEC = Math.min(100, Number(p.exercises_completed || 0) + 2);
            const qs = Number(p.quiz_score || 0);
            const st = Math.min(Number(p.streak || 0) * 10, 100);
            const score = Math.round(newEC * 0.4 + qs * 0.3 + newCQ * 0.2 + st * 0.1);
            const level = score >= 91 ? "Mastered" : score >= 71 ? "Proficient" : score >= 41 ? "Learning" : "Beginner";
            await pool.query(
              `UPDATE progress SET code_quality = $2, exercises_completed = $3, mastery_score = $4, level = $5, updated_at = NOW()
               WHERE id = $1`,
              [p.id, newCQ, newEC, score, level]
            );
          }
        }
      } catch { /* don't fail the response if DB save fails */ }
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function executeCode(code: string): Promise<{ output?: string; error?: string }> {
  return new Promise((resolve) => {
    const wrappedCode = code;
    const child = execFile(
      "python3",
      ["-c", wrappedCode],
      {
        timeout: TIMEOUT_MS,
        maxBuffer: 1024 * 1024, // 1MB
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
      },
      (err, stdout, stderr) => {
        if (err) {
          if (err.killed || (err as NodeJS.ErrnoException).code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
            resolve({ error: "Execution timed out (5s limit)" });
          } else {
            resolve({ error: (stderr || err.message).slice(0, MAX_OUTPUT) });
          }
          return;
        }
        resolve({ output: (stdout || "(no output)").slice(0, MAX_OUTPUT) });
      }
    );

    // Hard kill after timeout + 1s grace
    setTimeout(() => {
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
    }, TIMEOUT_MS + 1000);
  });
}
