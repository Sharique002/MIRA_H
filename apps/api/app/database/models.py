import json
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Float
from app.database.session import Base

class SessionRecord(Base):
    __tablename__ = "sessions"

    id = Column(String(64), primary_key=True, index=True)
    status = Column(String(32), default="CREATED", nullable=False)
    sign_language = Column(String(16), default="ISL", nullable=False)
    spoken_language = Column(String(16), default="EN", nullable=False)
    mode = Column(String(32), default="sign-to-speech", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    frame_count = Column(Integer, default=0)
    extra_metadata_json = Column(Text, default="{}")

    def get_metadata(self):
        try:
            return json.loads(self.extra_metadata_json or "{}")
        except Exception:
            return {}

    def set_metadata(self, data):
        self.extra_metadata_json = json.dumps(data or {})

class AuditLogRecord(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), nullable=True)
    event_type = Column(String(64), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
