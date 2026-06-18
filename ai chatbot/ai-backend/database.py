"""
Database models and session management for SkillNova AI Chatbot.

Supports:
- PostgreSQL via ``DATABASE_URL=postgresql+psycopg2://...``
- SQLite fallback (default, file: ``chat_logs.db``)
"""
from __future__ import annotations

import datetime
import os

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool

Base = declarative_base()


# ─────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────
class ChatLog(Base):
    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True)
    session_id = Column(String, index=True)
    prompt = Column(Text)
    response = Column(Text)
    extracted_topic = Column(String)
    user_role = Column(String)
    language = Column(String, default="en")
    route_taken = Column(String)
    docs_retrieved = Column(Integer)
    was_escalated = Column(Boolean, default=False)

    tools_used = Column(String, default="")
    latency_ms = Column(Integer, default=0)
    llm_calls_count = Column(Integer, default=0)
    confidence = Column(Float, nullable=True)

    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(Integer, primary_key=True)
    session_id = Column(String)
    query = Column(Text)
    language = Column(String, default="en")
    user_role = Column(String)
    status = Column(String, default="pending")
    admin_reply = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    answered_at = Column(DateTime, nullable=True)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True)
    session_id = Column(String, index=True)
    user_message = Column(Text)
    bot_response = Column(Text)
    turn_number = Column(Integer)

    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────
# Engine
# ─────────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "chat_logs.db")
    DATABASE_URL = f"sqlite:///{db_path}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all tables (idempotent — safe to call at startup)."""
    Base.metadata.create_all(bind=engine)


# Eager init — keeps the original behaviour but is safe with SQLite.
init_db()
