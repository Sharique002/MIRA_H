from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import ResponseEnvelope, ErrorDetail
from app.schemas.sessions import SessionCreate, SessionResponse
from app.services.session_service import SessionService

router = APIRouter()

@router.post("/sessions", response_model=ResponseEnvelope[SessionResponse], status_code=status.HTTP_201_CREATED)
async def create_session(payload: SessionCreate, request: Request, db: Session = Depends(get_db)):
    service = SessionService(db)
    session = service.create_session(payload)
    return ResponseEnvelope[SessionResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "session-create"),
        data=session
    )

@router.get("/sessions/{session_id}", response_model=ResponseEnvelope[SessionResponse])
async def get_session(session_id: str, request: Request, db: Session = Depends(get_db)):
    service = SessionService(db)
    session = service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found."
        )
    return ResponseEnvelope[SessionResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "session-get"),
        data=session
    )

@router.delete("/sessions/{session_id}", response_model=ResponseEnvelope[SessionResponse])
async def terminate_session(session_id: str, request: Request, db: Session = Depends(get_db)):
    service = SessionService(db)
    session = service.terminate_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found or already released."
        )
    return ResponseEnvelope[SessionResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "session-delete"),
        data=session
    )
