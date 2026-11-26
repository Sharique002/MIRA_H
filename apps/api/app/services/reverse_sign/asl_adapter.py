"""Isolated American Sign Language (ASL) rule-based reverse-sign adapter."""

from typing import Iterable

from app.schemas.sessions import SignLanguageEnum
from app.services.reverse_sign.base_adapter import (
    BaseReverseSignAdapter,
    ReverseSignDefinition,
    SourcePhraseMapping,
    make_keyframe,
)

_ASL_PROVENANCE = (
    "MIRA-H R-02 experimental ASL lexical/procedural keyframe baseline; "
    "unverified by qualified deaf ASL signers (UNVERIFIED_EXPERIMENTAL)."
)


def _src(phrases_en: Iterable[str], phrases_deva: Iterable[str], phrases_rom: Iterable[str]):
    return tuple(
        [SourcePhraseMapping(p, "english") for p in phrases_en]
        + [SourcePhraseMapping(p, "devanagari_hindi") for p in phrases_deva]
        + [SourcePhraseMapping(p, "romanized_hindi") for p in phrases_rom]
    )


class ASLReverseSignAdapter(BaseReverseSignAdapter):
    """Rule-based lexical and procedural pose adapter designated exclusively for ASL."""

    adapter_id = "asl-reverse-rule-adapter-v1"
    sign_language = SignLanguageEnum.ASL

    def _build_definitions(self) -> Iterable[ReverseSignDefinition]:
        return (
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ASL,
                gloss_id="HELLO",
                duration_ms=900,
                hand_configuration="asl_flat_b_palm_outward",
                movement_type="asl_forehead_salute_arc",
                body_position="upright_neutral",
                non_manual_marker="friendly_smile",
                spatial_reference="right_temple_to_side",
                keyframes=(
                    make_keyframe(
                        0,
                        "asl_flat_b",
                        [
                            ("right_shoulder", -0.5, 0.25, 0.35),
                            ("right_elbow", 1.7, 0.0, 0.0),
                            ("right_wrist", -0.1, 0.15, 0.0),
                        ],
                        "friendly_smile",
                    ),
                    make_keyframe(
                        450,
                        "asl_flat_b",
                        [
                            ("right_shoulder", -0.35, 0.55, 0.55),
                            ("right_elbow", 1.15, 0.2, 0.0),
                            ("right_wrist", 0.05, 0.3, 0.0),
                        ],
                        "friendly_smile",
                    ),
                    make_keyframe(
                        900,
                        "open_flat",
                        [
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                            ("right_wrist", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                # Hindi greetings ("नमस्ते" / "namaste") map semantically to ASL HELLO,
                # never leaking ISL's NAMASTE pose into the ASL pipeline.
                source_mappings=_src(
                    ("hello", "hi"),
                    ("नमस्ते", "नमस्कार", "प्रणाम", "हैलो", "हेलो"),
                    ("namaste", "namaskar", "pranam"),
                ),
                provenance=_ASL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ASL,
                gloss_id="WELCOME",
                duration_ms=1000,
                hand_configuration="asl_open_palm_dominant_sweep",
                movement_type="asl_dominant_arm_open_torso_sweep",
                body_position="upright_neutral",
                non_manual_marker="welcoming_smile",
                spatial_reference="front_right_to_chest",
                keyframes=(
                    make_keyframe(
                        0,
                        "asl_open_palm_up",
                        [
                            ("right_shoulder", -0.3, 0.45, 0.15),
                            ("right_elbow", 0.75, 0.0, 0.0),
                            ("right_wrist", 0.0, 0.2, 0.0),
                        ],
                        "welcoming_smile",
                    ),
                    make_keyframe(
                        520,
                        "asl_open_palm_up",
                        [
                            ("right_shoulder", -0.3, -0.1, -0.1),
                            ("right_elbow", 1.4, 0.0, 0.0),
                            ("right_wrist", 0.0, -0.2, 0.0),
                        ],
                        "welcoming_smile",
                    ),
                    make_keyframe(
                        1000,
                        "open_flat",
                        [
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                            ("right_wrist", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("welcome",),
                    ("आपका स्वागत है", "स्वागत"),
                    ("swagat",),
                ),
                provenance=_ASL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ASL,
                gloss_id="THANK_YOU",
                duration_ms=900,
                hand_configuration="asl_flat_b_fingers_together",
                movement_type="asl_chin_touch_forward_arc",
                body_position="upright_neutral",
                non_manual_marker="warm_nod",
                spatial_reference="chin_to_front_space",
                keyframes=(
                    make_keyframe(
                        0,
                        "asl_flat_b",
                        [
                            ("right_shoulder", -0.5, 0.2, 0.0),
                            ("right_elbow", 1.9, 0.0, 0.0),
                        ],
                        "warm_nod",
                    ),
                    make_keyframe(
                        480,
                        "asl_flat_b",
                        [
                            ("right_shoulder", -0.3, 0.1, 0.0),
                            ("right_elbow", 0.7, 0.0, 0.0),
                        ],
                        "warm_nod",
                    ),
                    make_keyframe(
                        900,
                        "open_flat",
                        [
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("thank you", "thank", "thanks"),
                    ("बहुत धन्यवाद", "धन्यवाद", "शुक्रिया"),
                    ("dhanyavaad", "dhanyawad", "shukriya"),
                ),
                provenance=_ASL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ASL,
                gloss_id="WATER",
                duration_ms=800,
                hand_configuration="asl_w_handshape_three_fingers",
                movement_type="asl_tap_chin_twice_w_hand",
                body_position="upright_neutral",
                non_manual_marker="neutral",
                spatial_reference="chin_center",
                keyframes=(
                    make_keyframe(
                        0,
                        "asl_w_handshape",
                        [
                            ("right_shoulder", -0.45, 0.15, 0.0),
                            ("right_elbow", 1.85, 0.0, 0.0),
                            ("right_wrist", -0.15, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                    make_keyframe(
                        400,
                        "asl_w_handshape",
                        [
                            ("right_shoulder", -0.48, 0.18, 0.0),
                            ("right_elbow", 1.95, 0.0, 0.0),
                            ("right_wrist", -0.25, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                    make_keyframe(
                        800,
                        "open_flat",
                        [
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                            ("right_wrist", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("water",),
                    ("पानी", "जल"),
                    ("pani", "paani", "jal"),
                ),
                provenance=_ASL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ASL,
                gloss_id="YES",
                duration_ms=700,
                hand_configuration="asl_s_fist_handshape",
                movement_type="asl_wrist_nodding_downward",
                body_position="upright_neutral",
                non_manual_marker="affirmative_head_nod",
                spatial_reference="chest_height",
                keyframes=(
                    make_keyframe(
                        0,
                        "asl_s_fist",
                        [
                            ("right_shoulder", -0.28, 0.12, 0.0),
                            ("right_elbow", 1.35, 0.0, 0.0),
                            ("right_wrist", 0.35, 0.0, 0.0),
                        ],
                        "affirmative_head_nod",
                    ),
                    make_keyframe(
                        350,
                        "asl_s_fist",
                        [
                            ("right_wrist", -0.25, 0.0, 0.0),
                        ],
                        "affirmative_head_nod",
                    ),
                    make_keyframe(
                        700,
                        "open_flat",
                        [
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                            ("right_wrist", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("yes",),
                    ("हाँ", "जी"),
                    ("haan", "ha", "ji"),
                ),
                provenance=_ASL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ASL,
                gloss_id="NO",
                duration_ms=700,
                hand_configuration="asl_index_middle_snap_thumb",
                movement_type="asl_quick_finger_thumb_closure",
                body_position="upright_neutral",
                non_manual_marker="negative_head_shake",
                spatial_reference="chest_height",
                keyframes=(
                    make_keyframe(
                        0,
                        "asl_pinch_open",
                        [
                            ("right_shoulder", -0.32, 0.15, 0.0),
                            ("right_elbow", 1.4, 0.0, 0.0),
                            ("neck", 0.0, -0.15, 0.0),
                        ],
                        "negative_head_shake",
                    ),
                    make_keyframe(
                        350,
                        "asl_pinch_closed",
                        [
                            ("right_wrist", -0.2, 0.1, 0.0),
                            ("neck", 0.0, 0.15, 0.0),
                        ],
                        "negative_head_shake",
                    ),
                    make_keyframe(
                        700,
                        "open_flat",
                        [
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                            ("right_wrist", 0.0, 0.0, 0.0),
                            ("neck", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("no",),
                    ("नहीं", "मना"),
                    ("nahi", "nahin"),
                ),
                provenance=_ASL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ASL,
                gloss_id="HELP",
                duration_ms=900,
                hand_configuration="asl_a_fist_on_open_left_palm",
                movement_type="asl_upward_lift_left_palm_right_fist",
                body_position="upright_neutral",
                non_manual_marker="supportive_nod",
                spatial_reference="chest_center",
                keyframes=(
                    make_keyframe(
                        0,
                        "asl_a_fist_palm",
                        [
                            ("left_shoulder", -0.32, -0.15, 0.0),
                            ("left_elbow", 1.3, 0.0, 0.0),
                            ("right_shoulder", -0.38, 0.1, 0.0),
                            ("right_elbow", 1.5, 0.0, 0.0),
                        ],
                        "supportive_nod",
                    ),
                    make_keyframe(
                        450,
                        "asl_a_fist_palm",
                        [
                            ("left_shoulder", -0.55, -0.15, 0.0),
                            ("right_shoulder", -0.6, 0.1, 0.0),
                        ],
                        "supportive_nod",
                    ),
                    make_keyframe(
                        900,
                        "open_flat",
                        [
                            ("left_shoulder", 0.0, 0.0, 0.0),
                            ("left_elbow", 0.0, 0.0, 0.0),
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("help", "assist", "assistance"),
                    ("मदद", "सहायता"),
                    ("madad", "sahayata"),
                ),
                provenance=_ASL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ASL,
                gloss_id="PLEASE",
                duration_ms=850,
                hand_configuration="asl_flat_palm_chest_contact",
                movement_type="asl_flat_palm_clockwise_chest_circle",
                body_position="upright_neutral",
                non_manual_marker="polite_nod",
                spatial_reference="sternum_chest_center",
                keyframes=(
                    make_keyframe(
                        0,
                        "asl_flat_b",
                        [
                            ("right_shoulder", -0.35, -0.05, -0.15),
                            ("right_elbow", 1.55, 0.0, 0.0),
                        ],
                        "polite_nod",
                    ),
                    make_keyframe(
                        450,
                        "asl_flat_b",
                        [
                            ("right_shoulder", -0.45, 0.1, -0.1),
                            ("right_elbow", 1.65, 0.0, 0.0),
                        ],
                        "polite_nod",
                    ),
                    make_keyframe(
                        850,
                        "open_flat",
                        [
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("please",),
                    ("कृपया", "मेहरबानी"),
                    ("kripaya",),
                ),
                provenance=_ASL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ASL,
                gloss_id="I_LOVE_YOU",
                duration_ms=1050,
                hand_configuration="asl_ily_thumb_index_pinky_extended",
                movement_type="asl_ily_forward_hold_gentle_sway",
                body_position="upright_neutral",
                non_manual_marker="warm_smile",
                spatial_reference="shoulder_right_forward",
                keyframes=(
                    make_keyframe(
                        0,
                        "asl_ily_handshape",
                        [
                            ("right_shoulder", -0.35, 0.25, 0.25),
                            ("right_elbow", 1.35, 0.0, 0.0),
                            ("right_wrist", 0.0, 0.15, 0.0),
                        ],
                        "warm_smile",
                    ),
                    make_keyframe(
                        550,
                        "asl_ily_handshape",
                        [
                            ("right_shoulder", -0.38, 0.2, 0.2),
                            ("right_elbow", 1.25, 0.0, 0.0),
                            ("right_wrist", 0.0, -0.15, 0.0),
                        ],
                        "warm_smile",
                    ),
                    make_keyframe(
                        1050,
                        "open_flat",
                        [
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                            ("right_wrist", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("i love you", "love you"),
                    ("मैं तुमसे प्यार करता हूँ", "मैं तुमसे प्रेम करता हूँ"),
                    (),
                ),
                provenance=_ASL_PROVENANCE,
            ),
        )
