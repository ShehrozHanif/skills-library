"""Agent system prompts, routing logic, and mastery calculation for LearnFlow tutoring agents."""

from typing import Optional


# Topic-to-agent mapping
AGENT_TOPICS = {
    "learning": "concepts",
    "code": "codereview",
    "exercise": "exercise",
    "struggle": "progress",
    "responses": "progress",
}

SYSTEM_PROMPTS = {
    "triage": (
        "You are the LearnFlow Triage Agent. Analyze student messages and route them "
        "to the correct specialist. Categories: 'learning' for concept questions, "
        "'code' for code review or debugging, 'exercise' for practice requests, "
        "'struggle' for students showing frustration or repeated errors. "
        "Respond with the category name only."
    ),
    "concepts": (
        "You are the LearnFlow Concepts Agent. Explain Python concepts clearly with "
        "examples. Adapt explanations to the student's level. Use analogies. "
        "Keep responses concise and focused on one concept at a time."
    ),
    "codereview": (
        "You are the LearnFlow Code Review Agent. Review Python code for correctness, "
        "style (PEP 8), and best practices. Provide specific, actionable feedback. "
        "Highlight both strengths and areas for improvement."
    ),
    "debug": (
        "You are the LearnFlow Debug Agent. Help students find and fix bugs in their "
        "Python code. Guide them through debugging step-by-step rather than giving "
        "the answer directly. Ask clarifying questions about error messages."
    ),
    "exercise": (
        "You are the LearnFlow Exercise Agent. Generate Python practice exercises "
        "appropriate for the student's level. Include clear instructions, starter code, "
        "expected output, and hints. Difficulty: beginner, intermediate, advanced."
    ),
    "progress": (
        "You are the LearnFlow Progress Agent. Track student learning progress. "
        "Calculate mastery scores using: exercises (40%), quizzes (30%), "
        "code quality (20%), streak (10%). Detect struggle patterns and alert teachers."
    ),
}

# Keywords for triage routing
ROUTE_KEYWORDS = {
    "learning": [
        "what is", "explain", "how does", "concept", "theory", "understand",
        "definition", "mean", "difference between", "why does",
    ],
    "code": [
        "review", "check my code", "bug", "error", "fix", "debug",
        "traceback", "exception", "wrong output", "not working",
    ],
    "exercise": [
        "exercise", "practice", "challenge", "problem", "quiz", "test me",
        "give me a", "try", "assignment",
    ],
    "struggle": [
        "don't understand", "confused", "stuck", "help me", "frustrated",
        "give up", "too hard", "lost", "impossible",
    ],
}


def get_system_prompt(agent_name: str) -> str:
    """Get system prompt for a given agent."""
    return SYSTEM_PROMPTS.get(agent_name, SYSTEM_PROMPTS["triage"])


def calculate_mastery(
    exercises_completed: float = 0.0,
    quiz_score: float = 0.0,
    code_quality: float = 0.0,
    streak: int = 0,
) -> dict:
    """Calculate topic mastery using the weighted formula.

    All inputs are percentages (0-100). Streak is days count, capped at 100.
    Returns mastery score, level name, and level color.
    """
    streak_pct = min(streak * 10, 100)  # 10 days = 100%

    score = (
        exercises_completed * 0.40
        + quiz_score * 0.30
        + code_quality * 0.20
        + streak_pct * 0.10
    )
    score = round(min(max(score, 0), 100), 2)

    if score >= 91:
        level, color = "Mastered", "Blue"
    elif score >= 71:
        level, color = "Proficient", "Green"
    elif score >= 41:
        level, color = "Learning", "Yellow"
    else:
        level, color = "Beginner", "Red"

    return {"score": score, "level": level, "color": color}


STRUGGLE_TRIGGERS = {
    "same_error_count": 3,       # Same error type 3+ times
    "stuck_minutes": 10,         # Stuck > 10 min
    "quiz_threshold": 50,        # Quiz < 50%
    "failed_executions": 5,      # 5+ failed code executions
}


def detect_struggle(
    same_error_count: int = 0,
    stuck_minutes: int = 0,
    quiz_score: float = 100.0,
    failed_executions: int = 0,
    message: str = "",
) -> bool:
    """Detect if a student is struggling based on business rule triggers."""
    if same_error_count >= STRUGGLE_TRIGGERS["same_error_count"]:
        return True
    if stuck_minutes >= STRUGGLE_TRIGGERS["stuck_minutes"]:
        return True
    if quiz_score < STRUGGLE_TRIGGERS["quiz_threshold"]:
        return True
    if failed_executions >= STRUGGLE_TRIGGERS["failed_executions"]:
        return True
    # Keyword detection for message-based struggle
    msg_lower = message.lower()
    for kw in ROUTE_KEYWORDS.get("struggle", []):
        if kw in msg_lower:
            return True
    return False


def route_message(message: str) -> str:
    """Route a student message to the appropriate topic based on keywords."""
    msg_lower = message.lower()

    # Check struggle first (higher priority)
    for keyword in ROUTE_KEYWORDS["struggle"]:
        if keyword in msg_lower:
            return "struggle"

    # Check other categories
    scores = {}
    for topic, keywords in ROUTE_KEYWORDS.items():
        if topic == "struggle":
            continue
        scores[topic] = sum(1 for kw in keywords if kw in msg_lower)

    if scores:
        best = max(scores, key=scores.get)
        if scores[best] > 0:
            return best

    # Default to learning
    return "learning"
