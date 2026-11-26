from fastapi import APIRouter, Request
from app.schemas.common import ResponseEnvelope
from app.schemas.speech import (
    SpeechTranscribeRequest,
    SpeechTranscribeResponse,
    SpeechSynthesizeRequest,
    SpeechSynthesizeResponse
)
from app.services.speech_service import speech_service

router = APIRouter()

@router.post("/speech/transcribe", response_model=ResponseEnvelope[SpeechTranscribeResponse])
async def transcribe_speech(payload: SpeechTranscribeRequest, request: Request):
    response = speech_service.transcribe(payload)
    return ResponseEnvelope[SpeechTranscribeResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "speech-transcribe"),
        data=response
    )

@router.post("/speech/synthesize", response_model=ResponseEnvelope[SpeechSynthesizeResponse])
async def synthesize_speech(payload: SpeechSynthesizeRequest, request: Request):
    response = speech_service.synthesize(payload)
    return ResponseEnvelope[SpeechSynthesizeResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "speech-synthesize"),
        data=response
    )
