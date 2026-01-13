import os
import uuid
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Custom Modules
from core.pdf_reader import extract_text_from_pdf
from core.processor import answer_from_notice
from audio import transcribe_audio, text_to_speech 

# Configure Logging with detailed formatting
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s - %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Setu Backend",
    description="Voice-to-Voice PWA for school information queries",
    version="1.0.0"
)

# 1. Mount Static Folder (CRITICAL for serving audio files to frontend)
# Creates /static/audio directory if it doesn't exist
os.makedirs("static/audio", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
logger.info("[INIT] Static folder mounted at /static")

# 2. CORS Setup (Allow frontend to communicate with backend)
# Explicitly allow localhost:3000 for Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev server
        "http://127.0.0.1:3000",      # Localhost variant
        "http://localhost:8000",      # Backend self
        "http://127.0.0.1:8000",      # Backend self variant
        "*"                            # Allow all for development (remove in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("[INIT] CORS middleware configured for ports 3000 and 8000")

@app.get("/")
def health_check():
    """Health check endpoint to verify backend is running."""
    logger.info("[HEALTH] Backend health check successful")
    return {
        "status": "ok",
        "message": "Setu Backend v1.0.0 running",
        "service": "voice-to-voice PWA"
    }


@app.post("/api/chat")
async def chat_handler(
    audio_file: UploadFile = File(None),
    pdf_file: UploadFile = File(None),
    text_query: str = Form(None),
    language: str = Form("hi")
):
    """
    Main chat endpoint that orchestrates the Voice-to-Voice pipeline.
    
    Flow:
    1. HEAR: Transcribe audio to text using Whisper
    2. THINK: Process query with RAG engine and optional PDF context
    3. SPEAK: Convert response to speech using Edge-TTS
    
    Args:
        audio_file: Audio file (webm/wav/mp3)
        pdf_file: Optional PDF document for context
        text_query: Text question if not using audio
        language: Target language code (hi/en/mr)
        
    Returns:
        JSON with question, answer, and audio_url
    """
    temp_audio_path = None
    temp_pdf_path = None
    
    logger.info(f"[CHAT] Request received - Language: {language}, Has audio: {audio_file is not None}, Has PDF: {pdf_file is not None}")
    
    try:
        user_query = ""

        # --- PHASE 1: HEAR (Speech to Text) ---
        if audio_file:
            # Create unique temp file for the audio upload
            temp_audio_path = f"temp_{uuid.uuid4().hex}_{audio_file.filename}"
            with open(temp_audio_path, "wb") as f:
                content = await audio_file.read()
                f.write(content)
            
            logger.info(f"[CHAT-PHASE1] Audio saved to: {temp_audio_path}")
            
            # Transcribe audio to text using Whisper
            user_query = await transcribe_audio(temp_audio_path, language=language)
            logger.info(f"[CHAT-PHASE1] Transcribed query: '{user_query}'")
        
        elif text_query:
            user_query = text_query
            logger.info(f"[CHAT-PHASE1] Received text query: '{user_query}'")
        
        # Validate that we have a query
        if not user_query or user_query.strip() == "":
            logger.warning("[CHAT] No audio or text provided")
            return {
                "error": "No audio or text provided",
                "answer": "कृपया अपना सवाल पूछें।" if language == "hi" else "Please ask a question."
            }

        # --- PHASE 2: THINK (PDF RAG Processing) ---
        extracted_text = ""
        if pdf_file:
            temp_pdf_path = f"temp_{uuid.uuid4().hex}_{pdf_file.filename}"
            with open(temp_pdf_path, "wb") as f:
                f.write(await pdf_file.read())
            
            logger.info(f"[CHAT-PHASE2] PDF saved to: {temp_pdf_path}")
            extracted_text = extract_text_from_pdf(temp_pdf_path)
            logger.info(f"[CHAT-PHASE2] Extracted {len(extracted_text)} characters from PDF")
        
        # Call RAG engine to get answer
        logger.info("[CHAT-PHASE2] Querying RAG engine...")
        response_text = answer_from_notice(extracted_text, user_query)
        logger.info(f"[CHAT-PHASE2] RAG response: '{response_text[:100]}...'")

        # --- PHASE 3: SPEAK (Text to Speech) ---
        logger.info("[CHAT-PHASE3] Generating speech...")
        audio_url = await text_to_speech(response_text, lang=language)
        logger.info(f"[CHAT-PHASE3] Audio generated: {audio_url}")

        logger.info("[CHAT] ✓ Request completed successfully")
        return {
            "question": user_query,
            "answer": response_text,
            "audio_url": audio_url
        }

    except HTTPException as http_err:
        logger.error(f"[CHAT] HTTP Error: {http_err.detail}")
        return {"error": http_err.detail, "answer": "An HTTP error occurred."}
    
    except ValueError as val_err:
        logger.error(f"[CHAT] Validation Error: {str(val_err)}")
        return {"error": str(val_err), "answer": "Invalid input provided."}
    
    except Exception as e:
        logger.error(f"[CHAT] Unexpected Error: {str(e)}", exc_info=True)
        return {
            "error": str(e),
            "answer": "कुछ गलत हो गया। कृपया फिर से कोशिश करें।" if language == "hi" else "Something went wrong. Please try again."
        }

    finally:
        # Cleanup: Always delete temp files even if code crashes
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
                logger.debug(f"[CLEANUP] Removed temp audio: {temp_audio_path}")
            except Exception as e:
                logger.warning(f"[CLEANUP] Failed to remove audio: {str(e)}")
        
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.remove(temp_pdf_path)
                logger.debug(f"[CLEANUP] Removed temp PDF: {temp_pdf_path}")
            except Exception as e:
                logger.warning(f"[CLEANUP] Failed to remove PDF: {str(e)}")