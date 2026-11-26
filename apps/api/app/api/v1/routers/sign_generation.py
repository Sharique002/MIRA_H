from fastapi import APIRouter, Request
from app.schemas.common import ResponseEnvelope
from app.schemas.sign_generation import SignGenerateRequest, SignGenerateResponse
from app.services.sign_generation_service import sign_generation_service

router = APIRouter()

@router.post("/sign/generate", response_model=ResponseEnvelope[SignGenerateResponse])
async def generate_sign_sequence(payload: SignGenerateRequest, request: Request):
    response = sign_generation_service.generate_sign_sequence(payload)
    return ResponseEnvelope[SignGenerateResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "sign-gen"),
        data=response
    )
