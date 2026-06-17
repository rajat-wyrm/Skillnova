"""
Frontend-facing /api/ai/* aliases.

The chatbot frontend (src/shared/services/api/assistantApi.js) hits
four endpoints:

  GET  /api/ai/suggestions     -> { data: [{ id, label, prompt }] }
  GET  /api/ai/capabilities    -> { data: [{ id, title, description }] }
  GET  /api/ai/welcome-message -> { message }
  POST /api/ai/chat            -> { reply, sources, confidence, session_id }

`/api/ai/chat` delegates to the same `_process` helper used by
`/api/chat`, so every backend improvement ships to both surfaces.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel

from main import _process, ChatRequest, ChatResponse


class AiChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    role: str = "Intern"


class WelcomeResponse(BaseModel):
    message: str


class SuggestionsResponse(BaseModel):
    data: List[dict]


class CapabilitiesResponse(BaseModel):
    data: List[dict]


SUGGESTIONS = [
    {"id": "s1", "label": "Internship policy", "prompt": "What is the internship policy?"},
    {"id": "s2", "label": "Attendance", "prompt": "How do I mark attendance?"},
    {"id": "s3", "label": "Task submission", "prompt": "How do I submit a task?"},
    {"id": "s4", "label": "Weekly report", "prompt": "When is the weekly report due?"},
    {"id": "s5", "label": "Ratings", "prompt": "How does performance evaluation work?"},
    {"id": "s6", "label": "Meetings", "prompt": "How do I schedule a meeting?"},
]

CAPABILITIES = [
    {"id": "c1", "title": "Internship Q&A", "description": "Policies, guidelines, and procedures"},
    {"id": "c2", "title": "Task help", "description": "Submission rules and validation"},
    {"id": "c3", "title": "Reports & reviews", "description": "Weekly reports and performance evaluation"},
    {"id": "c4", "title": "Platform navigation", "description": "How to use SkillNova features"},
]


@router.get("/suggestions", response_model=SuggestionsResponse)
def ai_suggestions():
    return SuggestionsResponse(data=SUGGESTIONS)


@router.get("/capabilities", response_model=CapabilitiesResponse)
def ai_capabilities():
    return CapabilitiesResponse(data=CAPABILITIES)


@router.get("/welcome-message", response_model=WelcomeResponse)
def ai_welcome_message():
    return WelcomeResponse(
        message=(
            "Hi, I am the SkillNova AI assistant. "
            "Ask me about tasks, attendance, reports, meetings, "
            "evaluations, and platform questions."
        )
    )


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(req: AiChatRequest, request: Request):
    """Delegate to the main chat pipeline so the response shape matches."""
    internal = ChatRequest(
        message=req.message,
        session_id=req.session_id,
        role=req.role,
    )
    return await _process(internal, request)