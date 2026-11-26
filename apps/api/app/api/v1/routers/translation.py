from fastapi import APIRouter, Request
from app.schemas.common import ResponseEnvelope
from app.schemas.translation import TranslationRequest, TranslationResponse
from app.services.translation_service import translation_service

router = APIRouter()

@router.post("/translation/translate", response_model=ResponseEnvelope[TranslationResponse])
async def translate_gloss(payload: TranslationRequest, request: Request):
    response = translation_service.translate(payload)
    return ResponseEnvelope[TranslationResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "trans-gloss"),
        data=response
    )
