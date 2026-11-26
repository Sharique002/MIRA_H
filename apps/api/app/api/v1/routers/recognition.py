from fastapi import APIRouter, Request
from app.schemas.common import ResponseEnvelope
from app.schemas.recognition import RecognitionPredictRequest, RecognitionPredictResponse
from app.services.recognition_service import recognition_service

router = APIRouter()

@router.post("/recognition/predict", response_model=ResponseEnvelope[RecognitionPredictResponse])
async def predict_sign(payload: RecognitionPredictRequest, request: Request):
    prediction = recognition_service.predict(payload)
    return ResponseEnvelope[RecognitionPredictResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "rec-predict"),
        data=prediction
    )
