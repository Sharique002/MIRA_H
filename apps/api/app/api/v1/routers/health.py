from fastapi import APIRouter, Request
from datetime import datetime
from app.schemas.common import ResponseEnvelope

router = APIRouter()

@router.get("/health", response_model=ResponseEnvelope[dict])
async def check_health(request: Request):
    return ResponseEnvelope[dict](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "direct-check"),
        data={
            "status": "healthy",
            "service": "mira-h-api",
            "version": "2.0.0",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
