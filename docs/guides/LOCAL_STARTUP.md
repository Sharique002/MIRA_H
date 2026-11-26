# MIRA-H: Local Startup Guide

Follow this guide to run MIRA-H concurrently on your local workstation.

---

## 1. Starting the Backend API Server
In a terminal window:
```bash
cd apps/api
# Windows PowerShell
.\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Linux / macOS
source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 2. Starting the Frontend Web Application
In a second terminal window:
```bash
cd apps/web
npm run dev
```
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Sign-to-Speech Studio**: [http://localhost:3000/studio/sign-to-speech](http://localhost:3000/studio/sign-to-speech)
- **Speech-to-Sign Avatar**: [http://localhost:3000/studio/speech-to-sign](http://localhost:3000/studio/speech-to-sign)
- **AI Model Lab**: [http://localhost:3000/model-lab](http://localhost:3000/model-lab)

---

## 3. Testing the Webcam Workflow
1. Open [http://localhost:3000/studio/sign-to-speech](http://localhost:3000/studio/sign-to-speech).
2. Click **"Activate Webcam"**. When prompted by your browser, grant camera permission.
3. Observe the live mirrored video feed with the real-time cyan/violet 21-point hand skeleton canvas overlay.
4. Perform common gestures (e.g. Namaste / joining hands or waving) to observe live sign recognition and English/Hindi audio translation.
5. Click **"Stop Camera"** to immediately release your webcam hardware tracks.
