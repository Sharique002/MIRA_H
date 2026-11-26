from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.sessions import SignLanguageEnum
from app.schemas.vision import VisionFramePayload

class PredictionStatusEnum(str, Enum):
    NOT_PROCESSED = "not_processed"
    PROCESSING = "processing"
    PREDICTION_AVAILABLE = "prediction_available"
    NO_SIGN_DETECTED = "no_sign_detected"
    UNSUPPORTED_INPUT = "unsupported_input"
    LOW_CONFIDENCE = "low_confidence"
    MODEL_UNAVAILABLE = "model_unavailable"
    PROCESSING_FAILURE = "processing_failure"

class CandidateSign(BaseModel):
    gloss: str = Field(..., description="Sign gloss identifier (e.g., 'HELLO', 'THANK_YOU', 'NAMASTE')")
    display_text: str = Field(..., description="Human-readable text representation")
    confidence: float = Field(..., description="Softmax confidence score [0.0, 1.0]")
    uncertainty: float = Field(default=0.0, description="Estimated prediction uncertainty [0.0, 1.0]")

class RecognitionPredictRequest(BaseModel):
    session_id: str
    sign_language: SignLanguageEnum = SignLanguageEnum.ISL
    model_id: Optional[str] = Field(default=None, description="Optional canonical or legacy model ID override")
    frames: List[VisionFramePayload] = Field(..., description="Temporal buffer of landmark frames (e.g. 15-30 frames)")
    min_confidence_threshold: float = Field(default=0.60, description="Minimum confidence for valid prediction")

class RecognitionPredictResponse(BaseModel):
    request_id: str
    session_id: str
    sign_language: SignLanguageEnum
    status: PredictionStatusEnum
    top_prediction: Optional[CandidateSign] = None
    candidates: List[CandidateSign] = Field(default_factory=list)
    model_name: str
    model_version: str
    processing_duration_ms: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
