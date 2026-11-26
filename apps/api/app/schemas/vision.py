from typing import List, Optional
from pydantic import BaseModel, Field

class LandmarkPoint(BaseModel):
    x: float = Field(..., description="Normalized horizontal coordinate [0.0, 1.0]")
    y: float = Field(..., description="Normalized vertical coordinate [0.0, 1.0]")
    z: float = Field(default=0.0, description="Normalized depth coordinate relative to wrist")
    visibility: Optional[float] = Field(default=1.0, description="Confidence score of point detection [0.0, 1.0]")

class HandLandmarks(BaseModel):
    handedness: str = Field(..., description="'Left' or 'Right'")
    score: float = Field(..., description="Hand presence probability [0.0, 1.0]")
    landmarks: List[LandmarkPoint] = Field(..., description="21 normalized 3D keypoints")

class VisionFramePayload(BaseModel):
    session_id: str = Field(..., description="Active session ID")
    timestamp_ms: int = Field(..., description="Frame client acquisition timestamp")
    frame_sequence: int = Field(..., description="Monotonically increasing sequence number")
    image_width: int = Field(default=640, description="Source frame width")
    image_height: int = Field(default=480, description="Source frame height")
    hands: List[HandLandmarks] = Field(default_factory=list, description="Extracted hands (0, 1 or 2)")
    pose_landmarks: Optional[List[LandmarkPoint]] = Field(default=None, description="Optional upper-body pose landmarks")

class VisionLandmarkResponse(BaseModel):
    session_id: str
    frame_sequence: int
    hands_detected: int
    quality_score: float
    is_normalized: bool = True
    processed_at_ms: int
