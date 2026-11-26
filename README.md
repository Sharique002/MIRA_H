# MIRA-H — Multimodal Assistive Communication Platform

**Developer:** Sharique  
**Supported Languages:** Indian Sign Language (ISL), American Sign Language (ASL), English, and Hindi  
**Status:** Local-First Prototype (`v2.0`)

---

## What MIRA-H Is

**MIRA-H (MIRA for Humanity)** is a human-centred multimodal assistive communication platform built to help bridge everyday communication between deaf/hard-of-hearing signers and hearing speakers.

Because **Indian Sign Language (ISL)** and **American Sign Language (ASL)** have distinct grammar, vocabulary, and signing conventions, MIRA-H treats ISL and ASL as strictly separate language pipelines rather than assuming one language model fits all.

---

## How MIRA-H Helps

- **Bridging Sign and Speech:** Supports both directions of everyday communication across ISL, ASL, English, and Hindi.
- **Privacy-First Local Operation:** Designed around on-device processing so raw webcam video and microphone audio stay on the user's device instead of being uploaded to external third-party clouds by default.
- **Accessible Interface:** Built with clear visual hierarchy, high-contrast surfaces, keyboard navigation support, and transparent capability indicators.
- **Honest AI Disclosure:** Explicitly distinguishes working rule-based/lexical baselines (`IMPLEMENTED` / `EXPERIMENTAL`) from future trained neural capabilities (`PLANNED`) so users are never misled by synthetic metrics or unverified claims.

---

## How MIRA-H Works

MIRA-H separates communication into two independent workflows:

1. **Sign-to-Spoken Workflow**
   - Captures hand gestures locally through the user's webcam with explicit camera start/stop control.
   - Extracts lightweight hand-landmark coordinates directly in the browser without persisting raw video streams.
   - Maps recognized signs through isolated ISL or ASL rule-based matchers into readable English or Hindi text and optional speech playback.

2. **Spoken-to-Sign Workflow**
   - Accepts spoken or typed English and Hindi input (including Devanagari Unicode text normalization).
   - Performs language-specific lexical phrase matching separately for ISL and ASL, transparently displaying unmatched vocabulary terms instead of fabricating translations.
   - Drives a synchronized 3D humanoid signing avatar with smooth joint keyframe interpolation and interactive playback controls (play, pause, queue navigation, and reset).

---

## Transparency & Current Scope

- **Experimental Baselines:** Current sign recognition and reverse-sign generation operate on constrained, rule-based lexical and geometric baselines rather than trained continuous neural networks.
- **3D Avatar Scope:** The avatar uses a stylized skeletal mannequin with rigid block hands and expresses hand-shape and facial markers as descriptive text rather than articulated finger/facial morphs.
- **No Unverified Accuracy Claims:** MIRA-H intentionally reports zero deaf-signer validation coverage on unverified experimental sign mappings until formal community validation is completed.

---

## Repository Security & Attribution

- **Author & Developer:** **Sharique**
- **Intellectual Property & Access Note:** Detailed internal specifications, engineering audit reports, local workstation environment logs, and fallback secrets are intentionally excluded from this repository. Keep repository visibility set to **Private** on GitHub to prevent unauthorized copying of application source code.
