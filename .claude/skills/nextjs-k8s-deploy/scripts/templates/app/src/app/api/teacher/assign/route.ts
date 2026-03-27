import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "teacher") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

  const { student_id, title, description, starter_code, difficulty, topic } = await req.json();
  if (!student_id || !title) {
    return NextResponse.json({ error: "student_id and title required" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO assigned_exercises (teacher_id, student_id, title, description, starter_code, difficulty, topic)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [user.user_id, student_id, title, description || "", starter_code || "", difficulty || "beginner", topic || "General"]
  );

  return NextResponse.json({ success: true, exercise_id: rows[0].id });
}

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Students see their assigned exercises; teachers see what they assigned
  const isTeacher = user.role === "teacher";
  const { rows } = await pool.query(
    isTeacher
      ? `SELECT ae.*, u.name as student_name FROM assigned_exercises ae JOIN users u ON u.id = ae.student_id WHERE ae.teacher_id = $1 ORDER BY ae.created_at DESC LIMIT 50`
      : `SELECT ae.*, u.name as teacher_name FROM assigned_exercises ae JOIN users u ON u.id = ae.teacher_id WHERE ae.student_id = $1 ORDER BY ae.created_at DESC LIMIT 20`,
    [user.user_id]
  );

  return NextResponse.json({ exercises: rows });
}
