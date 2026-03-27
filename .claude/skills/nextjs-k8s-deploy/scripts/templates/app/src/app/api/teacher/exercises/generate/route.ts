import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUser } from "@/lib/api-auth";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "teacher") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

  const { prompt, difficulty, topic } = await req.json();
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  if (!OPENAI_API_KEY || OPENAI_API_KEY === "mock") {
    return NextResponse.json({
      title: "Practice: " + (topic || "Python"),
      difficulty: difficulty || "beginner",
      description: `Practice exercise for ${topic || "Python"}. (Set OPENAI_API_KEY for AI-generated exercises)`,
      starter_code: "# Write your solution here\n",
      expected_output: "# Expected output will appear here",
      topic: topic || "General",
    });
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Python exercise generator for a learning platform. Generate a Python exercise based on the teacher's request.
Return ONLY valid JSON with these fields:
{
  "title": "Short exercise title",
  "difficulty": "${difficulty || 'beginner'}",
  "description": "Clear instructions for the student",
  "starter_code": "Python starter code with comments",
  "expected_output": "What the correct solution should output",
  "topic": "${topic || 'General'}"
}
No markdown, no explanation — just the JSON object.`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const exercise = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    return NextResponse.json(exercise);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
