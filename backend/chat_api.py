"""FastAPI chat backend using OpenRouter (Gemini model).

Set OPENROUTER_API_KEY in your environment before running.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

try:
    import requests
except Exception as exc:  # pragma: no cover - dependency may not be installed yet
    requests = None  # type: ignore[assignment]
    _REQUESTS_IMPORT_ERROR = exc

try:
    from dotenv import load_dotenv
except Exception as exc:  # pragma: no cover - dependency may not be installed yet
    load_dotenv = None  # type: ignore[assignment]
    _DOTENV_IMPORT_ERROR = exc


app = FastAPI(title="Chat Backend", version="0.1.0")

_DOTENV_PATH = Path(__file__).with_name(".env")
if load_dotenv:
    load_dotenv(dotenv_path=_DOTENV_PATH, override=False)

_RATE_LIMIT_WINDOW_SECONDS = 60
_RATE_LIMIT_MAX_REQUESTS = 30
_rate_limit_store: dict[str, list[float]] = {}


class ChatMessage(BaseModel):
    role: str = Field(..., description="system|user|assistant")
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "google/gemini-2.0-flash-001"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_output_tokens: Optional[int] = Field(default=512, ge=1)


class ChatResponse(BaseModel):
    reply: str


def _get_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        detail = "OPENROUTER_API_KEY not set"
        if load_dotenv is None:
            detail = f"{detail}; python-dotenv missing: {_DOTENV_IMPORT_ERROR}"
        raise HTTPException(status_code=500, detail=detail)
    return api_key


def _require_requests() -> None:
    if requests is None:
        raise HTTPException(
            status_code=500,
            detail=f"requests not available: {_REQUESTS_IMPORT_ERROR}",
        )


@app.get("/")
def root() -> dict:
    return {"status": "ok"}


def _enforce_rate_limit(client_id: str) -> None:
    now = __import__("time").time()
    window_start = now - _RATE_LIMIT_WINDOW_SECONDS
    timestamps = _rate_limit_store.get(client_id, [])
    timestamps = [ts for ts in timestamps if ts >= window_start]
    if len(timestamps) >= _RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    timestamps.append(now)
    _rate_limit_store[client_id] = timestamps


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, http_request: Request) -> ChatResponse:
    client_ip = http_request.client.host if http_request.client else "unknown"
    _enforce_rate_limit(client_ip)
    _require_requests()
    api_key = _get_api_key()

    messages = []
    for message in request.messages:
        if message.role not in {"system", "user", "assistant"}:
            raise HTTPException(status_code=400, detail=f"Invalid role: {message.role}")
        messages.append({"role": message.role, "content": message.content})

    if not any(message["role"] == "user" for message in messages):
        raise HTTPException(status_code=400, detail="At least one user message is required")

    payload = {
        "model": request.model,
        "messages": messages,
        "temperature": request.temperature,
        "max_tokens": request.max_output_tokens,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        json=payload,
        headers=headers,
        timeout=60,
    )

    if not response.ok:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()
    reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    return ChatResponse(reply=reply or "")
