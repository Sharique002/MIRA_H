"""Isolated Indian Sign Language (ISL) rule-based reverse-sign adapter."""

from typing import Iterable

from app.schemas.sessions import SignLanguageEnum
from app.services.reverse_sign.base_adapter import (
    BaseReverseSignAdapter,
    ReverseSignDefinition,
    SourcePhraseMapping,
    make_keyframe,
)

_ISL_PROVENANCE = (
    "MIRA-H R-02 experimental ISL lexical/procedural keyframe baseline; "
    "unverified by qualified deaf ISL signers (UNVERIFIED_EXPERIMENTAL)."
)


def _src(phrases_en: Iterable[str], phrases_deva: Iterable[str], phrases_rom: Iterable[str]):
    return tuple(
        [SourcePhraseMapping(p, "english") for p in phrases_en]
        + [SourcePhraseMapping(p, "devanagari_hindi") for p in phrases_deva]
        + [SourcePhraseMapping(p, "romanized_hindi") for p in phrases_rom]
    )


class ISLReverseSignAdapter(BaseReverseSignAdapter):
    """Rule-based lexical and procedural pose adapter designated exclusively for ISL."""

    adapter_id = "isl-reverse-rule-adapter-v1"
    sign_language = SignLanguageEnum.ISL

    def _build_definitions(self) -> Iterable[ReverseSignDefinition]:
        return (
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="NAMASTE",
                duration_ms=1200,
                hand_configuration="isl_two_hands_anjali_mudra",
                movement_type="isl_palms_joined_chest_bow",
                body_position="slight_forward_torso_bow",
                non_manual_marker="reverent_head_bow",
                spatial_reference="chest_center",
                keyframes=(
                    make_keyframe(
                        0,
                        "anjali_palms_together",
                        [
                            ("left_shoulder", -0.4, -0.3, 0.0),
                            ("right_shoulder", -0.4, 0.3, 0.0),
                            ("left_elbow", 1.6, 0.0, 0.0),
                            ("right_elbow", 1.6, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                    make_keyframe(
                        650,
                        "anjali_palms_together",
                        [
                            ("neck", 0.22, 0.0, 0.0),
                            ("torso", 0.08, 0.0, 0.0),
                            ("left_elbow", 1.75, 0.0, 0.0),
                            ("right_elbow", 1.75, 0.0, 0.0),
                        ],
                        "reverent_head_bow",
                    ),
                    make_keyframe(
                        1200,
                        "open_flat",
                        [
                            ("neck", 0.0, 0.0, 0.0),
                            ("torso", 0.0, 0.0, 0.0),
                            ("left_shoulder", 0.0, 0.0, 0.0),
                            ("right_shoulder", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    (),
                    ("नमस्ते", "नमस्कार", "प्रणाम"),
                    ("namaste", "namaskar", "pranam"),
                ),
                provenance=_ISL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="HELLO",
                duration_ms=950,
                hand_configuration="isl_open_palm_fingers_extended",
                movement_type="isl_right_palm_greeting_wave",
                body_position="upright_neutral",
                non_manual_marker="mild_smile_eye_contact",
                spatial_reference="head_right_upper",
                keyframes=(
                    make_keyframe(
                        0,
                        "isl_open_palm",
                        [
                            ("right_shoulder", -0.25, 0.25, 0.35),
                            ("right_elbow", 1.45, 0.1, 0.0),
                            ("right_wrist", 0.0, 0.25, 0.0),
                        ],
                        "mild_smile_eye_contact",
                    ),
                    make_keyframe(
                        480,
                        "isl_open_palm",
                        [
                            ("right_shoulder", -0.25, 0.25, 0.35),
                            ("right_elbow", 1.45, 0.1, 0.0),
                            ("right_wrist", 0.0, -0.35, 0.2),
                        ],
                        "mild_smile_eye_contact",
                    ),
                    make_keyframe(
                        950,
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
                    ("hello", "hi"),
                    ("हैलो", "हेलो"),
                    (),
                ),
                provenance=_ISL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="WELCOME",
                duration_ms=1050,
                hand_configuration="isl_open_palms_upward",
                movement_type="isl_two_hand_inward_chest_beckon",
                body_position="upright_open_torso",
                non_manual_marker="warm_nod",
                spatial_reference="front_torso_to_chest",
                keyframes=(
                    make_keyframe(
                        0,
                        "isl_open_palms_up",
                        [
                            ("left_shoulder", -0.35, -0.35, -0.15),
                            ("right_shoulder", -0.35, 0.35, 0.15),
                            ("left_elbow", 0.7, 0.0, 0.0),
                            ("right_elbow", 0.7, 0.0, 0.0),
                        ],
                        "warm_nod",
                    ),
                    make_keyframe(
                        550,
                        "isl_open_palms_up",
                        [
                            ("left_shoulder", -0.25, -0.1, 0.0),
                            ("right_shoulder", -0.25, 0.1, 0.0),
                            ("left_elbow", 1.45, 0.0, 0.0),
                            ("right_elbow", 1.45, 0.0, 0.0),
                            ("neck", 0.15, 0.0, 0.0),
                        ],
                        "warm_nod",
                    ),
                    make_keyframe(
                        1050,
                        "open_flat",
                        [
                            ("left_shoulder", 0.0, 0.0, 0.0),
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("left_elbow", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                            ("neck", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("welcome",),
                    ("आपका स्वागत है", "स्वागत"),
                    ("swagat",),
                ),
                provenance=_ISL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="THANK_YOU",
                duration_ms=950,
                hand_configuration="isl_open_palm_respect_chin",
                movement_type="isl_chin_to_heart_gratitude_bow",
                body_position="slight_respectful_tilt",
                non_manual_marker="warm_nod",
                spatial_reference="chin_to_chest_center",
                keyframes=(
                    make_keyframe(
                        0,
                        "isl_open_palm_inward",
                        [
                            ("right_shoulder", -0.55, 0.18, 0.0),
                            ("right_elbow", 1.85, 0.0, 0.0),
                            ("right_wrist", 0.15, 0.0, 0.0),
                        ],
                        "warm_nod",
                    ),
                    make_keyframe(
                        500,
                        "isl_open_palm_inward",
                        [
                            ("right_shoulder", -0.35, 0.12, 0.0),
                            ("right_elbow", 1.25, 0.0, 0.0),
                            ("neck", 0.16, 0.0, 0.0),
                        ],
                        "warm_nod",
                    ),
                    make_keyframe(
                        950,
                        "open_flat",
                        [
                            ("right_shoulder", 0.0, 0.0, 0.0),
                            ("right_elbow", 0.0, 0.0, 0.0),
                            ("neck", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("thank you", "thank", "thanks"),
                    ("बहुत धन्यवाद", "धन्यवाद", "शुक्रिया"),
                    ("dhanyavaad", "dhanyawad", "shukriya"),
                ),
                provenance=_ISL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="WATER",
                duration_ms=900,
                hand_configuration="isl_cupped_hand_drinking_posture",
                movement_type="isl_cupped_hand_tilt_to_mouth",
                body_position="upright_neutral",
                non_manual_marker="neutral_mouth_open_hint",
                spatial_reference="lower_face_lips",
                keyframes=(
                    make_keyframe(
                        0,
                        "isl_cupped_palm",
                        [
                            ("right_shoulder", -0.42, 0.15, 0.05),
                            ("right_elbow", 1.65, 0.0, 0.0),
                            ("right_wrist", -0.25, 0.0, 0.1),
                        ],
                        "neutral",
                    ),
                    make_keyframe(
                        480,
                        "isl_cupped_palm",
                        [
                            ("right_shoulder", -0.52, 0.18, 0.08),
                            ("right_elbow", 1.85, 0.0, 0.0),
                            ("right_wrist", -0.55, 0.0, 0.15),
                            ("neck", -0.08, 0.0, 0.0),
                        ],
                        "neutral_mouth_open_hint",
                    ),
                    make_keyframe(
                        900,
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
                    ("water",),
                    ("पानी", "जल"),
                    ("pani", "paani", "jal"),
                ),
                provenance=_ISL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="YES",
                duration_ms=700,
                hand_configuration="isl_closed_fist_thumb_up",
                movement_type="isl_wrist_nod_and_head_nod",
                body_position="upright_neutral",
                non_manual_marker="affirmative_head_nod",
                spatial_reference="chest_right_front",
                keyframes=(
                    make_keyframe(
                        0,
                        "isl_fist_affirm",
                        [
                            ("right_shoulder", -0.3, 0.1, 0.0),
                            ("right_elbow", 1.35, 0.0, 0.0),
                            ("right_wrist", 0.2, 0.0, 0.0),
                            ("neck", 0.18, 0.0, 0.0),
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
                            ("neck", 0.0, 0.0, 0.0),
                        ],
                        "neutral",
                    ),
                ),
                source_mappings=_src(
                    ("yes",),
                    ("हाँ", "जी"),
                    ("haan", "ha", "ji"),
                ),
                provenance=_ISL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="NO",
                duration_ms=750,
                hand_configuration="isl_open_palm_vertical",
                movement_type="isl_lateral_forearm_wave_refusal",
                body_position="upright_neutral",
                non_manual_marker="negative_head_shake",
                spatial_reference="chest_right_front",
                keyframes=(
                    make_keyframe(
                        0,
                        "isl_open_palm_vertical",
                        [
                            ("right_shoulder", -0.32, 0.15, 0.1),
                            ("right_elbow", 1.35, 0.0, 0.0),
                            ("right_wrist", 0.0, -0.35, 0.0),
                            ("neck", 0.0, -0.2, 0.0),
                        ],
                        "negative_head_shake",
                    ),
                    make_keyframe(
                        380,
                        "isl_open_palm_vertical",
                        [
                            ("right_wrist", 0.0, 0.35, 0.0),
                            ("neck", 0.0, 0.2, 0.0),
                        ],
                        "negative_head_shake",
                    ),
                    make_keyframe(
                        750,
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
                provenance=_ISL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="HELP",
                duration_ms=950,
                hand_configuration="isl_palm_supporting_closed_fist",
                movement_type="isl_two_hand_uplift_chest",
                body_position="upright_engaged",
                non_manual_marker="earnest_eyebrow_raise",
                spatial_reference="chest_center_forward",
                keyframes=(
                    make_keyframe(
                        0,
                        "isl_support_base",
                        [
                            ("left_shoulder", -0.35, -0.2, 0.0),
                            ("left_elbow", 1.25, 0.0, 0.0),
                            ("right_shoulder", -0.35, 0.2, 0.0),
                            ("right_elbow", 1.35, 0.0, 0.0),
                        ],
                        "earnest_eyebrow_raise",
                    ),
                    make_keyframe(
                        500,
                        "isl_support_base",
                        [
                            ("left_shoulder", -0.58, -0.2, 0.0),
                            ("right_shoulder", -0.58, 0.2, 0.0),
                            ("left_elbow", 1.45, 0.0, 0.0),
                            ("right_elbow", 1.55, 0.0, 0.0),
                        ],
                        "earnest_eyebrow_raise",
                    ),
                    make_keyframe(
                        950,
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
                provenance=_ISL_PROVENANCE,
            ),
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="PLEASE",
                duration_ms=850,
                hand_configuration="isl_open_palm_chest_politeness",
                movement_type="isl_palms_joined_or_chest_circle",
                body_position="slight_forward_torso_bow",
                non_manual_marker="polite_nod",
                spatial_reference="chest_center",
                keyframes=(
                    make_keyframe(
                        0,
                        "isl_palm_chest",
                        [
                            ("right_shoulder", -0.38, 0.05, -0.1),
                            ("right_elbow", 1.55, 0.0, 0.0),
                            ("right_wrist", 0.1, 0.0, 0.1),
                        ],
                        "polite_nod",
                    ),
                    make_keyframe(
                        450,
                        "isl_palm_chest",
                        [
                            ("right_shoulder", -0.45, 0.15, -0.05),
                            ("right_elbow", 1.6, 0.0, 0.0),
                            ("neck", 0.12, 0.0, 0.0),
                        ],
                        "polite_nod",
                    ),
                    make_keyframe(
                        850,
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
                    ("please",),
                    ("कृपया", "मेहरबानी"),
                    ("kripaya",),
                ),
                provenance=_ISL_PROVENANCE,
            ),
        )
