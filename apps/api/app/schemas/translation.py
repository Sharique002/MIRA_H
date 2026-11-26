from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.sessions import SignLanguageEnum, SpokenLanguageEnum

class SharedSemanticRepresentation(BaseModel):
    source_sign_language: SignLanguageEnum
    target_spoken_language: SpokenLanguageEnum
    gloss_sequence: List[str] = Field(..., description="Ordered list of sign glosses (e.g. ['HELLO', 'HOW', 'YOU'])")
    semantic_intent: Optional[str] = Field(None, description="Inferred conversational intent (e.g., 'greeting', 'inquiry')")
    confidence: float = Field(..., description="Overall confidence of intermediate representation [0.0, 1.0]")
    uncertainty: float = Field(default=0.0, description="Uncertainty metric [0.0, 1.0]")
    evidence_references: List[str] = Field(default_factory=list, description="IDs or frame timestamps supporting gloss sequence")

class TranslationRequest(BaseModel):
    semantic_representation: SharedSemanticRepresentation
    preserve_unaffected_spans: bool = True

class TranslationResponse(BaseModel):
    source_glosses: List[str]
    target_language: SpokenLanguageEnum
    translated_text: str
    confidence: float
    evidence_grounded: bool = True
    correction_notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
