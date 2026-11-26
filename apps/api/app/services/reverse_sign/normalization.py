"""Unicode-safe text normalization and tokenization for English and Hindi inputs."""

from dataclasses import dataclass
import re
import unicodedata
from typing import Dict, List, Literal, Sequence, Tuple

ZERO_WIDTH_RE = re.compile(r"[\u200b\u200c\u200d\ufeff]")
DEVANAGARI_PUNCT_RE = re.compile(r"[\u0964\u0965\u0970]")
WHITESPACE_RE = re.compile(r"\s+")

# Match contiguous Devanagari runs (excluding danda U+0964, double danda U+0965,
# and abbreviation sign U+0970) or Latin alphanumeric words. Combining marks
# inside Devanagari (\u0901-\u0903, \u093c, \u093e-\u094d, etc.) stay attached.
TOKEN_RE = re.compile(
    r"[\u0900-\u0963\u0966-\u096f\u0971-\u097f]+|[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?"
)
DEVANAGARI_CHAR_RE = re.compile(r"[\u0900-\u0963\u0966-\u096f\u0971-\u097f]")
LATIN_LETTER_RE = re.compile(r"[A-Za-z]")

# Approved spelling variants collapsed strictly under canonical NFC forms.
TOKEN_VARIANT_MAP: Dict[str, str] = {
    unicodedata.normalize("NFC", "हां"): unicodedata.normalize("NFC", "हाँ"),
    unicodedata.normalize("NFC", "नही"): unicodedata.normalize("NFC", "नहीं"),
}

SourceVocabularyCategory = Literal["english", "devanagari_hindi", "romanized_hindi"]


@dataclass(frozen=True)
class ScriptObservation:
    """Syntactic script characteristics observed without claiming language identity."""

    has_devanagari: bool
    has_latin: bool
    devanagari_token_count: int
    latin_token_count: int


@dataclass(frozen=True)
class NormalizedTextAnalysis:
    """Deterministic normalized text, surface tokens, and canonical lookup tokens."""

    normalized_text: str
    surface_tokens: Tuple[str, ...]
    canonical_tokens: Tuple[str, ...]
    script_observation: ScriptObservation


def normalize_text(text: str) -> str:
    """Normalize input with Unicode NFC, zero-width removal, and Devanagari punctuation cleanup."""
    without_zw = ZERO_WIDTH_RE.sub("", text)
    nfc = unicodedata.normalize("NFC", without_zw)
    punct_spaced = DEVANAGARI_PUNCT_RE.sub(" ", nfc)
    return WHITESPACE_RE.sub(" ", punct_spaced).strip()


def normalize_token(token: str) -> str:
    """Canonicalize a single token using NFC, lowercase Latin folding, and approved variants."""
    cleaned = normalize_text(token).lower()
    return TOKEN_VARIANT_MAP.get(cleaned, cleaned)


def tokenize_text(text: str) -> Tuple[Tuple[str, ...], Tuple[str, ...]]:
    """Return `(surface_tokens, canonical_tokens)` preserving Devanagari combining sequences."""
    normalized = normalize_text(text)
    if not normalized:
        return (), ()
    surface = tuple(TOKEN_RE.findall(normalized))
    canonical = tuple(normalize_token(tok) for tok in surface)
    return surface, canonical


def observe_script(tokens: Sequence[str]) -> ScriptObservation:
    """Inspect purely syntactic Devanagari/Latin presence across tokenized words."""
    dev_count = sum(1 for tok in tokens if DEVANAGARI_CHAR_RE.search(tok))
    lat_count = sum(1 for tok in tokens if LATIN_LETTER_RE.search(tok))
    return ScriptObservation(
        has_devanagari=dev_count > 0,
        has_latin=lat_count > 0,
        devanagari_token_count=dev_count,
        latin_token_count=lat_count,
    )


def analyze_text(text: str) -> NormalizedTextAnalysis:
    """Run deterministic normalization, tokenization, and syntactic script inspection."""
    normalized = normalize_text(text)
    surface, canonical = tokenize_text(normalized)
    return NormalizedTextAnalysis(
        normalized_text=normalized,
        surface_tokens=surface,
        canonical_tokens=canonical,
        script_observation=observe_script(canonical),
    )


def build_phrase_key(phrase: str) -> Tuple[str, ...]:
    """Convert a documented phrase or token string into canonical lookup keys."""
    _, canonical = tokenize_text(phrase)
    return canonical
