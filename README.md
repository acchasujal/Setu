### 🎓 Setu: The Voice-First AI Bridge for Education
Bridging the linguistic and digital divide for parents in India.

Setu (meaning "Bridge") is a mobile-first, voice-native GenAI assistant designed for parents who face linguistic and literacy barriers. It transforms complex school circulars (PDFs/Notices) into simplified, actionable audio explanations in local dialects using a "Zero-UI" approach.

## ✨ Key Features
Voice-First Interaction: Optimized for Indian accents and code-switching (e.g., "Hinglish") using OpenAI Whisper.

Document Intelligence (RAG): Uses Gemini 1.5 Flash to extract accurate, actionable steps from real school circulars to prevent misinformation.

Vernacular Output: Delivers natural-sounding local voice explanations via Edge-TTS.

Offline-Ready PWA: A lightweight Progressive Web App designed for low-bandwidth environments and high accessibility.

## 🛠️ Tech Stack
Frontend: Next.js 16 (React), Tailwind CSS, Lucide React.

Backend: FastAPI (Python), Google Generative AI (Gemini 1.5 Flash).

Senses: OpenAI Whisper (STT), Microsoft Edge-TTS (Speech Synthesis).

Infrastructure: Webpack-powered PWA, PDFPlumber for document parsing.

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
