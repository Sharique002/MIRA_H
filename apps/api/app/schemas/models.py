from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.sessions import SignLanguageEnum

class ModelStatusEnum(str, Enum):
    LOADED = "loaded"
    RULE_BASED_READY = "rule_based_ready"
    STANDBY = "standby"
    NOT_INSTALLED = "not_installed"
    NOT_TRAINED = "not_trained"
    NOT_AVAILABLE = "not_available"
    ERROR = "error"

class ImplementationTypeEnum(str, Enum):
    RULE_BASED_HEURISTIC = "RULE_BASED_HEURISTIC"
    TRAINED_NEURAL_MODEL = "TRAINED_NEURAL_MODEL"
    UNTRAINED_ARCHITECTURE = "UNTRAINED_ARCHITECTURE"
    INTERFACE_ONLY = "INTERFACE_ONLY"

class TrainingStatusEnum(str, Enum):
    NOT_TRAINED = "NOT_TRAINED"
    TRAINED = "TRAINED"

class CheckpointStatusEnum(str, Enum):
    NOT_AVAILABLE = "NOT_AVAILABLE"
    AVAILABLE = "AVAILABLE"
    INVALID = "INVALID"

class ModelEvaluationMetrics(BaseModel):
    top1_accuracy: Optional[float] = None
    top5_accuracy: Optional[float] = None
    macro_f1: Optional[float] = None
    evaluated_samples: Optional[int] = None
    evaluation_date: Optional[str] = None
    signer_disjoint_verified: bool = False
    per_class_metrics_available: bool = False

class ModelMetadataItem(BaseModel):
    model_id: str
    legacy_model_ids: List[str] = Field(default_factory=list)
    model_name: str
    version: str
    model_type: str = Field(..., description="e.g. 'RULE_BASED_HEURISTIC', 'Temporal Convolutional Network (TCN)'")
    implementation_type: ImplementationTypeEnum
    training_status: TrainingStatusEnum
    checkpoint_status: CheckpointStatusEnum
    checkpoint_path: Optional[str] = None
    supported_sign_language: SignLanguageEnum
    status: ModelStatusEnum
    device: str = "cpu"
    dataset_provenance: str
    license: str
    parameters_count: Optional[int] = None
    parameter_count_status: str = Field(default="NOT_APPLICABLE")
    evaluation: ModelEvaluationMetrics
    known_limitations: List[str] = Field(default_factory=list)

class ModelRegistryResponse(BaseModel):
    models: List[ModelMetadataItem]
    system_default_device: str = "cpu"
    torch_available: bool
    total_models_registered: int
