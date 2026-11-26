import time
from typing import List
from datetime import datetime
from app.models.base import BaseSignRecognitionModel
from app.schemas.sessions import SignLanguageEnum
from app.schemas.vision import VisionFramePayload
from app.schemas.recognition import (
    RecognitionPredictResponse,
    PredictionStatusEnum,
    CandidateSign
)
from app.schemas.models import (
    ModelMetadataItem,
    ModelStatusEnum,
    ModelEvaluationMetrics,
    ImplementationTypeEnum,
    TrainingStatusEnum,
    CheckpointStatusEnum,
)

class ISLRecognitionModel(BaseSignRecognitionModel):
    """
    Dedicated Indian Sign Language (ISL) geometric rule-based heuristic classifier.
    Not a trained neural network; uses coordinate-threshold heuristics for common ISL gestures
    (NAMASTE, HELLO, THANK_YOU, YES, HELP).
    """
    def __init__(self):
        super().__init__(model_id="isl-geometric-heuristic-v1", sign_language=SignLanguageEnum.ISL)
        self.legacy_model_ids = ["isl-tcn-baseline-v0.1"]
        self.version = "1.0.0-heuristic"
        self.checkpoint_path = None
        self._is_loaded = True

    def load(self) -> bool:
        # Rule-based heuristic requires no neural checkpoint; mark rule engine ready.
        self._is_loaded = True
        return True

    def health_check(self) -> bool:
        return self._is_loaded

    def get_metadata(self) -> ModelMetadataItem:
        return ModelMetadataItem(
            model_id=self.model_id,
            legacy_model_ids=self.legacy_model_ids,
            model_name="ISL Geometric Rule-Based Heuristic Classifier",
            version=self.version,
            model_type="RULE_BASED_HEURISTIC",
            implementation_type=ImplementationTypeEnum.RULE_BASED_HEURISTIC,
            training_status=TrainingStatusEnum.NOT_TRAINED,
            checkpoint_status=CheckpointStatusEnum.NOT_AVAILABLE,
            checkpoint_path=self.checkpoint_path,
            supported_sign_language=SignLanguageEnum.ISL,
            status=ModelStatusEnum.RULE_BASED_READY if self._is_loaded else ModelStatusEnum.NOT_AVAILABLE,
            device="cpu",
            dataset_provenance="None (Hand-crafted geometric rules; not trained on a dataset)",
            license="MIT / Research Only",
            parameters_count=None,
            parameter_count_status="NOT_APPLICABLE",
            evaluation=ModelEvaluationMetrics(
                top1_accuracy=None,
                top5_accuracy=None,
                macro_f1=None,
                evaluated_samples=0,
                evaluation_date=None,
                signer_disjoint_verified=False,
                per_class_metrics_available=False
            ),
            known_limitations=[
                "Experimental geometric rule-based heuristic; not a trained neural model",
                "No neural checkpoint weights exist; continuous sentence recognition is not supported",
                "Requires clear lighting and unobstructed two-hand or single-hand visibility"
            ]
        )

    def predict(
        self,
        request_id: str,
        session_id: str,
        frames: List[VisionFramePayload],
        min_confidence_threshold: float = 0.60
    ) -> RecognitionPredictResponse:
        start_time = time.perf_counter()
        
        if not frames:
            return RecognitionPredictResponse(
                request_id=request_id,
                session_id=session_id,
                sign_language=self.sign_language,
                status=PredictionStatusEnum.NO_SIGN_DETECTED,
                top_prediction=None,
                candidates=[],
                model_name=self.model_id,
                model_version=self.version,
                processing_duration_ms=(time.perf_counter() - start_time) * 1000.0
            )

        # Inspect latest frame hands
        latest_frame = frames[-1]
        if not latest_frame.hands:
            return RecognitionPredictResponse(
                request_id=request_id,
                session_id=session_id,
                sign_language=self.sign_language,
                status=PredictionStatusEnum.NO_SIGN_DETECTED,
                top_prediction=None,
                candidates=[],
                model_name=self.model_id,
                model_version=self.version,
                processing_duration_ms=(time.perf_counter() - start_time) * 1000.0
            )

        # Analyze geometric features across temporal buffer
        candidates: List[CandidateSign] = []
        num_hands = len(latest_frame.hands)
        
        # Check for two hands pressed together or close at chest height (NAMASTE in ISL)
        if num_hands == 2:
            left_hand = latest_frame.hands[0] if latest_frame.hands[0].handedness == "Left" else latest_frame.hands[1]
            right_hand = latest_frame.hands[1] if latest_frame.hands[1].handedness == "Right" else latest_frame.hands[0]
            
            # Distance between wrists
            dx = abs(left_hand.landmarks[0].x - right_hand.landmarks[0].x)
            dy = abs(left_hand.landmarks[0].y - right_hand.landmarks[0].y)
            if dx < 0.25 and dy < 0.20:
                conf = max(0.72, min(0.96, 1.0 - (dx + dy)))
                candidates.append(CandidateSign(
                    gloss="NAMASTE",
                    display_text="Namaste / Welcome",
                    confidence=conf,
                    uncertainty=1.0 - conf
                ))
            else:
                candidates.append(CandidateSign(
                    gloss="HELP",
                    display_text="Help / Sahayata",
                    confidence=0.74,
                    uncertainty=0.26
                ))
        elif num_hands == 1:
            hand = latest_frame.hands[0]
            wrist = hand.landmarks[0]
            index_tip = hand.landmarks[8]
            thumb_tip = hand.landmarks[4]
            middle_tip = hand.landmarks[12]
            pinky_tip = hand.landmarks[20]
            
            # Check for open palm waved near head/chest (HELLO)
            is_open_palm = (index_tip.y < hand.landmarks[6].y and 
                            middle_tip.y < hand.landmarks[10].y and 
                            pinky_tip.y < hand.landmarks[18].y)
            
            # Check if hand is moving horizontally
            x_positions = [f.hands[0].landmarks[0].x for f in frames if f.hands]
            x_variance = max(x_positions) - min(x_positions) if len(x_positions) > 3 else 0.0

            if is_open_palm and x_variance > 0.05:
                candidates.append(CandidateSign(
                    gloss="HELLO",
                    display_text="Hello / Namaskar",
                    confidence=0.88,
                    uncertainty=0.12
                ))
            elif is_open_palm:
                candidates.append(CandidateSign(
                    gloss="THANK_YOU",
                    display_text="Thank you / Dhanyavaad",
                    confidence=0.82,
                    uncertainty=0.18
                ))
            else:
                # Fist or pointing gesture
                candidates.append(CandidateSign(
                    gloss="YES",
                    display_text="Yes / Haan",
                    confidence=0.75,
                    uncertainty=0.25
                ))

        if not candidates or candidates[0].confidence < min_confidence_threshold:
            status = PredictionStatusEnum.LOW_CONFIDENCE if candidates else PredictionStatusEnum.NO_SIGN_DETECTED
            top_pred = None
        else:
            status = PredictionStatusEnum.PREDICTION_AVAILABLE
            top_pred = candidates[0]

        duration = (time.perf_counter() - start_time) * 1000.0
        return RecognitionPredictResponse(
            request_id=request_id,
            session_id=session_id,
            sign_language=self.sign_language,
            status=status,
            top_prediction=top_pred,
            candidates=candidates,
            model_name=self.model_id,
            model_version=self.version,
            processing_duration_ms=round(duration, 2)
        )
