"""
Versioned API aliases.

Mirrors the current /api/chat* surface under /api/v1/ so we can ship
breaking changes later by introducing /api/v2/ while keeping v1
backwards compatible. Mounted as a FastAPI APIRouter with no
dependency on the underlying routes — they are re-imported by name.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel

import main as _main


router = APIRouter(prefix="/api/v1", tags=["v1"])


class V1ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    role: str = "Intern"


@router.post("/chat")
async def v1_chat(req: V1ChatRequest, request: Request):
    internal = _main.ChatRequest(
        message=req.message,
        session_id=req.session_id,
        role=req.role,
    )
    return await _main.chat(internal, request)


@router.post("/chat/stream")
async def v1_chat_stream(req: V1ChatRequest, request: Request):
    return await _main.chat_stream(req, request)


@router.get("/health")
async def v1_health():
    return await _main.health()


@router.get("/session")
async def v1_session():
    return _main.create_session()