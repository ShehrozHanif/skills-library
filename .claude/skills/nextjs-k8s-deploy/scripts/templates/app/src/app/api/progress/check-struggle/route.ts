import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";
import { publishStruggleEvent } from "@/lib/kafka";

// Check for stuck_time and low_quiz_score struggle triggers
// Called periodically by the frontend (every 60s)
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const alerts: string[] = [];

  try {
    // 1. Stuck time: no successful submission in last 10 minutes while having recent errors
    const stuckCheck = await pool.query(
      `SELECT COUNT(*) as error_count FROM submissions
       WHERE user_id = $1 AND result = 'error'
       AND submitted_at > NOW() - INTERVAL '10 minutes'`,
      [user.user_id]
    );
    const recentSuccess = await pool.query(
      `SELECT COUNT(*) as ok_count FROM submissions
       WHERE user_id = $1 AND result = 'success'
       AND submitted_at > NOW() - INTERVAL '10 minutes'`,
      [user.user_id]
    );

    if (Number(stuckCheck.rows[0].error_count) >= 3 && Number(recentSuccess.rows[0].ok_count) === 0) {
      // Check no existing unresolved stuck_time alert
      const existing = await pool.query(
        `SELECT id FROM struggle_alerts WHERE user_id = $1 AND alert_type = 'stuck_time'
         AND resolved = false AND created_at > NOW() - INTERVAL '15 minutes'`,
        [user.user_id]
      );
      if (existing.rows.length === 0) {
        const topic = await getCurrentTopic(user.user_id);
        await pool.query(
          `INSERT INTO struggle_alerts (user_id, topic, alert_type, attempts, message)
           VALUES ($1, $2, 'stuck_time', $3, 'Student stuck for 10+ minutes with errors')`,
          [user.user_id, topic, Number(stuckCheck.rows[0].error_count)]
        );
        publishStruggleEvent({
          event_type: "stuck_time",
          user_id: user.user_id,
          user_name: user.name,
          topic,
          details: { errors_in_10min: Number(stuckCheck.rows[0].error_count) },
          timestamp: new Date().toISOString(),
        });
        alerts.push("stuck_time");
      }
    }

    // 2. Low quiz score check (across all topics)
    const lowQuiz = await pool.query(
      `SELECT topic, quiz_score FROM progress
       WHERE user_id = $1 AND quiz_score > 0 AND quiz_score < 50 AND mastery_score > 0`,
      [user.user_id]
    );
    for (const row of lowQuiz.rows) {
      const existing = await pool.query(
        `SELECT id FROM struggle_alerts WHERE user_id = $1 AND topic = $2 AND alert_type = 'low_quiz_score' AND resolved = false`,
        [user.user_id, row.topic]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO struggle_alerts (user_id, topic, alert_type, attempts, message)
           VALUES ($1, $2, 'low_quiz_score', 1, $3)`,
          [user.user_id, row.topic, `Quiz score: ${row.quiz_score}%`]
        );
        publishStruggleEvent({
          event_type: "low_quiz_score",
          user_id: user.user_id,
          user_name: user.name,
          topic: row.topic,
          details: { quiz_score: Number(row.quiz_score) },
          timestamp: new Date().toISOString(),
        });
        alerts.push(`low_quiz:${row.topic}`);
      }
    }
  } catch { /* silent */ }

  return NextResponse.json({ checked: true, alerts });
}

async function getCurrentTopic(userId: number): Promise<string> {
  try {
    const { rows } = await pool.query(
      `SELECT topic FROM progress WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0]?.topic || "General";
  } catch {
    return "General";
  }
}
