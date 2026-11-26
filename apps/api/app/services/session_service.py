import uuid
from datetime import datetime
from typing import Optional, Dict
from sqlalchemy.orm import Session
from app.database.models import SessionRecord, AuditLogRecord
from app.schemas.sessions import (
    SessionCreate,
    SessionResponse,
    SessionStatusEnum,
    SignLanguageEnum,
    SpokenLanguageEnum
)

class SessionService:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, payload: SessionCreate) -> SessionResponse:
        session_id = f"mira-{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        record = SessionRecord(
            id=session_id,
            status=SessionStatusEnum.ACTIVE.value,
            sign_language=payload.sign_language.value,
            spoken_language=payload.spoken_language.value,
            mode=payload.mode,
            created_at=now,
            updated_at=now,
            frame_count=0
        )
        record.set_metadata(payload.metadata or {})
        
        self.db.add(record)
        self.db.add(AuditLogRecord(
            session_id=session_id,
            event_type="SESSION_CREATED",
            message=f"Session created with mode={payload.mode}, sign={payload.sign_language}, spoken={payload.spoken_language}"
        ))
        self.db.commit()
        self.db.refresh(record)

        return self._to_response(record)

    def get_session(self, session_id: str) -> Optional[SessionResponse]:
        record = self.db.query(SessionRecord).filter(SessionRecord.id == session_id).first()
        if not record:
            return None
        return self._to_response(record)

    def terminate_session(self, session_id: str) -> Optional[SessionResponse]:
        record = self.db.query(SessionRecord).filter(SessionRecord.id == session_id).first()
        if not record:
            return None
        record.status = SessionStatusEnum.COMPLETED.value
        record.updated_at = datetime.utcnow()
        self.db.add(AuditLogRecord(
            session_id=session_id,
            event_type="SESSION_TERMINATED",
            message="Session terminated and resources released."
        ))
        self.db.commit()
        self.db.refresh(record)
        return self._to_response(record)

    def increment_frame_count(self, session_id: str) -> None:
        record = self.db.query(SessionRecord).filter(SessionRecord.id == session_id).first()
        if record:
            record.frame_count += 1
            record.updated_at = datetime.utcnow()
            self.db.commit()

    def _to_response(self, record: SessionRecord) -> SessionResponse:
        return SessionResponse(
            session_id=record.id,
            status=SessionStatusEnum(record.status),
            sign_language=SignLanguageEnum(record.sign_language),
            spoken_language=SpokenLanguageEnum(record.spoken_language),
            mode=record.mode,
            created_at=record.created_at,
            updated_at=record.updated_at,
            active_connections=1 if record.status == SessionStatusEnum.ACTIVE.value else 0,
            frame_count=record.frame_count,
            metadata=record.get_metadata()
        )
