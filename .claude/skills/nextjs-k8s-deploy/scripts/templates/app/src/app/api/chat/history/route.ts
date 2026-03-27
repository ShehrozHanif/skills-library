import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT id, role, content as text, agent, created_at
     FROM chat_messages WHERE user_id = $1
     ORDER BY created_at ASC LIMIT 200`,
    [user.user_id]
  );

  return NextResponse.json({ messages: rows });
}

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { role, text, agent } = await req.json();
  if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

  const { rows } = await pool.query(
    `INSERT INTO chat_messages (user_id, role, content, agent)
     VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [user.user_id, role || "user", text, agent || null]
  );

  return NextResponse.json({ id: rows[0].id, created_at: rows[0].created_at });
}
