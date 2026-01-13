# SETU PRODUCTION QUICK REFERENCE

## Running the Application

### Backend (FastAPI)
cd backend
# Create a virtual environment
python -m venv venv
# Activate it (Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate)
venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Create a .env file and add your Gemini API Key
echo "GEMINI_API_KEY=your_key_here" > .env
# Start the backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000

Check health: `curl http://localhost:8000/`

### Frontend (Next.js)
cd frontend
# Install dependencies
npm install
# Create .env.local and point it to the backend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
# Run in development mode
npm run dev

Visit: `http://localhost:3000`

---

## API Endpoint

### POST /api/chat
**Purpose:** Process voice/text queries with optional PDF context

**Request (multipart/form-data):**
```
audio_file: <audio blob> (optional, webm/mp4/wav)
text_query: <string>     (optional if audio_file provided)
pdf_file:   <file>       (optional)
language:   <string>     (required: "hi", "en", "mr")
```

**Response:**
```json
{
  "question": "क्या कल स्कूल की छुट्टी है?",
  "answer": "हां, कल दिवाली की छुट्टी है। सभी छात्रों को छुट्टी दी जाएगी।",
  "audio_url": "/static/audio/abc123xyz789.mp3"
}
```

---

## Logging & Debugging

### Backend Logs
```
[2026-01-13 14:30:45,123] INFO - __main__ - [INIT] Static folder mounted at /static
[2026-01-13 14:30:50,200] INFO - __main__ - [CHAT] Request received - Language: hi
[2026-01-13 14:30:50,300] INFO - __main__ - [CHAT-PHASE1] Transcribed: 'क्या कल स्कूल...'
[2026-01-13 14:30:51,000] INFO - __main__ - [CHAT-PHASE3] Audio: /static/audio/xyz.mp3
```

### Frontend Logs (Browser Console)
```
[SETU-PWA] Starting audio processing (size: 12345 bytes)
[SETU-PWA] Sending request to http://localhost:8000/api/chat
[SETU-PWA] Received response from backend
[SETU-PWA] Playing audio from http://localhost:8000/static/audio/xyz.mp3
```

---

## Error Handling Flow

### User Makes a Query
```
1. Record/Type → 2. Send to Backend → 3. Backend Processes → 4. Return Answer
   ↓ Error              ↓ Error                ↓ Error          ↓ Error
   Handle            Show User             Log Error        Show Response
   Permission         Network Error         Retry Queue      Message
```

### If Something Goes Wrong
- **Microphone denied:** Alert message, revert to idle state
- **Network error:** Show error in response box
- **Backend error:** Backend logs it + returns error message
- **Temp files:** Always deleted even if crash occurs

---

## Key Components

### Frontend
- **recordingRef, audioChunksRef:** Store microphone data
- **MediaRecorder:** Handles audio capture with codec fallback
- **FormData:** Sends audio + language to backend
- **Audio element:** Plays response from /static/audio/

### Backend
- **transcribe_audio():** Whisper speech-to-text
- **answer_from_notice():** Gemini RAG processing
- **text_to_speech():** Edge-TTS speech generation
- **/static mount:** Serves generated MP3 files

### Audio Files
- Generated in: `backend/static/audio/`
- Format: MP3, named with UUID + timestamp
- Accessed via: `http://localhost:8000/static/audio/abc123.mp3`
- Auto-deleted after some time (configure cleanup job)

---

## State Machine

```
┌─────────┐
│  IDLE   │ ← User not speaking
└────┬────┘
     │ [Tap mic]
     ↓
┌─────────────┐
│  RECORDING  │ ← Microphone is listening
└────┬────────┘
     │ [Release mic]
     ↓
┌─────────────┐
│ PROCESSING  │ ← Backend transcribing + generating
└────┬────────┘
     │ [Response ready]
     ↓
┌─────────────┐
│  RESPONSE   │ ← Display answer + play audio
└────┬────────┘
     │ [Ask new question]
     ↓
  IDLE (↻)
```

---

## Production Checklist

**Before Deploying:**
- [ ] Test all 3 languages (Hindi/English/Marathi)
- [ ] Test microphone permission flow
- [ ] Test PDF upload (type + size validation)
- [ ] Test network error handling
- [ ] Verify audio playback in Chrome/Safari/Firefox
- [ ] Check mobile responsiveness
- [ ] Verify CORS allows frontend URL
- [ ] Test with real school data in RAG
- [ ] Monitor logs for 24 hours
- [ ] Load test with 10+ concurrent users

**In app.py line ~28:**
```python
allow_origins=["*"],  # ← Replace with ["https://yourdomain.com"] for production
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Mic not working | Permission denied | Check browser permissions, refresh page |
| Audio not playing | CORS error | Verify static folder mount, check /static path |
| Slow response | Whisper model loading | First request is slow, subsequent are fast |
| No transcript | Whisper timeout | Check microphone audio quality, try again |
| File upload fails | Size/type wrong | Max 25MB, PDF/JPG/PNG only |
| Backend 500 error | Check logs | Look at [CHAT] prefix logs in terminal |

---

## File Structure

```
Setu/
├── backend/
│   ├── app.py                      ← Main FastAPI app
│   ├── audio.py                    ← Transcribe + TTS
│   ├── requirements.txt
│   ├── core/
│   │   ├── processor.py            ← RAG engine
│   │   ├── pdf_reader.py
│   │   ├── rag.py
│   │   └── simplifier.py
│   ├── knowledge_base/             ← School data
│   │   ├── deadlines.txt
│   │   ├── scholarship.txt
│   │   └── ...
│   └── static/
│       └── audio/                  ← Generated MP3s
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                ← Main UI (UPDATED)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/                     ← shadcn/ui components
│   ├── package.json
│   └── .env.local                  ← Set NEXT_PUBLIC_API_URL
│
└── PRODUCTION_AUDIT.md             ← Full audit report
```

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (optional, if using .env)
```
WHISPER_MODEL=base
CORS_ORIGINS=*
```

---

## Performance Tips

1. **First request slower:** Whisper model loads on first request (~10s)
2. **Parallel processing:** Multiple users handled by async/await
3. **Audio cleanup:** Configure cron to delete old MP3s after 24 hours
4. **PDF caching:** Cache extracted text if using same PDFs

```bash
# Clean old audio files
find backend/static/audio -type f -mtime +1 -delete
```

---

## Support & Debugging

### Enable detailed logging
Change in `backend/app.py`:
```python
logging.basicConfig(level=logging.DEBUG)  # ← From INFO to DEBUG
```

### Test endpoints directly
```bash
# Text query
curl -X POST http://localhost:8000/api/chat \
  -F "text_query=what are exam dates?" \
  -F "language=en"

# Check audio was generated
ls -la backend/static/audio/

# Test audio playback
curl http://localhost:8000/static/audio/filename.mp3 > test.mp3
```

---

## Contact & Notes

**Last Updated:** January 13, 2026  
**Version:** 1.0.0  
**Status:** Production Ready

Questions? Check [PRODUCTION_AUDIT.md](PRODUCTION_AUDIT.md) for detailed information.
