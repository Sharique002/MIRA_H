# MIRA-H: Installation Guide

## 1. Prerequisites
- **Node.js**: v18.0.0+ (Tested on v24.14.0)
- **npm**: 9.0.0+
- **Python**: 3.10+ (Tested on 3.11.9 64-bit)
- **Hardware**: 16 GB RAM recommended (CPU-only execution baseline supported)
- **Webcam**: Standard USB or built-in webcam with browser permissions enabled

---

## 2. Setup Steps

### 2.1 Backend Setup (FastAPI)
```bash
# Navigate to API directory
cd apps/api

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2.2 Frontend Setup (Next.js)
```bash
# Navigate to web directory
cd apps/web

# Install npm dependencies
npm install

# Build production assets (or run dev directly)
npm run build
```

### 2.3 Environment Configuration
Copy the template configuration from the root directory:
```bash
# In project root
cp .env.example .env
```
Set `SECRET_KEY` in `.env` to a strong random value before any shared or production deployment.
