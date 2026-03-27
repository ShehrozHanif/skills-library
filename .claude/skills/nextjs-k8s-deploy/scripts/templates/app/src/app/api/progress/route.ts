import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

const DEFAULT_TOPICS = [
  "Variables", "Data Types", "Loops", "Lists",
  "Functions", "OOP", "Error Handling", "Libraries"
];

function calcLevel(pct: number): string {
  if (pct >= 91) return "Mastered";
  if (pct >= 71) return "Proficient";
  if (pct >= 41) return "Learning";
  return "Beginner";
}

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT topic, mastery_score as pct, level, exercises_completed, quiz_score, code_quality, streak
     FROM progress WHERE user_id = $1 ORDER BY id`,
    [user.user_id]
  );

  // If no progress yet, seed default topics
  if (rows.length === 0) {
    const values = DEFAULT_TOPICS.map(
      (t, i) => `($1, '${t}', 0, 'Beginner')`
    ).join(",");
    await pool.query(
      `INSERT INTO progress (user_id, topic, mastery_score, level) VALUES ${values}`,
      [user.user_id]
    );
    return NextResponse.json({
      topics: DEFAULT_TOPICS.map(name => ({ name, pct: 0, level: "Beginner" }))
    });
  }

  return NextResponse.json({
    topics: rows.map(r => ({
      name: r.topic,
      pct: Math.round(Number(r.pct)),
      level: r.level || calcLevel(Number(r.pct)),
    }))
  });
}

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { topic, exercises_completed, quiz_score, code_quality, streak } = await req.json();
  if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const ec = Number(exercises_completed || 0);
  const qs = Number(quiz_score || 0);
  const cq = Number(code_quality || 0);
  const st = Math.min(Number(streak || 0) * 10, 100);
  const score = Math.round(ec * 0.4 + qs * 0.3 + cq * 0.2 + st * 0.1);
  const level = calcLevel(score);

  await pool.query(
    `INSERT INTO progress (user_id, topic, mastery_score, level, exercises_completed, quiz_score, code_quality, streak, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT ON CONSTRAINT uq_progress_user_topic
     DO UPDATE SET mastery_score=$3, level=$4, exercises_completed=$5, quiz_score=$6, code_quality=$7, streak=$8, updated_at=NOW()`,
    [user.user_id, topic, score, level, ec, qs, cq, Number(streak || 0)]
  );

  return NextResponse.json({ topic, score, level });
}
