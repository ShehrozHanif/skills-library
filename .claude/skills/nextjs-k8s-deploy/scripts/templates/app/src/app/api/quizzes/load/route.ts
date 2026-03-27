import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

// GET: Load a single quiz with questions (without correct answers for students)
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const quizId = req.nextUrl.searchParams.get("id");
  if (!quizId) return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });

  const { rows } = await pool.query(
    `SELECT id, topic, difficulty, title, questions FROM quizzes WHERE id = $1`,
    [quizId]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const quiz = rows[0];
  // Strip correct answers for students (teacher can see them)
  const questions = quiz.questions.map((q: { id: number; question: string; options: string[]; correct: number; explanation: string }) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    // Only include correct/explanation for teachers
    ...(user.role === "teacher" ? { correct: q.correct, explanation: q.explanation } : {}),
  }));

  return NextResponse.json({
    quiz_id: quiz.id,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    title: quiz.title,
    questions,
  });
}
