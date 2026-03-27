import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "teacher") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

  const { rows } = await pool.query(`
    SELECT a.id, a.topic, a.alert_type, a.attempts, a.created_at, a.message,
           u.name, u.id as user_id
    FROM struggle_alerts a
    JOIN users u ON u.id = a.user_id
    WHERE a.resolved = false
    ORDER BY a.created_at DESC
    LIMIT 20
  `);

  const colors = ["#3B82F6","#8B5CF6","#F59E0B","#F43F5E","#10B981","#6366F1"];
  return NextResponse.json({
    alerts: rows.map((a, i) => ({
      id: a.id,
      name: a.name,
      user_id: a.user_id,
      initials: a.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
      color: colors[i % colors.length],
      topic: a.topic,
      alert_type: a.alert_type,
      attempts: a.attempts,
      message: a.message,
      time: timeAgo(a.created_at),
    }))
  });
}

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
