"""
Database module for SETU backend.

Handles SQLite database operations for chat history.
"""

from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import List, Optional

# SQLite database file
DATABASE_URL = "sqlite:///./setu_chat_history.db"

# Create engine and session
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ChatHistory(Base):
    """Chat history model."""
    __tablename__ = "chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_query = Column(String, nullable=False)
    ai_response = Column(String, nullable=False)
    audio_url = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
    print("[DB] Database initialized")


def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_interaction(user_query: str, ai_response: str, audio_url: Optional[str] = None) -> int:
    """
    Save a chat interaction to the database.
    
    Args:
        user_query: The user's question/query
        ai_response: The AI's response text
        audio_url: Optional URL to the audio file
    
    Returns:
        The ID of the saved record
    """
    db = SessionLocal()
    try:
        chat_entry = ChatHistory(
            user_query=user_query,
            ai_response=ai_response,
            audio_url=audio_url,
            timestamp=datetime.utcnow()
        )
        db.add(chat_entry)
        db.commit()
        db.refresh(chat_entry)
        print(f"[DB] Saved interaction: ID={chat_entry.id}")
        return chat_entry.id
    except Exception as e:
        db.rollback()
        print(f"[DB] Error saving interaction: {e}")
        raise
    finally:
        db.close()


def get_history(limit: int = 10) -> List[dict]:
    """
    Get recent chat history.
    
    Args:
        limit: Maximum number of records to return
    
    Returns:
        List of chat history records as dictionaries
    """
    db = SessionLocal()
    try:
        records = db.query(ChatHistory).order_by(ChatHistory.timestamp.desc()).limit(limit).all()
        return [
            {
                "id": record.id,
                "user_query": record.user_query,
                "ai_response": record.ai_response,
                "audio_url": record.audio_url,
                "timestamp": record.timestamp.isoformat() if record.timestamp else None
            }
            for record in records
        ]
    except Exception as e:
        print(f"[DB] Error fetching history: {e}")
        return []
    finally:
        db.close()
