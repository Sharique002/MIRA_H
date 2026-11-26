from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class SessionStatusEnum(str, Enum):
    CREATED = "CREATED"
    INITIALIZING = "INITIALIZING"
    ACTIVE = "ACTIVE"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"
    STOPPED = "STOPPED"
    CANCELLED = "CANCELLED"

class SignLanguageEnum(str, Enum):
    ISL = "ISL"
    ASL = "ASL"

class SpokenLanguageEnum(str, Enum):
    ENGLISH = "EN"
    HINDI = "HI"

class SessionCreate(BaseModel):
    sign_language: SignLanguageEnum = Field(default=SignLanguageEnum.ISL, description="Target or source sign language")
    spoken_language: SpokenLanguageEnum = Field(default=SpokenLanguageEnum.ENGLISH, description="Target or source spoken language")
    mode: str = Field(default="sign-to-speech", description="Workflow mode: 'sign-to-speech' or 'speech-to-sign'")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary client session metadata")

class SessionResponse(BaseModel):
    session_id: str
    status: SessionStatusEnum
    sign_language: SignLanguageEnum
    spoken_language: SpokenLanguageEnum
    mode: str
    created_at: datetime
    updated_at: datetime
    active_connections: int = 0
    frame_count: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)
