import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { topic, difficulty, num_questions } = await req.json();
  if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const count = Math.min(num_questions || 5, 10);
  const diff = difficulty || "beginner";

  if (!OPENAI_API_KEY || OPENAI_API_KEY === "mock") {
    // Mock quiz for demo
    const mockQuestions = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      question: `Sample ${topic} question ${i + 1}: What is the correct Python syntax?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: 0,
      explanation: "This is a sample explanation.",
    }));
    const { rows } = await pool.query(
      `INSERT INTO quizzes (topic, difficulty, title, questions, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [topic, diff, `${topic} Quiz (Demo)`, JSON.stringify(mockQuestions), user.user_id]
    );
    return NextResponse.json({ quiz_id: rows[0].id, title: `${topic} Quiz (Demo)`, questions: mockQuestions });
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Python quiz generator for a learning platform. Generate exactly ${count} multiple-choice questions about "${topic}" at ${diff} level.

Return ONLY valid JSON array. Each question object must have:
{
  "id": 1,
  "question": "Question text",
  "options": ["A answer", "B answer", "C answer", "D answer"],
  "correct": 0,
  "explanation": "Why the correct answer is right"
}

"correct" is the 0-based index of the correct option.
Questions should test practical Python knowledge, not trivia.
Include code snippets in questions where appropriate (use \\n for newlines in code).
No markdown — just the JSON array.`,
        },
        { role: "user", content: `Generate ${count} ${diff} Python quiz questions about ${topic}` },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || "[]";
    const questions = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim());

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Failed to generate valid questions" }, { status: 500 });
    }

    const title = `${topic} Quiz — ${diff.charAt(0).toUpperCase() + diff.slice(1)}`;
    const { rows } = await pool.query(
      `INSERT INTO quizzes (topic, difficulty, title, questions, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [topic, diff, title, JSON.stringify(questions), user.user_id]
    );

    return NextResponse.json({ quiz_id: rows[0].id, title, questions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Quiz generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
