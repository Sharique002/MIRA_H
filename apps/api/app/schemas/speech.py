from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.sessions import SpokenLanguageEnum

class AudioFormatEnum(str, Enum):
    WAV = "wav"
    MP3 = "mp3"
    WEBM = "webm"

class SpeechTranscribeRequest(BaseModel):
    language: SpokenLanguageEnum = SpokenLanguageEnum.ENGLISH
    audio_base64: Optional[str] = Field(None, description="Base64 encoded audio byte stream")
    sample_rate: int = Field(default=16000, description="Sampling rate in Hz")

class SpeechTranscribeResponse(BaseModel):
    language: SpokenLanguageEnum
    transcription: str
    confidence: float
    is_final: bool = True
    provider: str = "local_asr_adapter"

class SpeechSynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to synthesize into natural speech")
    language: SpokenLanguageEnum = SpokenLanguageEnum.ENGLISH
    voice_speed: float = Field(default=1.0, ge=0.5, le=2.0)
    audio_format: AudioFormatEnum = AudioFormatEnum.WAV

class SpeechSynthesizeResponse(BaseModel):
    language: SpokenLanguageEnum
    text: str
    audio_url_or_base64: Optional[str] = None
    synthesizer: str = "local_tts_adapter"
    duration_sec: float = 0.0
    client_playback_suggested: bool = True
