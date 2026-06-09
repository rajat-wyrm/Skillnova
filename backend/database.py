"""
Database models and session management for SkillNova (Production Ready)

Supports:
- PostgreSQL (production)
- SQLite (fallback for local dev)
"""

from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime,
    Text, Boolean, Float
)
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool
import datetime
import os

# -----------------------------------------------
# BASE
# -----------------------------------------------
Base = declarative_base()

# -----------------------------------------------
# MODELS
# -----------------------------------------------
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


# -----------------------------------------------
# 🔥 NEW: USER MODEL (GOOGLE + PHONE AUTH)
# -----------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

    # identity
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)

    # google auth
    google_id = Column(String, unique=True, nullable=True)

    # profile
    name = Column(String, nullable=True)
    role = Column(String, default="Intern")

    # auth
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)

    # session
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


# -----------------------------------------------
# DATABASE CONFIG (PRODUCTION SAFE)
# -----------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(BASE_DIR, "chat_logs.db")
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

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# -----------------------------------------------
# INIT DB (SAFE)
# -----------------------------------------------
def init_db():
    Base.metadata.create_all(bind=engine)


init_db()