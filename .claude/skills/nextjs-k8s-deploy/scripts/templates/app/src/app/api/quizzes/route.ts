import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

// GET: List quizzes available for a student (by topic) or all (for teacher)
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const topic = req.nextUrl.searchParams.get("topic");

  const query = topic
    ? `SELECT q.id, q.topic, q.difficulty, q.title, q.created_at,
         (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = $2) as attempts,
         (SELECT MAX(qa.percentage) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = $2) as best_score
       FROM quizzes q WHERE q.topic = $1 ORDER BY q.created_at DESC LIMIT 20`
    : `SELECT q.id, q.topic, q.difficulty, q.title, q.created_at,
         (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = $1) as attempts,
         (SELECT MAX(qa.percentage) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = $1) as best_score
       FROM quizzes q ORDER BY q.created_at DESC LIMIT 50`;

  const params = topic ? [topic, user.user_id] : [user.user_id];
  const { rows } = await pool.query(query, params);

  return NextResponse.json({
    quizzes: rows.map(q => ({
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty,
      title: q.title,
      attempts: Number(q.attempts || 0),
      best_score: q.best_score ? Number(q.best_score) : null,
      created_at: q.created_at,
    }))
  });
}
