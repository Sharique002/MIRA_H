import uuid
from typing import Dict, Optional
from app.schemas.sessions import SignLanguageEnum
from app.schemas.recognition import (
    RecognitionPredictRequest,
    RecognitionPredictResponse,
    PredictionStatusEnum
)
from app.models.base import BaseSignRecognitionModel
from app.models.isl_model import ISLRecognitionModel
from app.models.asl_model import ASLRecognitionModel

class RecognitionService:
    def __init__(self):
        self._models: Dict[SignLanguageEnum, BaseSignRecognitionModel] = {
            SignLanguageEnum.ISL: ISLRecognitionModel(),
            SignLanguageEnum.ASL: ASLRecognitionModel(),
        }

    def get_model_by_id(self, model_id: str) -> Optional[BaseSignRecognitionModel]:
        """Resolve a canonical or legacy model ID to the active model instance."""
        for model in self._models.values():
            legacy_ids = getattr(model, "legacy_model_ids", [])
            if model.model_id == model_id or model_id in legacy_ids:
                return model
        return None

    def predict(self, request: RecognitionPredictRequest) -> RecognitionPredictResponse:
        if request.model_id:
            model = self.get_model_by_id(request.model_id)
        else:
            model = self._models.get(request.sign_language)
        req_id = f"req-{uuid.uuid4().hex[:8]}"

        if not model:
            return RecognitionPredictResponse(
                request_id=req_id,
                session_id=request.session_id,
                sign_language=request.sign_language,
                status=PredictionStatusEnum.MODEL_UNAVAILABLE,
                top_prediction=None,
                candidates=[],
                model_name=request.model_id or f"unknown-{request.sign_language}",
                model_version="0.0.0",
                processing_duration_ms=0.0
            )

        if model.sign_language != request.sign_language:
            return RecognitionPredictResponse(
                request_id=req_id,
                session_id=request.session_id,
                sign_language=request.sign_language,
                status=PredictionStatusEnum.UNSUPPORTED_INPUT,
                top_prediction=None,
                candidates=[],
                model_name=model.model_id,
                model_version=getattr(model, "version", "0.0.0"),
                processing_duration_ms=0.0
            )

        if not model.health_check():
            return RecognitionPredictResponse(
                request_id=req_id,
                session_id=request.session_id,
                sign_language=request.sign_language,
                status=PredictionStatusEnum.MODEL_UNAVAILABLE,
                top_prediction=None,
                candidates=[],
                model_name=model.model_id,
                model_version="unavailable",
                processing_duration_ms=0.0
            )

        return model.predict(
            request_id=req_id,
            session_id=request.session_id,
            frames=request.frames,
            min_confidence_threshold=request.min_confidence_threshold
        )

    def get_model(self, sign_language: SignLanguageEnum) -> BaseSignRecognitionModel:
        return self._models.get(sign_language)

recognition_service = RecognitionService()
