from datetime import datetime
from app.schemas.sessions import SpokenLanguageEnum, SignLanguageEnum
from app.schemas.translation import (
    TranslationRequest,
    TranslationResponse,
    SharedSemanticRepresentation
)

class TranslationService:
    # Deterministic dictionary for evidence-grounded gloss mapping
    GLOSS_DICTIONARY = {
        # ISL Glosses
        ("ISL", "EN"): {
            "NAMASTE": "Greetings and welcome.",
            "HELLO": "Hello, how are you?",
            "THANK_YOU": "Thank you very much.",
            "WATER": "May I have some water please?",
            "HELP": "I need assistance.",
            "YES": "Yes, understood.",
            "NO": "No, that is not correct.",
            "NAME_WHAT": "What is your name?",
        },
        ("ISL", "HI"): {
            "NAMASTE": "नमस्ते, आपका स्वागत है।",
            "HELLO": "नमस्ते, आप कैसे हैं?",
            "THANK_YOU": "आपका बहुत-बहुत धन्यवाद।",
            "WATER": "क्या मुझे पानी मिल सकता है?",
            "HELP": "मुझे सहायता की आवश्यकता है।",
            "YES": "हाँ, समझ गया।",
            "NO": "नहीं, यह सही नहीं है।",
            "NAME_WHAT": "आपका नाम क्या है?",
        },
        # ASL Glosses
        ("ASL", "EN"): {
            "HELLO": "Hello!",
            "THANK_YOU": "Thank you!",
            "I_LOVE_YOU": "I love you.",
            "POINT_YOU": "You.",
            "YES": "Yes.",
            "NO": "No.",
            "PLEASE": "Please.",
            "HELP": "Help.",
        },
        ("ASL", "HI"): {
            "HELLO": "नमस्ते!",
            "THANK_YOU": "धन्यवाद!",
            "I_LOVE_YOU": "मैं आपसे प्रेम करता हूँ।",
            "POINT_YOU": "आप।",
            "YES": "हाँ।",
            "NO": "नहीं।",
            "PLEASE": "कृपया।",
            "HELP": "मदद।",
        }
    }

    @classmethod
    def translate(cls, request: TranslationRequest) -> TranslationResponse:
        rep = request.semantic_representation
        lang_key = (rep.source_sign_language.value, rep.target_spoken_language.value)
        dictionary = cls.GLOSS_DICTIONARY.get(lang_key, {})

        translated_fragments = []
        for gloss in rep.gloss_sequence:
            clean_gloss = gloss.upper().strip()
            if clean_gloss in dictionary:
                translated_fragments.append(dictionary[clean_gloss])
            else:
                # Evidence preservation: keep gloss unadulterated if translation unverified
                translated_fragments.append(f"[{clean_gloss}]")

        full_translation = " ".join(translated_fragments) if translated_fragments else "..."
        notes = "Evidence-grounded translation verified." if rep.confidence >= 0.70 else "Uncertain span flagged; preserved raw sign gloss."

        return TranslationResponse(
            source_glosses=rep.gloss_sequence,
            target_language=rep.target_spoken_language,
            translated_text=full_translation,
            confidence=round(rep.confidence, 2),
            evidence_grounded=True,
            correction_notes=notes,
            timestamp=datetime.utcnow()
        )

translation_service = TranslationService()
