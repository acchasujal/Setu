# SETU PRODUCTION ARCHITECTURE

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER (PWA)                               │
│                     React + Next.js + TypeScript                           │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                    HTTP POST Request with FormData
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        │                                                       │
        ↓                                                       ↓
    Audio Blob                                         Text Query
  (recorded via                                     (typed input)
  MediaRecorder)                                        │
        │                                               │
        └───────────────────────────┬───────────────────┘
                                    │
                                    ↓
        ┌─────────────────────────────────────────────────┐
        │           FastAPI Backend (Port 8000)           │
        │         POST /api/chat - Main Orchestrator      │
        └─────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ↓                           ↓                           ↓
    ┌─────────────┐          ┌──────────────┐          ┌─────────────┐
    │ PHASE 1     │          │ PHASE 2      │          │ PHASE 3     │
    │ HEAR        │          │ THINK        │          │ SPEAK       │
    │ (Transcribe)│          │ (RAG Engine) │          │ (Generate)  │
    │             │          │              │          │ Audio       │
    │ Audio → Text│          │ PDF + Query →│          │ Answer →    │
    │             │          │ Context      │          │ Audio File  │
    │ Whisper     │          │ Generated    │          │             │
    │ (OpenAI)    │          │              │          │ Edge-TTS    │
    │             │          │ Gemini API   │          │             │
    └────────┬────┘          │ (answer)     │          └────────┬────┘
             │               │              │                   │
             └─────────────────────────────────────────────────┘
                                    │
                        Aggregated Response
                        {"question", "answer",
                         "audio_url"}
                                    │
                                    ↓
        ┌────────────────────────────────────────────────┐
        │         /static/audio/xyz.mp3 File             │
        │           (Stored on Server)                   │
        └────────────────────────────────────────────────┘
                                    │
                        HTTP Response to Browser
                                    │
                                    ↓
        ┌────────────────────────────────────────────────┐
        │         Frontend: Display Results              │
        │  1. Show answer text (split into bullets)      │
        │  2. Play audio from /static/audio/xyz.mp3      │
        │  3. Update UI state to "response"              │
        │  4. Show "Ask New Question" button             │
        └────────────────────────────────────────────────┘
```

---

## Data Flow Sequence

```
User Interaction Sequence:
═════════════════════════════════════════════════════════════════

1. USER SPEAKS
   │
   ├─→ [Frontend] MediaRecorder starts capturing audio
   │   └─→ AppState: idle → recording
   │
2. USER RELEASES MIC
   │
   ├─→ [Frontend] MediaRecorder stops, creates audio blob
   │   └─→ AppState: recording → processing
   │
3. FRONTEND SENDS REQUEST
   │
   ├─→ FormData:
   │   ├─ audio_file: <webm/mp4/wav blob>
   │   ├─ language: "hi" / "en" / "mr"
   │   └─ pdf_file: (optional) <PDF document>
   │
   └─→ POST http://localhost:8000/api/chat
       
4. BACKEND RECEIVES REQUEST
   │
   ├─→ [Logger] [CHAT] Request received - Language: hi
   │
5. PHASE 1: HEAR (Transcribe Audio)
   │
   ├─→ Save audio to temp file
   ├─→ await transcribe_audio(temp_file, language="hi")
   ├─→ [Logger] [CHAT-PHASE1] Transcribed: "क्या कल स्कूल की छुट्टी है?"
   └─→ user_query = "क्या कल स्कूल की छुट्टी है?"
       
6. PHASE 2: THINK (Process with RAG)
   │
   ├─→ If PDF provided:
   │   ├─ Extract text from PDF
   │   └─ [Logger] [CHAT-PHASE2] Extracted text from PDF
   │
   ├─→ Call answer_from_notice(pdf_text, user_query)
   ├─→ [Logger] [CHAT-PHASE2] RAG response: "हां, कल..."
   └─→ response_text = "हां, कल दिवाली की छुट्टी है..."
       
7. PHASE 3: SPEAK (Generate Audio)
   │
   ├─→ await text_to_speech(response_text, lang="hi")
   ├─→ Generate MP3 using Edge-TTS
   ├─→ [Logger] [CHAT-PHASE3] Audio generated: /static/audio/abc123.mp3
   └─→ audio_url = "/static/audio/abc123.mp3"
       
8. BACKEND RETURNS RESPONSE
   │
   └─→ JSON Response:
       {
         "question": "क्या कल स्कूल की छुट्टी है?",
         "answer": "हां, कल दिवाली की छुट्टी है। सभी...",
         "audio_url": "/static/audio/abc123.mp3"
       }

9. FRONTEND RECEIVES RESPONSE
   │
   ├─→ [Logger] [SETU-PWA] Received response from backend
   ├─→ Parse answer into 5 bullet points
   └─→ AppState: processing → response
       
10. FRONTEND DISPLAYS ANSWER
    │
    ├─→ Render text summary (5 bullets)
    ├─→ Show "Play Audio" button
    └─→ Display "Ask New Question" button
       
11. AUDIO PLAYBACK (Auto)
    │
    ├─→ [Logger] [SETU-PWA] Playing audio from http://localhost:8000/static/audio/abc123.mp3
    │
    ├─→ new Audio("/static/audio/abc123.mp3")
    │
    ├─→ audio.onplay   → [AUDIO] Playback started
    ├─→ audio.onended  → [AUDIO] Playback ended
    └─→ audio.onerror  → [AUDIO] Playback error
       
12. USER CAN ASK AGAIN
    │
    ├─→ [Tap "Ask New Question" button]
    │
    └─→ AppState: response → idle
       └─→ Return to Step 1
```

---

## File Structure & Dependencies

```
Setu/
│
├── backend/                          [FastAPI + Python]
│   ├── app.py                        [ENHANCED - Main Orchestrator]
│   │   ├── Depends: audio.py
│   │   ├── Depends: core/processor.py
│   │   ├── Depends: core/pdf_reader.py
│   │   └── Imports: FastAPI, CORS, StaticFiles, logging
│   │
│   ├── audio.py                      [VERIFIED - Audio Processing]
│   │   ├── transcribe_audio()        [Whisper OpenAI]
│   │   ├── text_to_speech()          [Edge-TTS]
│   │   └── Imports: whisper, edge_tts, asyncio, logging
│   │
│   ├── core/
│   │   ├── processor.py              [RAG Engine]
│   │   │   └── answer_from_notice()  [Gemini API]
│   │   ├── pdf_reader.py
│   │   ├── rag.py
│   │   └── simplifier.py
│   │
│   ├── knowledge_base/               [School Data]
│   │   ├── deadlines.txt
│   │   ├── scholarship.txt
│   │   ├── fee_concession.txt
│   │   └── explanation_style.txt
│   │
│   ├── static/
│   │   └── audio/                    [Generated MP3 Files]
│   │       ├── abc123.mp3
│   │       ├── xyz789.mp3
│   │       └── ...
│   │
│   ├── temp/                         [Temporary Files]
│   │   └── uploads/
│   │       └── [uploaded PDFs]
│   │
│   ├── requirements.txt              [Dependencies]
│   ├── .env                          [Config]
│   └── __init__.py
│
├── frontend/                         [Next.js + React]
│   ├── app/
│   │   ├── page.tsx                  [HARDENED - Main UI Component]
│   │   │   ├── startRecording()      [MediaRecorder]
│   │   │   ├── processAudio()        [API Caller]
│   │   │   ├── handleKeyboardClick() [Text Input]
│   │   │   ├── handleFileUpload()    [PDF Upload]
│   │   │   └── logger (utility)      [Console Logging]
│   │   │
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── ...
│   │
│   ├── components/
│   │   ├── pwa-register.tsx
│   │   ├── theme-provider.tsx
│   │   └── ui/                       [shadcn/ui Library]
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── ... (30+ components)
│   │
│   ├── hooks/
│   ├── lib/
│   ├── public/                       [PWA Assets]
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── .env.local                    [Config]
│
└── Documentation/
    ├── PRODUCTION_AUDIT.md           [NEW - Full Audit Report]
    ├── QUICK_REFERENCE.md            [NEW - Quick Start Guide]
    ├── CHANGES_SUMMARY.md            [NEW - What Changed]
    └── ARCHITECTURE.md               [This File]
```

---

## Error Handling Tree

```
User Makes Request
│
├─ Frontend Error
│  ├─ Microphone Permission Denied
│  │  └─ logger.error() → Alert User → Reset to idle
│  │
│  ├─ Network Error
│  │  └─ logger.error() → Show error in response → Try again
│  │
│  └─ File Upload Invalid
│     ├─ Size > 25MB
│     │  └─ logger.warn() → Alert User
│     │
│     └─ Type not PDF/JPG/PNG
│        └─ logger.warn() → Alert User
│
└─ Backend Error
   ├─ Audio Processing Error
   │  ├─ Whisper model not found
   │  │  └─ logger.error() → Return error response
   │  │
   │  └─ Audio format unsupported
   │     └─ logger.error() → Return error response
   │
   ├─ RAG Engine Error
   │  ├─ Gemini API timeout
   │  │  └─ logger.error() → Return error response
   │  │
   │  └─ Query parsing failed
   │     └─ logger.error() → Return error response
   │
   ├─ TTS Generation Error
   │  ├─ Edge-TTS service unavailable
   │  │  └─ logger.error() → Return error response
   │  │
   │  └─ MP3 generation failed
   │     └─ logger.error() → Return error response
   │
   └─ Cleanup Error
      ├─ Temp audio file not deleted
      │  └─ logger.warning() → Continue cleanup
      │
      └─ Temp PDF file not deleted
         └─ logger.warning() → Continue cleanup

All errors logged with [ERROR] prefix
User sees friendly message in target language
Backend continues to next request
```

---

## Logging Output Map

```
Browser Console (Frontend)
═══════════════════════════════════════════════════════════════
[SETU-PWA] Starting audio processing (size: 12345 bytes)
[SETU-PWA] Sending request to http://localhost:8000/api/chat
[SETU-PWA] Received response from backend
[SETU-PWA] Playing audio from http://localhost:8000/static/audio/xyz.mp3
[SETU-PWA] ✓ Response displayed


Backend Terminal (FastAPI)
═══════════════════════════════════════════════════════════════
[2026-01-13 14:30:45,123] INFO - __main__ - [INIT] Static folder mounted at /static
[2026-01-13 14:30:45,124] INFO - __main__ - [INIT] CORS middleware configured
[2026-01-13 14:30:50,200] INFO - __main__ - [CHAT] Request received - Language: hi, Has audio: True
[2026-01-13 14:30:50,250] INFO - __main__ - [CHAT-PHASE1] Audio saved to: temp_abc123_recording.webm
[2026-01-13 14:30:50,300] INFO - __main__ - [CHAT-PHASE1] Transcribed query: 'क्या कल स्कूल की छुट्टी है?'
[2026-01-13 14:30:50,350] INFO - audio - [AUDIO] Transcribing file: temp_abc123_recording.webm
[2026-01-13 14:30:50,400] INFO - audio - [AUDIO] Transcribed: क्या कल स्कूल...
[2026-01-13 14:30:50,450] INFO - __main__ - [CHAT-PHASE2] Querying RAG engine...
[2026-01-13 14:30:50,550] INFO - __main__ - [CHAT-PHASE2] RAG response: 'हां, कल दिवाली की छुट्टी है...'
[2026-01-13 14:30:50,600] INFO - __main__ - [CHAT-PHASE3] Generating speech...
[2026-01-13 14:30:50,700] INFO - audio - [AUDIO] Generating speech for: हां, कल दिवाली...
[2026-01-13 14:30:51,000] INFO - audio - [AUDIO] Generated audio: /static/audio/xyz789.mp3
[2026-01-13 14:30:51,050] INFO - __main__ - [CLEANUP] Removed temp audio: temp_abc123_recording.webm
[2026-01-13 14:30:51,100] INFO - __main__ - [CHAT] ✓ Request completed successfully
```

---

## State Management Diagram

```
                    ┌────────────────────────────────┐
                    │       Initial State: IDLE       │
                    │  (App ready, no activity)       │
                    └────────────┬───────────────────┘
                                 │
                     [User taps microphone button]
                                 │
                                 ↓
                    ┌────────────────────────────────┐
                    │    State: RECORDING             │
                    │  (Capturing audio from mic)     │
                    │  [Cancel] [Stop/Pause]          │
                    └────────────┬───────────────────┘
                                 │
                    [User releases microphone button]
                                 │
                                 ↓
                    ┌────────────────────────────────┐
                    │    State: PROCESSING            │
                    │  (Backend working)              │
                    │  [Spinner animation]            │
                    │  ├─ Phase 1: Transcribe...      │
                    │  ├─ Phase 2: Generate...        │
                    │  └─ Phase 3: Audio...           │
                    └────────────┬───────────────────┘
                                 │
                    [Backend returns response]
                                 │
                                 ↓
                    ┌────────────────────────────────┐
                    │    State: RESPONSE              │
                    │  (Display results)              │
                    │  ├─ Answer text (5 bullets)     │
                    │  ├─ Audio player                │
                    │  └─ [Ask New Question]          │
                    └────────────┬───────────────────┘
                                 │
                    [User clicks "Ask New Question"]
                                 │
                                 └─────→ IDLE (loop)
```

---

## API Endpoint Specification

```
Endpoint: POST /api/chat
Base URL: http://localhost:8000

Request Headers:
  Content-Type: multipart/form-data

Request Body (FormData):
  • audio_file: <audio blob>      [Optional, webm/mp4/wav]
  • text_query: <string>          [Optional, text input]
  • pdf_file: <file>              [Optional, document]
  • language: <string>            [Required: "hi", "en", "mr"]

Authentication: None (localhost)

Response (200 OK):
  Content-Type: application/json
  {
    "question": <string>,         // Original user query
    "answer": <string>,           // AI-generated answer
    "audio_url": <string>         // Path to audio file
  }

Response (400 Bad Request):
  {
    "error": <string>,
    "answer": <string>            // Fallback message
  }

Response (500 Internal Server Error):
  {
    "error": <string>,
    "answer": <string>            // Error message
  }

Example Request:
  POST http://localhost:8000/api/chat
  FormData:
    - audio_file: [WebM blob]
    - language: "hi"

Example Response:
  {
    "question": "क्या कल स्कूल की छुट्टी है?",
    "answer": "हां, कल दिवाली की छुट्टी है। सभी कक्षाएं बंद रहेंगी।",
    "audio_url": "/static/audio/abc123xyz789.mp3"
  }

Audio Playback:
  new Audio("http://localhost:8000" + response.audio_url)
  audio.play()
```

---

## Performance Characteristics

```
First Request (Cold Start)
├─ Whisper model load:    ~5-10 seconds
└─ Processing time:       ~2-3 seconds
   Total:                 ~7-13 seconds

Subsequent Requests (Warm State)
├─ Transcribe:            ~1-2 seconds
├─ RAG Processing:        ~1-2 seconds
└─ TTS Generation:        ~2-3 seconds
   Total:                 ~4-7 seconds

Audio Playback
├─ Start latency:         ~300ms
├─ Streaming:             Real-time
└─ Stop:                  User controlled

Concurrent Users
├─ Async handling:        100+ simultaneous
├─ Bottleneck:            TTS generation
└─ Scaling:               Horizontal via load balancer
```

---

**Architecture Version:** 1.0.0  
**Last Updated:** January 13, 2026  
**Status:** Production Ready
