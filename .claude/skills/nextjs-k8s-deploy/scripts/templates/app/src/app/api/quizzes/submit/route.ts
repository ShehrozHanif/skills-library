import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

function calcLevel(score: number): string {
  if (score >= 91) return "Mastered";
  if (score >= 71) return "Proficient";
  if (score >= 41) return "Learning";
  return "Beginner";
}

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { quiz_id, answers } = await req.json();
  if (!quiz_id || !answers || !Array.isArray(answers)) {
    return NextResponse.json({ error: "quiz_id and answers[] required" }, { status: 400 });
  }

  // Load quiz questions
  const quiz = await pool.query(`SELECT topic, questions FROM quizzes WHERE id = $1`, [quiz_id]);
  if (quiz.rows.length === 0) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const questions = quiz.rows[0].questions;
  const topic = quiz.rows[0].topic;
  const total = questions.length;

  // Auto-grade: compare student answers to correct answers
  let correct = 0;
  const results = questions.map((q: { id: number; correct: number; explanation: string }, i: number) => {
    const studentAnswer = answers[i] ?? -1;
    const isCorrect = studentAnswer === q.correct;
    if (isCorrect) correct++;
    return {
      question_id: q.id,
      student_answer: studentAnswer,
      correct_answer: q.correct,
      is_correct: isCorrect,
      explanation: q.explanation,
    };
  });

  const percentage = Math.round((correct / total) * 100);

  // Save attempt
  await pool.query(
    `INSERT INTO quiz_attempts (user_id, quiz_id, answers, score, total, percentage)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.user_id, quiz_id, JSON.stringify(answers), correct, total, percentage]
  );

  // Update progress.quiz_score for this topic
  try {
    const prog = await pool.query(
      `SELECT id, exercises_completed, quiz_score, code_quality, streak
       FROM progress WHERE user_id = $1 AND topic = $2`,
      [user.user_id, topic]
    );
    if (prog.rows.length > 0) {
      const p = prog.rows[0];
      // Quiz score = best of current and new percentage
      const newQuiz = Math.max(Number(p.quiz_score || 0), percentage);
      const ec = Number(p.exercises_completed || 0);
      const cq = Number(p.code_quality || 0);
      const st = Math.min(Number(p.streak || 0) * 10, 100);
      const score = Math.round(ec * 0.4 + newQuiz * 0.3 + cq * 0.2 + st * 0.1);
      await pool.query(
        `UPDATE progress SET quiz_score = $2, mastery_score = $3, level = $4, updated_at = NOW()
         WHERE id = $1`,
        [p.id, newQuiz, score, calcLevel(score)]
      );
    }
  } catch { /* silent */ }

  return NextResponse.json({
    score: correct,
    total,
    percentage,
    results,
    passed: percentage >= 70,
  });
}
