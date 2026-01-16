# 🎓 Setu: The Voice-First AI Bridge for Education
Tagline: Turning passive parents into active guardians by making school data accessible, understandable, and actionable in their own language.

Setu (meaning "Bridge") is a mobile-first, voice-native GenAI assistant designed for semi-literate parents in India. It creates an Accessibility Layer over the education system, transforming complex school circulars, report cards, and timetables into simplified, actionable audio explanations in local dialects.

## ✨ Key Features
Zero-UI Interaction: A single giant microphone button designed for digital novices. No typing, no chat windows.

Vernacular Intelligence: Optimized for "Hinglish" and code-switching queries (e.g., "Iska result kaisa hai?") using a fine-tuned Whisper implementation.

Digital School Bag (New): Stores uploaded circulars, timetables, and report cards in a persistent database so parents can ask questions later without re-uploading.

Actionable RAG: Uses Gemini 1.5 Flash to extract deadlines, fees, and marks from complex tables and text-heavy PDFs with high accuracy.

Deadline Reminders: Automatically tracks exam dates and fee deadlines, offering to set audio reminders for the parent.

Natural Voice Output: Delivers warm, encouraging explanations in local dialects using Microsoft Edge-TTS, building trust with the user.

Offline-Ready PWA: Works on low-end Android devices and 2G networks with robust caching.

## 🛠️ Tech Stack
Frontend: Next.js 16 (PWA), Tailwind CSS, Framer Motion.

Backend: FastAPI (Python), SQLite (Notice Storage).

AI Brain (Reasoning): Google Gemini 1.5 Flash (Optimized for Long-Context PDFs).

AI Ears (STT): Groq Cloud (Whisper-large-v3-turbo) for sub-second transcription.

AI Voice (TTS): Microsoft Edge-TTS (Neural Regional Voices).

Infrastructure: Render (Backend Container), Vercel (Frontend Hosting).

## 🚀 Installation & Setup
# 1. Prerequisites
Python 3.10+ & Node.js 18+

FFmpeg: Essential for the backend audio processing.

Windows: winget install ffmpeg

Mac: brew install ffmpeg

# 2. Backend Setup (FastAPI)
Bash

cd backend

python -m venv venv

source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

Create .env file

echo "GEMINI_API_KEY=your_key_here" > .env

echo "GROQ_API_KEY=your_groq_key" > .env

Start server (0.0.0.0 is required for mobile testing)

uvicorn app:app --reload --host 0.0.0.0 --port 8000

# 3. Frontend Setup (Next.js)
Bash

cd frontend

npm install

 Configure your local backend IP
 
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

Run with Webpack to support PWA logic

npm run dev

## 🏗️ Project Structure
frontend/app/page.tsx: The main "One-Tap" interface and MediaRecorder logic.

backend/app.py: FastAPI orchestrator and CORS configuration.

backend/core/processor.py: RAG logic and Gemini 1.5 Flash integration.

backend/audio.py: Whisper STT and Edge-TTS implementation.

## 📝 Demo Instructions
Upload: Place a school notice (PDF) in the backend's designated folder.

Ask: Click the Mic button on the PWA and ask, "What is the holiday schedule?" or "How do I fill the scholarship form?"

Listen: The AI will process the document and speak the answer back in the selected vernacular language.
GenAI Core: GPT-4o-mini (Reasoning), Whisper (STT), FAISS (Vector DB for RAG).
