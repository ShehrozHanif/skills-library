import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import pool from "@/lib/db";
import { getUser } from "@/lib/api-auth";
import { publishStruggleEvent } from "@/lib/kafka";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Map user messages to Python curriculum topics
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Variables": ["variable", "assign", "int", "float", "string", "str", "type", "casting", "input"],
  "Data Types": ["data type", "list", "dict", "dictionary", "tuple", "set", "boolean", "bool", "none", "type()"],
  "Loops": ["for", "while", "loop", "iterate", "range", "break", "continue", "enumerate"],
  "Lists": ["list", "append", "remove", "sort", "slice", "index", "comprehension", "array"],
  "Functions": ["function", "def", "return", "parameter", "argument", "lambda", "scope", "recursion"],
  "OOP": ["class", "object", "method", "inheritance", "self", "init", "__init__", "oop", "encapsulation", "polymorphism"],
  "Error Handling": ["try", "except", "error", "exception", "raise", "finally", "traceback", "catch"],
  "Libraries": ["import", "module", "package", "pip", "library", "numpy", "pandas", "os", "sys", "json"],
};

function detectTopic(message: string): string | null {
  const lower = message.toLowerCase();
  let bestTopic = null;
  let bestScore = 0;
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; bestTopic = topic; }
  }
  return bestScore > 0 ? bestTopic : null;
}

function calcLevel(score: number): string {
  if (score >= 91) return "Mastered";
  if (score >= 71) return "Proficient";
  if (score >= 41) return "Learning";
  return "Beginner";
}

async function updateProgressForChat(userId: number, topic: string) {
  try {
    // Get current progress for this topic
    const { rows } = await pool.query(
      `SELECT id, mastery_score, exercises_completed, quiz_score, code_quality, streak
       FROM progress WHERE user_id = $1 AND topic = $2`,
      [userId, topic]
    );
    if (rows.length === 0) return;
    const p = rows[0];
    // Each chat interaction adds a small boost to quiz_score (learning engagement)
    const newQuiz = Math.min(100, Number(p.quiz_score || 0) + 3);
    const ec = Number(p.exercises_completed || 0);
    const cq = Number(p.code_quality || 0);
    const st = Math.min(Number(p.streak || 0) * 10, 100);
    const score = Math.round(ec * 0.4 + newQuiz * 0.3 + cq * 0.2 + st * 0.1);
    await pool.query(
      `UPDATE progress SET quiz_score = $2, mastery_score = $3, level = $4, updated_at = NOW()
       WHERE id = $1`,
      [p.id, newQuiz, score, calcLevel(score)]
    );
  } catch { /* silent fail */ }
}

const SYSTEM_PROMPTS: Record<string, { agent: string; prompt: string }> = {
  concepts: {
    agent: "Concepts Agent",
    prompt: `You are the LearnFlow Concepts Agent — an expert Python tutor.
Explain Python concepts clearly with short code examples. Adapt to the student's level.
Use analogies when helpful. Keep responses concise (under 200 words) and focused on one concept.
Format code in markdown fenced blocks. Be encouraging and supportive.`,
  },
  code: {
    agent: "Code Review Agent",
    prompt: `You are the LearnFlow Code Review Agent — a Python code review expert.
Review Python code for correctness, PEP 8 style, and best practices.
Give specific, actionable feedback. Highlight strengths AND improvements.
If there's a bug, explain it clearly but guide the student to fix it themselves.
Keep responses concise with code examples in markdown.`,
  },
  debug: {
    agent: "Debug Agent",
    prompt: `You are the LearnFlow Debug Agent — a Python debugging specialist.
Help students find and fix bugs step-by-step. Ask clarifying questions about errors.
Guide them through debugging rather than giving the answer directly.
Teach debugging strategies (print statements, reading tracebacks, isolating the issue).
Keep responses focused and under 200 words.`,
  },
  exercise: {
    agent: "Exercise Agent",
    prompt: `You are the LearnFlow Exercise Agent — a Python exercise generator.
Create Python practice exercises appropriate for the student's level.
Include: clear instructions, starter code, expected output, and hints.
Difficulty levels: beginner, intermediate, advanced.
Format with markdown. Keep exercises focused on one concept.`,
  },
  struggle: {
    agent: "Progress Agent",
    prompt: `You are the LearnFlow Progress Agent — a supportive learning coach.
The student is struggling. Be extra patient, encouraging, and supportive.
Break down concepts into smaller steps. Use simpler language.
Offer to start from basics. Celebrate small wins.
Never make the student feel bad for not understanding. Under 200 words.`,
  },
  triage: {
    agent: "Triage Agent",
    prompt: `You are the LearnFlow Triage Agent — the intelligent router for a Python tutoring platform.
Your job is to understand the student's intent and route them to the right specialist.
When a message is ambiguous, ask ONE clarifying question to determine if they need:
- Concept explanation → Concepts Agent
- Code review/debugging → Code Review or Debug Agent
- Practice exercises → Exercise Agent
- Emotional support → Progress Agent
Keep your response under 50 words. Be warm but efficient. Always end by connecting them to the right agent.`,
  },
};

const ROUTE_KEYWORDS: Record<string, string[]> = {
  struggle: ["don't understand", "confused", "stuck", "help me", "frustrated", "give up", "too hard", "lost", "impossible", "i can't"],
  code: ["review", "check my code", "bug", "error", "fix", "debug", "traceback", "exception", "wrong output", "not working", "my code"],
  exercise: ["exercise", "practice", "challenge", "problem", "quiz", "test me", "give me a", "assignment", "try"],
  concepts: ["what is", "explain", "how does", "concept", "theory", "understand", "definition", "mean", "difference between", "why does", "how do", "what are"],
};

function keywordRoute(message: string): string | null {
  const lower = message.toLowerCase();
  for (const kw of ROUTE_KEYWORDS.struggle) {
    if (lower.includes(kw)) return "struggle";
  }
  const scores: Record<string, number> = {};
  for (const [topic, keywords] of Object.entries(ROUTE_KEYWORDS)) {
    if (topic === "struggle") continue;
    scores[topic] = keywords.filter((kw) => lower.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] > 0) return best[0];
  return null;
}

async function nlpRoute(message: string, apiKey: string): Promise<string> {
  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a message classifier for a Python tutoring platform. Classify the student's message into exactly ONE category. Reply with ONLY the category name, nothing else.

Categories:
- struggle: Student is emotionally frustrated, confused, wants to give up, or expressing difficulty
- code: Student wants code review, has a bug, error, or wants debugging help
- exercise: Student wants practice problems, exercises, challenges, or quizzes
- concepts: Student wants to learn or understand a Python concept, theory, or explanation
- debug: Student has a specific error/traceback and needs step-by-step debugging
- triage: Message is ambiguous and could fit multiple categories

Reply with exactly one word: struggle, code, exercise, concepts, debug, or triage.`,
        },
        { role: "user", content: message },
      ],
      max_tokens: 10,
      temperature: 0,
    });
    const result = (completion.choices[0]?.message?.content || "").trim().toLowerCase();
    const valid = ["struggle", "code", "exercise", "concepts", "debug", "triage"];
    return valid.includes(result) ? result : "concepts";
  } catch {
    return "concepts";
  }
}

async function routeMessage(message: string, apiKey: string): Promise<string> {
  // Try NLP-based routing first (uses OpenAI for intelligent classification)
  if (apiKey && apiKey !== "mock") {
    const nlpResult = await nlpRoute(message, apiKey);
    return nlpResult;
  }
  // Fallback to keyword matching when no API key
  return keywordRoute(message) || "concepts";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, user_id } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "No message provided" }, { status: 400 });
  }

  // Route to specialist using NLP (OpenAI) with keyword fallback
  const route = await routeMessage(message, OPENAI_API_KEY);
  const specialist = SYSTEM_PROMPTS[route] || SYSTEM_PROMPTS.concepts;

  // If no API key, return a helpful mock response
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "mock") {
    return NextResponse.json({
      message: `[${specialist.agent}] I'd love to help with that! To enable real AI responses, set your OPENAI_API_KEY in the environment.`,
      agent: specialist.agent,
      route,
    });
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: specialist.prompt },
        { role: "user", content: message },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const aiMessage = completion.choices[0]?.message?.content || "I'm not sure how to respond to that. Could you rephrase?";

    // Update progress for detected topic
    const user = getUser(req);
    const detectedTopic = detectTopic(message);
    if (user && detectedTopic) {
      await updateProgressForChat(user.user_id, detectedTopic);
    }

    // Create struggle alert + Kafka event for frustrated messages
    if (user && route === "struggle") {
      const topic = detectedTopic || "General";
      try {
        await pool.query(
          `INSERT INTO struggle_alerts (user_id, topic, alert_type, attempts, message)
           VALUES ($1, $2, 'frustrated_message', 1, $3)`,
          [user.user_id, topic, message.slice(0, 500)]
        );
        publishStruggleEvent({
          event_type: "frustrated_message",
          user_id: user.user_id,
          user_name: user.name,
          topic,
          details: { message: message.slice(0, 200), agent: specialist.agent },
          timestamp: new Date().toISOString(),
        });
      } catch { /* don't fail the response */ }
    }

    // Check for low quiz score and create alert
    if (user && detectedTopic) {
      try {
        const prog = await pool.query(
          `SELECT quiz_score, mastery_score FROM progress WHERE user_id = $1 AND topic = $2`,
          [user.user_id, detectedTopic]
        );
        if (prog.rows.length > 0 && Number(prog.rows[0].quiz_score) < 50 && Number(prog.rows[0].mastery_score) > 0) {
          const existing = await pool.query(
            `SELECT id FROM struggle_alerts WHERE user_id = $1 AND topic = $2 AND alert_type = 'low_quiz_score' AND resolved = false`,
            [user.user_id, detectedTopic]
          );
          if (existing.rows.length === 0) {
            await pool.query(
              `INSERT INTO struggle_alerts (user_id, topic, alert_type, attempts, message)
               VALUES ($1, $2, 'low_quiz_score', 1, $3)`,
              [user.user_id, detectedTopic, `Quiz score: ${prog.rows[0].quiz_score}%`]
            );
            publishStruggleEvent({
              event_type: "low_quiz_score",
              user_id: user.user_id,
              user_name: user.name,
              topic: detectedTopic,
              details: { quiz_score: Number(prog.rows[0].quiz_score) },
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch { /* silent */ }
    }

    return NextResponse.json({
      message: aiMessage,
      agent: specialist.agent,
      route,
      topic: detectedTopic,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "AI service error";
    // If it's an auth error, provide helpful message
    if (errorMsg.includes("401") || errorMsg.includes("Incorrect API key")) {
      return NextResponse.json({
        message: "OpenAI API key is invalid. Please check your OPENAI_API_KEY.",
        agent: "System",
        error: true,
      }, { status: 200 }); // 200 so frontend shows it as a message
    }
    return NextResponse.json({
      message: `Sorry, I couldn't process that right now. (${errorMsg.slice(0, 100)})`,
      agent: specialist.agent,
      error: true,
    }, { status: 200 });
  }
}
