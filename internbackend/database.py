"""
SQLAlchemy session and ORM model for chat history.

Uses SQLite by default (zero setup) and can be swapped to PostgreSQL via
the DATABASE_URL env var. Designed for one process — uses a connection
pool sized for the FastAPI worker count.

Schema:

    chat_sessions (
        id            BIGSERIAL PRIMARY KEY,
        session_id    TEXT NOT NULL,
        turn_number   INTEGER NOT NULL,
        user_message  TEXT NOT NULL,
        bot_response  TEXT NOT NULL,
        created_at    TIMESTAMP DEFAULT now()
    )

    INDEX idx_chat_sessions_session_id ON chat_sessions(session_id, turn_number)
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import Column, Integer, String, Text, Index, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session


Base = declarative_base()


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(128), nullable=False, index=True)
    turn_number = Column(Integer, nullable=False)
    user_message = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=False)

    __table_args__ = (
        Index("idx_chat_sessions_session_turn", "session_id", "turn_number"),
    )


def _database_url() -> str:
    return os.getenv("DATABASE_URL", "sqlite:///./skillnova_chat.db")


_engine = create_engine(
    _database_url(),
    pool_pre_ping=True,
    pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
    future=True,
)

SessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False, future=True)


def init_db() -> None:
    """Create tables if they don't exist. Idempotent."""
    Base.metadata.create_all(_engine)


@contextmanager
def session_scope() -> Iterator[Session]:
    """Yield a session, commit on success, rollback on error."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()