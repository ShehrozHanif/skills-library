import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "teacher") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

  const { alert_id } = await req.json();
  if (!alert_id) return NextResponse.json({ error: "alert_id required" }, { status: 400 });

  await pool.query(
    `UPDATE struggle_alerts SET resolved = true, resolved_by = $2, resolved_at = NOW() WHERE id = $1`,
    [alert_id, user.user_id]
  );

  return NextResponse.json({ success: true });
}
