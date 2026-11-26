from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, model_validator
from app.schemas.sessions import SignLanguageEnum, SpokenLanguageEnum

CANONICAL_REVERSE_ADAPTERS: Dict[str, SignLanguageEnum] = {
    "isl-reverse-rule-adapter-v1": SignLanguageEnum.ISL,
    "asl-reverse-rule-adapter-v1": SignLanguageEnum.ASL,
}


class JointAngleTarget(BaseModel):
    joint: str = Field(..., description="Target joint name: e.g. 'left_shoulder', 'right_elbow', 'right_wrist'")
    pitch: float = Field(0.0, description="Rotation around X axis in radians")
    yaw: float = Field(0.0, description="Rotation around Y axis in radians")
    roll: float = Field(0.0, description="Rotation around Z axis in radians")


class SignKeyframe(BaseModel):
    time_offset_ms: int = Field(..., ge=0, description="Milliseconds from sign start")
    joints: List[JointAngleTarget] = Field(default_factory=list)
    hand_shape: str = Field(default="open_flat", description="Standard hand shape identifier")
    non_manual_marker: Optional[str] = Field(default="neutral", description="Head tilt, eyebrows, mouth posture")


class SignSequenceItem(BaseModel):
    sign_id: str = Field(..., description="Standardized gloss identifier (e.g., 'HELLO', 'WATER', 'NAMASTE')")
    temporal_order: int = Field(..., ge=0)
    duration_ms: int = Field(default=800, gt=0, description="Duration of this sign gesture in milliseconds")
    hand_configuration: str = Field(..., description="Descriptor of hand shape and fingers")
    movement_type: str = Field(..., description="Movement trajectory: e.g., 'forward_nod', 'wave', 'arc_chest'")
    body_position: str = Field(default="neutral_torso", description="Upper torso positioning")
    non_manual_marker: Optional[str] = Field(default="neutral", description="Facial/head modifier")
    spatial_reference: str = Field(default="signing_space_front", description="Signing space locus")
    keyframes: List[SignKeyframe] = Field(default_factory=list, description="Interpolation targets for 3D engine")


class SignMappingProvenance(BaseModel):
    gloss_id: str
    sign_language: SignLanguageEnum
    source_vocabulary_matched: List[str] = Field(default_factory=list)
    provenance: str
    verification_status: str = Field(default="UNVERIFIED_EXPERIMENTAL")
    classification: str = Field(default="EXPERIMENTAL")


class AdapterModeEnum(str, Enum):
    RULE_BASED_LEXICON = "RULE_BASED_LEXICON"


class SignGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Spoken/written sentence to convert into sign sequence")
    source_language: SpokenLanguageEnum = SpokenLanguageEnum.ENGLISH
    target_sign_language: SignLanguageEnum = SignLanguageEnum.ISL
    adapter_id: Optional[str] = Field(
        default=None,
        description="Optional canonical reverse-sign adapter ID ('isl-reverse-rule-adapter-v1' or 'asl-reverse-rule-adapter-v1')",
    )

    @model_validator(mode="after")
    def validate_adapter_compatibility(self) -> "SignGenerateRequest":
        """Reject unknown or cross-language mismatched adapter IDs cleanly."""
        if self.adapter_id is None:
            return self
        if self.adapter_id not in CANONICAL_REVERSE_ADAPTERS:
            allowed = ", ".join(sorted(CANONICAL_REVERSE_ADAPTERS.keys()))
            raise ValueError(
                f"Unknown or unsupported reverse-sign adapter_id '{self.adapter_id}'. Expected one of: {allowed}."
            )
        expected_lang = CANONICAL_REVERSE_ADAPTERS[self.adapter_id]
        if expected_lang != self.target_sign_language:
            raise ValueError(
                f"Adapter '{self.adapter_id}' is designated for '{expected_lang.value}' and cannot be used with target_sign_language '{self.target_sign_language.value}'."
            )
        return self


class SignGenerateResponse(BaseModel):
    source_text: str
    source_language: SpokenLanguageEnum = SpokenLanguageEnum.ENGLISH
    target_sign_language: SignLanguageEnum
    adapter_id: str
    adapter_mode: str = Field(default=AdapterModeEnum.RULE_BASED_LEXICON.value)
    verification_status: str = Field(default="EXPERIMENTAL")
    is_supported: bool = Field(default=False)
    sequence: List[SignSequenceItem]
    total_duration_ms: int = Field(..., ge=0)
    vocabulary_coverage: float = Field(..., ge=0.0, le=1.0, description="Fraction of tokens recognized in sign lexicon [0.0, 1.0]")
    unsupported_tokens: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    mapping_provenance: List[SignMappingProvenance] = Field(default_factory=list)
