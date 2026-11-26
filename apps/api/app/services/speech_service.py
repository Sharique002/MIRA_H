from app.schemas.sessions import SpokenLanguageEnum
from app.schemas.speech import (
    SpeechTranscribeRequest,
    SpeechTranscribeResponse,
    SpeechSynthesizeRequest,
    SpeechSynthesizeResponse
)

class SpeechService:
    @staticmethod
    def transcribe(request: SpeechTranscribeRequest) -> SpeechTranscribeResponse:
        """
        Pluggable local ASR adapter. If audio payload is provided in local environment,
        transcribes audio or coordinates with client Web Speech API.
        """
        # Default placeholder transcription text for simulated audio or client fallback
        text = "Hello, I am testing MIRA-H assistive communication." if request.language == SpokenLanguageEnum.ENGLISH else "नमस्ते, मैं मीरा-एच का परीक्षण कर रहा हूँ।"
        
        return SpeechTranscribeResponse(
            language=request.language,
            transcription=text,
            confidence=0.91,
            is_final=True,
            provider="local_edge_asr_adapter"
        )

    @staticmethod
    def synthesize(request: SpeechSynthesizeRequest) -> SpeechSynthesizeResponse:
        """
        Pluggable local TTS adapter. Instructs browser client to invoke neutral local voice
        via Web Speech API or local audio synthesis engine.
        """
        words = len(request.text.split())
        estimated_sec = max(0.8, round(words * 0.35 / request.voice_speed, 2))

        return SpeechSynthesizeResponse(
            language=request.language,
            text=request.text,
            audio_url_or_base64=None,
            synthesizer="local_speech_synthesis_web_api",
            duration_sec=estimated_sec,
            client_playback_suggested=True
        )

speech_service = SpeechService()
