"""LearnFlow AI Agent — FastAPI + Dapr pub/sub microservice template."""

import os
import httpx
from fastapi import FastAPI, Request
from agents import get_system_prompt, route_message, AGENT_TOPICS, calculate_mastery, detect_struggle

AGENT_NAME = os.environ.get("AGENT_NAME", "triage")
SUBSCRIBE_TOPIC = os.environ.get("SUBSCRIBE_TOPIC", "learning")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "mock")
DAPR_HTTP_PORT = os.environ.get("DAPR_HTTP_PORT", "3500")
PUBSUB_NAME = "kafka-pubsub"

app = FastAPI(title=f"LearnFlow {AGENT_NAME} Agent")


@app.get("/health")
async def health():
    return {"status": "healthy", "agent": AGENT_NAME}


@app.get("/dapr/subscribe")
async def subscribe():
    """Programmatic Dapr pub/sub subscription."""
    topics = [t.strip() for t in SUBSCRIBE_TOPIC.split(",") if t.strip()]
    return [
        {
            "pubsubname": PUBSUB_NAME,
            "topic": topic,
            "route": "/handle",
        }
        for topic in topics
    ]


@app.post("/handle")
async def handle(request: Request):
    """Process incoming Dapr pub/sub message."""
    envelope = await request.json()
    data = envelope.get("data", {})
    user_message = data.get("message", "")
    user_id = data.get("user_id", "anonymous")
    source_topic = data.get("topic", SUBSCRIBE_TOPIC.split(",")[0])

    # Progress agent: programmatic mastery + struggle detection before AI call
    if AGENT_NAME == "progress":
        mastery_data = data.get("mastery", {})
        mastery = calculate_mastery(
            exercises_completed=float(mastery_data.get("exercises_completed", 0)),
            quiz_score=float(mastery_data.get("quiz_score", 0)),
            code_quality=float(mastery_data.get("code_quality", 0)),
            streak=int(mastery_data.get("streak", 0)),
        )
        is_struggling = detect_struggle(
            same_error_count=int(data.get("same_error_count", 0)),
            stuck_minutes=int(data.get("stuck_minutes", 0)),
            quiz_score=float(mastery_data.get("quiz_score", 100)),
            failed_executions=int(data.get("failed_executions", 0)),
            message=user_message,
        )
        # Save computed mastery state
        await save_state(user_id, {
            "mastery": mastery,
            "struggling": is_struggling,
            "last_topic": source_topic,
        })
        # Include mastery context in AI prompt
        user_message = (
            f"{user_message}\n\n[Mastery: {mastery['score']}% ({mastery['level']}), "
            f"Struggling: {is_struggling}]"
        )

    response_text = await call_ai(user_message)

    # Publish response to responses topic
    response_payload = {
        "agent": AGENT_NAME,
        "user_id": user_id,
        "message": response_text,
        "source_topic": source_topic,
    }
    if AGENT_NAME == "progress":
        response_payload["mastery"] = mastery
        response_payload["struggling"] = is_struggling
    await publish_event("responses", response_payload)

    return {"status": "ok"}


@app.post("/chat")
async def chat(request: Request):
    """Direct HTTP endpoint (Triage agent only)."""
    body = await request.json()
    user_message = body.get("message", "")
    user_id = body.get("user_id", "anonymous")

    if AGENT_NAME != "triage":
        return {"error": f"{AGENT_NAME} does not accept direct chat"}

    # Route to specialist via pub/sub
    target_topic = route_message(user_message)
    await publish_event(target_topic, {
        "message": user_message,
        "user_id": user_id,
        "topic": target_topic,
    })

    return {"status": "routed", "topic": target_topic, "agent": AGENT_NAME}


async def call_ai(message: str) -> str:
    """Call OpenAI-compatible API or return mock response."""
    if OPENAI_API_KEY == "mock":
        return f"[{AGENT_NAME}] Mock response for: {message[:50]}"

    system_prompt = get_system_prompt(AGENT_NAME)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                "max_tokens": 512,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def publish_event(topic: str, data: dict):
    """Publish event via Dapr sidecar."""
    url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/{PUBSUB_NAME}/{topic}"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.post(url, json=data)
        except httpx.HTTPError:
            pass  # Sidecar may not be ready in tests


async def save_state(key: str, value: dict):
    """Save state via Dapr state store."""
    url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0/state/statestore"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.post(url, json=[{"key": key, "value": value}])
        except httpx.HTTPError:
            pass
