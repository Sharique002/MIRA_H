# AGENTS.md — MIRA-H Engineering Governance

Welcome to the MIRA-H engineering repository. All contributing agents, software architects, and engineers must strictly adhere to the standards and rules defined below.

## 1. Core Mandate
MIRA-H is a human-centred multimodal assistive communication platform bridging Indian Sign Language (ISL), American Sign Language (ASL), English, and Hindi.
- **Bi-directional pipelines**:
  - Sign to Spoken: ISL/ASL visual signs $\rightarrow$ English/Hindi text and synthesized speech.
  - Spoken to Sign: English/Hindi text/speech $\rightarrow$ ISL/ASL avatar animation sequences.
- **Architectural separation**: Treat sign-to-speech and speech-to-sign as separate pipelines. Never assume ISL and ASL are interchangeable.

## 2. Product Honesty Protocol
Every capability in UI, API responses, and documentation must carry an explicit status:
- `IMPLEMENTED`: Code exists, works, and is verified by automated or manual tests.
- `EXPERIMENTAL`: Code exists with documented limitations or pending full evaluation.
- `PLANNED`: Documented design/schema; not yet functional.
- `MOCK/DEMO`: Deterministic sample functionality for development or demonstration only.
**Strict prohibition**: Never present MOCK/DEMO data as trained model inferences. Never display fabricated model accuracies, dataset scales, or benchmark latency figures.

## 3. Architecture & Tech Stack Standards
- **Monorepo Structure**:
  - `apps/web`: Next.js 14+ (App Router), TypeScript (strict mode), Tailwind CSS, Lucide icons, MediaPipe Vision for browser landmark detection, Three.js for reverse sign avatar animation.
  - `apps/api`: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, modular routers/services, clean error envelopes, WebSocket support.
  - `ml/`: Preprocessing pipelines, dataset manifests, isolated ISL/ASL model adapters and evaluation scripts.
- **Local-First & Resource Budget**:
  - Target environment: CPU-compatible fallback, ~16 GB RAM baseline, controlled frame rates, lazy loading of ML models.
  - Never upload user webcam video/audio to external cloud services without explicit, informed consent.

## 4. Engineering Quality Gates
- Every phase must follow: **Inspect $\rightarrow$ Plan $\rightarrow$ Implement $\rightarrow$ Test $\rightarrow$ Debug $\rightarrow$ Review $\rightarrow$ Document $\rightarrow$ Report**.
- Keep public documentation free of secrets, hardcoded keys, internal confidential blueprints, and local workstation paths.
- No decorative non-functional buttons or placeholders masquerading as features.
