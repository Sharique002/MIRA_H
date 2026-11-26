from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import ResponseEnvelope
from app.schemas.vision import VisionFramePayload, VisionLandmarkResponse
from app.services.vision_service import VisionService
from app.services.session_service import SessionService

router = APIRouter()

@router.post("/vision/landmarks", response_model=ResponseEnvelope[VisionLandmarkResponse])
async def ingest_landmarks(payload: VisionFramePayload, request: Request, db: Session = Depends(get_db)):
    # Increment frame count in session
    session_service = SessionService(db)
    session_service.increment_frame_count(payload.session_id)
    
    # Process and normalize coordinates
    result = VisionService.process_and_normalize_frame(payload)
    
    return ResponseEnvelope[VisionLandmarkResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "vision-ingest"),
        data=result
    )
