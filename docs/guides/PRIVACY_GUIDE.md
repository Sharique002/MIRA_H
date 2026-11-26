# MIRA-H: Privacy & Security Specification

## 1. Zero Video Retention Principle
- **No Video Storage**: Raw video frames are never saved to disk, database, or cache.
- **Client-Side Edge Landmarks**: MediaPipe Tasks Vision runs inside the user's browser using WebAssembly. Only anonymized coordinate arrays (21 x, y, z floats) are transmitted to the backend.
- **Immediate Track Release**: When the user clicks "Stop Camera", `stream.getTracks().forEach(t => t.stop())` is called immediately, releasing camera hardware.

## 2. Audio Privacy
- Microphone transcription operates locally via browser Web Speech API.
- Zero audio recordings are uploaded to external third-party speech servers in local mode.
