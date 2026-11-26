# MIRA-H: Docker Startup Guide

MIRA-H provides a multi-container Docker Compose configuration that deploys both the FastAPI backend and Next.js frontend with automated healthchecks.

---

## 1. Quick Launch
Run from the repository root:
```bash
docker compose up --build
```

---

## 2. Container Architecture
- **mirah-api**: Python 3.11-slim container exposing port `8000`. Mounts SQLite database and exposes healthcheck at `/api/v1/health`.
- **mirah-web**: Node.js 20-alpine container exposing port `3000`. Connects to API container with automated dependency synchronization.

---

## 3. Teardown
```bash
docker compose down -v
```
