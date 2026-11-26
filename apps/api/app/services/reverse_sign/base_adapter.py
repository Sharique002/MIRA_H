"""Abstract base adapter, pose keyframe validation, and shared phrase resolution."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Iterable, List, Sequence, Tuple

from app.schemas.sessions import SignLanguageEnum, SpokenLanguageEnum
from app.schemas.sign_generation import (
    AdapterModeEnum,
    JointAngleTarget,
    SignGenerateRequest,
    SignGenerateResponse,
    SignKeyframe,
    SignMappingProvenance,
    SignSequenceItem,
)
from app.services.reverse_sign.normalization import (
    SourceVocabularyCategory,
    analyze_text,
    build_phrase_key,
)

# Strictly locked to the 8 Three.js joints implemented in AvatarViewport.tsx.
PERMITTED_AVATAR_JOINTS = frozenset(
    {
        "torso",
        "neck",
        "right_shoulder",
        "right_elbow",
        "right_wrist",
        "left_shoulder",
        "left_elbow",
        "left_wrist",
    }
)


@dataclass(frozen=True)
class SourcePhraseMapping:
    """Associates a source vocabulary phrase with its script category."""

    phrase: str
    category: SourceVocabularyCategory


@dataclass(frozen=True)
class ReverseSignDefinition:
    """Language-specific rule-based sign pose, source vocabulary, and provenance."""

    sign_language: SignLanguageEnum
    gloss_id: str
    duration_ms: int
    hand_configuration: str
    movement_type: str
    body_position: str
    non_manual_marker: str
    spatial_reference: str
    keyframes: Tuple[SignKeyframe, ...]
    source_mappings: Tuple[SourcePhraseMapping, ...]
    provenance: str
    verification_status: str = "UNVERIFIED_EXPERIMENTAL"
    classification: str = "EXPERIMENTAL"


@dataclass(frozen=True)
class _PhraseIndexEntry:
    gloss_id: str
    category: SourceVocabularyCategory
    display_phrase: str


def make_keyframe(
    time_offset_ms: int,
    hand_shape: str,
    joints: Sequence[Tuple[str, float, float, float]],
    non_manual_marker: str = "neutral",
) -> SignKeyframe:
    """Construct a SignKeyframe cleanly from compact joint target tuples."""
    return SignKeyframe(
        time_offset_ms=time_offset_ms,
        hand_shape=hand_shape,
        non_manual_marker=non_manual_marker,
        joints=[
            JointAngleTarget(joint=j, pitch=p, yaw=y, roll=r)
            for j, p, y, r in joints
        ],
    )


def validate_sign_definition(defn: ReverseSignDefinition, expected_language: SignLanguageEnum) -> None:
    """Validate language designation, keyframe count/timestamps, and permitted avatar joints."""
    if defn.sign_language != expected_language:
        raise ValueError(
            f"Gloss '{defn.gloss_id}' is tagged '{defn.sign_language.value}' inside '{expected_language.value}' adapter."
        )
    if defn.duration_ms <= 0:
        raise ValueError(f"Gloss '{defn.gloss_id}' must have positive duration_ms.")
    if len(defn.keyframes) < 2:
        raise ValueError(f"Gloss '{defn.gloss_id}' must define at least 2 keyframes (found {len(defn.keyframes)}).")

    last_offset = -1
    for kf in defn.keyframes:
        if kf.time_offset_ms < 0 or kf.time_offset_ms > defn.duration_ms:
            raise ValueError(
                f"Gloss '{defn.gloss_id}' keyframe offset {kf.time_offset_ms}ms exceeds duration {defn.duration_ms}ms."
            )
        if kf.time_offset_ms < last_offset:
            raise ValueError(f"Gloss '{defn.gloss_id}' keyframe timestamps must be non-decreasing.")
        last_offset = kf.time_offset_ms
        for target in kf.joints:
            if target.joint not in PERMITTED_AVATAR_JOINTS:
                raise ValueError(
                    f"Gloss '{defn.gloss_id}' references unsupported joint '{target.joint}'."
                )


class BaseReverseSignAdapter(ABC):
    """
    Abstract base contract for isolated rule-based reverse-sign adapters.
    Produces constrained lexical pose sequences marked EXPERIMENTAL, never full
    grammatical or neural sign-language translation.
    """

    adapter_id: str
    sign_language: SignLanguageEnum
    adapter_mode: str = AdapterModeEnum.RULE_BASED_LEXICON.value

    def __init__(self) -> None:
        self._definitions: Dict[str, ReverseSignDefinition] = {}
        self._phrase_index: Dict[Tuple[str, ...], _PhraseIndexEntry] = {}
        self._max_phrase_len: int = 1
        self._register_definitions(self._build_definitions())

    @abstractmethod
    def _build_definitions(self) -> Iterable[ReverseSignDefinition]:
        """Return language-isolated lexical and pose definitions for this adapter."""

    def _register_definitions(self, definitions: Iterable[ReverseSignDefinition]) -> None:
        for defn in definitions:
            validate_sign_definition(defn, self.sign_language)
            self._definitions[defn.gloss_id] = defn
            for mapping in defn.source_mappings:
                key = build_phrase_key(mapping.phrase)
                if not key:
                    raise ValueError(f"Empty normalized phrase key for '{mapping.phrase}' in '{defn.gloss_id}'.")
                if key in self._phrase_index:
                    raise ValueError(
                        f"Duplicate phrase key {key} registered inside {self.adapter_id}."
                    )
                self._phrase_index[key] = _PhraseIndexEntry(
                    gloss_id=defn.gloss_id,
                    category=mapping.category,
                    display_phrase=mapping.phrase,
                )
                if len(key) > self._max_phrase_len:
                    self._max_phrase_len = len(key)

    def supported_glosses(self) -> List[str]:
        """Return ordered list of canonical gloss IDs supported by this adapter."""
        return list(self._definitions.keys())

    def get_definition(self, gloss_id: str) -> ReverseSignDefinition:
        """Return validated ReverseSignDefinition metadata and provenance for a gloss."""
        return self._definitions[gloss_id]

    def _build_warnings(
        self,
        source_language: SpokenLanguageEnum,
        has_devanagari: bool,
        has_latin: bool,
        matched_categories: Sequence[SourceVocabularyCategory],
    ) -> List[str]:
        """Emit syntactic script warnings without claiming automatic language identification."""
        warnings: List[str] = []
        if source_language == SpokenLanguageEnum.ENGLISH and has_devanagari:
            warnings.append(
                "Declared source_language is EN while input contains Devanagari characters; "
                "supported documented Hindi vocabulary was processed using lexical matching without "
                "claiming automatic spoken-language identification."
            )
        elif source_language == SpokenLanguageEnum.HINDI and has_latin and not has_devanagari:
            if "english" in matched_categories or not matched_categories:
                warnings.append(
                    "Declared source_language is HI while input contains Latin/English script tokens "
                    "without Devanagari; documented lexical entries were processed without claiming "
                    "automatic spoken-language identification."
                )
        return warnings

    def generate(self, request: SignGenerateRequest) -> SignGenerateResponse:
        """Normalize input, perform longest-match phrase lookup, and emit experimental pose sequence."""
        analysis = analyze_text(request.text)
        surface_tokens = analysis.surface_tokens
        canonical_tokens = analysis.canonical_tokens

        sequence: List[SignSequenceItem] = []
        unsupported: List[str] = []
        matched_categories: List[SourceVocabularyCategory] = []
        provenance_by_gloss: Dict[str, SignMappingProvenance] = {}
        matched_token_count = 0
        total_duration = 0
        temporal_order = 0

        idx = 0
        num_tokens = len(canonical_tokens)
        while idx < num_tokens:
            matched_entry = None
            matched_len = 0
            max_window = min(self._max_phrase_len, num_tokens - idx)
            for window in range(max_window, 0, -1):
                candidate = canonical_tokens[idx : idx + window]
                if candidate in self._phrase_index:
                    matched_entry = self._phrase_index[candidate]
                    matched_len = window
                    break

            if matched_entry is not None:
                defn = self._definitions[matched_entry.gloss_id]
                sequence.append(
                    SignSequenceItem(
                        sign_id=defn.gloss_id,
                        temporal_order=temporal_order,
                        duration_ms=defn.duration_ms,
                        hand_configuration=defn.hand_configuration,
                        movement_type=defn.movement_type,
                        body_position=defn.body_position,
                        non_manual_marker=defn.non_manual_marker,
                        spatial_reference=defn.spatial_reference,
                        keyframes=list(defn.keyframes),
                    )
                )
                matched_surface = " ".join(surface_tokens[idx : idx + matched_len])
                if defn.gloss_id not in provenance_by_gloss:
                    provenance_by_gloss[defn.gloss_id] = SignMappingProvenance(
                        gloss_id=defn.gloss_id,
                        sign_language=self.sign_language,
                        source_vocabulary_matched=[matched_surface],
                        provenance=defn.provenance,
                        verification_status=defn.verification_status,
                        classification=defn.classification,
                    )
                else:
                    if matched_surface not in provenance_by_gloss[defn.gloss_id].source_vocabulary_matched:
                        provenance_by_gloss[defn.gloss_id].source_vocabulary_matched.append(matched_surface)

                matched_categories.append(matched_entry.category)
                total_duration += defn.duration_ms
                temporal_order += 1
                matched_token_count += matched_len
                idx += matched_len
            else:
                unsupported.append(surface_tokens[idx])
                idx += 1

        coverage = round(matched_token_count / num_tokens, 2) if num_tokens > 0 else 0.0
        warnings = self._build_warnings(
            source_language=request.source_language,
            has_devanagari=analysis.script_observation.has_devanagari,
            has_latin=analysis.script_observation.has_latin,
            matched_categories=matched_categories,
        )

        notes = (
            f"Experimental rule-based lexical pose lookup ({self.adapter_id}); "
            "covers documented core vocabulary only and does not represent complete grammatical or neural translation."
        )
        if not sequence:
            notes = (
                f"No supported {self.sign_language.value} vocabulary entries matched input in {self.adapter_id}. "
                + notes
            )

        return SignGenerateResponse(
            source_text=request.text,
            source_language=request.source_language,
            target_sign_language=self.sign_language,
            adapter_id=self.adapter_id,
            adapter_mode=self.adapter_mode,
            verification_status="EXPERIMENTAL",
            is_supported=len(sequence) > 0,
            sequence=sequence,
            total_duration_ms=total_duration,
            vocabulary_coverage=coverage,
            unsupported_tokens=unsupported,
            warnings=warnings,
            notes=notes,
            mapping_provenance=list(provenance_by_gloss.values()),
        )
