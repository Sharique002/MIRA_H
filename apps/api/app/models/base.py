from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.sessions import SignLanguageEnum
from app.schemas.vision import VisionFramePayload
from app.schemas.recognition import RecognitionPredictResponse, PredictionStatusEnum, CandidateSign
from app.schemas.models import ModelMetadataItem, ModelStatusEnum, ModelEvaluationMetrics

class BaseSignRecognitionModel(ABC):
    """
    Abstract interface for sign language recognition models.
    ISL and ASL implementations must independently implement this contract.
    """
    def __init__(self, model_id: str, sign_language: SignLanguageEnum):
        self.model_id = model_id
        self.sign_language = sign_language
        self._is_loaded = False

    @abstractmethod
    def load(self) -> bool:
        """Load weights and initialize model runtime."""
        pass

    @abstractmethod
    def predict(
        self,
        request_id: str,
        session_id: str,
        frames: List[VisionFramePayload],
        min_confidence_threshold: float = 0.60
    ) -> RecognitionPredictResponse:
        """Execute inference over temporal landmark sequence."""
        pass

    @abstractmethod
    def get_metadata(self) -> ModelMetadataItem:
        """Return honest, verified metadata regarding the model."""
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """Check operational viability of the model."""
        pass

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded
