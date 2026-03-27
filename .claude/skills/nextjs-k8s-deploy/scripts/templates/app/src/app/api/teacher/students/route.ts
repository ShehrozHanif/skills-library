import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "teacher") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

  const { rows } = await pool.query(`
    SELECT
      u.id, u.name, u.email, u.created_at,
      COALESCE(ROUND(AVG(p.mastery_score)), 0) as avg_mastery,
      (SELECT topic FROM progress WHERE user_id = u.id ORDER BY updated_at DESC LIMIT 1) as current_topic,
      CASE
        WHEN EXISTS (SELECT 1 FROM struggle_alerts WHERE user_id = u.id AND resolved = false) THEN 'Struggling'
        WHEN COALESCE(AVG(p.mastery_score), 0) < 40 THEN 'Needs Help'
        ELSE 'On Track'
      END as status,
      EXISTS (
        SELECT 1 FROM chat_messages WHERE user_id = u.id AND created_at > NOW() - INTERVAL '30 minutes'
      ) as active
    FROM users u
    LEFT JOIN progress p ON p.user_id = u.id
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY u.name
  `);

  const colors = ["#3B82F6","#6366F1","#8B5CF6","#F59E0B","#10B981","#F43F5E","#60A5FA","#34D399"];
  return NextResponse.json({
    students: rows.map((s, i) => ({
      id: s.id,
      name: s.name,
      initials: s.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
      color: colors[i % colors.length],
      module: s.current_topic || "Getting Started",
      mastery: Number(s.avg_mastery),
      status: s.status,
      active: s.active,
    }))
  });
}
