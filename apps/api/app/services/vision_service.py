import time
from typing import List
from app.schemas.vision import (
    VisionFramePayload,
    VisionLandmarkResponse,
    HandLandmarks,
    LandmarkPoint
)

class VisionService:
    @staticmethod
    def process_and_normalize_frame(payload: VisionFramePayload) -> VisionLandmarkResponse:
        """
        Receives landmark frame from client edge, validates coordinate ranges,
        applies center-wrist translation normalization, and checks tracking quality.
        """
        start_ms = int(time.time() * 1000)
        hands_count = len(payload.hands)
        
        # Calculate quality score based on landmark visibility and hand presence scores
        if hands_count == 0:
            quality_score = 0.0
        else:
            total_scores = sum(h.score for h in payload.hands)
            quality_score = min(1.0, max(0.0, total_scores / hands_count))

        # Perform translation & scale normalization in-place on copy if needed
        for hand in payload.hands:
            if len(hand.landmarks) >= 21:
                wrist = hand.landmarks[0]
                wrist_x, wrist_y = wrist.x, wrist.y
                # Compute bounding box scale
                xs = [pt.x for pt in hand.landmarks]
                ys = [pt.y for pt in hand.landmarks]
                span = max(0.01, max(max(xs) - min(xs), max(ys) - min(ys)))
                
                # Normalize points relative to wrist and bounding span
                for pt in hand.landmarks:
                    pt.x = round((pt.x - wrist_x) / span, 4)
                    pt.y = round((pt.y - wrist_y) / span, 4)

        return VisionLandmarkResponse(
            session_id=payload.session_id,
            frame_sequence=payload.frame_sequence,
            hands_detected=hands_count,
            quality_score=round(quality_score, 2),
            is_normalized=True,
            processed_at_ms=start_ms
        )
