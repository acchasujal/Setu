"""
Audio processing module for SETU backend.

Handles:
- Cloud-based Speech-to-Text (STT) using Groq (Whisper-large-v3-turbo)
- Text-to-Speech (TTS) using Edge-TTS
"""

import logging
import os
import uuid
import asyncio
import edge_tts
from pathlib import Path
from typing import Optional
from groq import Groq
from dotenv import load_dotenv

# Load environment variables (GROQ_API_KEY)
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Initialize Groq Client
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

async def transcribe_audio(audio_file_path: str, language: Optional[str] = None) -> str:
    """
    Transcribe audio file to text using Groq Cloud Whisper API.
    
    Optimized for Hinglish (Hindi + English) and Indian accents using 
    the whisper-large-v3-turbo model.

    Args:
        audio_file_path: Path to audio file (.webm, .wav, .mp3, etc.)
        language: Optional language code (e.g., 'hi', 'en', 'mr').

    Returns:
        Transcribed text as string. Empty string if transcription fails.
    """
    if not GROQ_API_KEY:
        logger.error("[AUDIO] GROQ_API_KEY not found in environment variables.")
        return ""

    try:
        logger.info(f"[AUDIO] Cloud Transcribing: {audio_file_path}")
        
        # Optimized vocabulary prompt for Indian education context
        # This helps the model recognize Hinglish terms correctly.
        vocab_prompt = (
            "Setu help. Scholarship application form, kab bharna hai? "
            "Kya scholarship documents submit ho gaye? Last date 20 July hai. "
            "Income certificate, caste certificate, domicile, marksheet, Aadhar card. "
            "School notice, circular, fee structure, admission procedure. "
            "Namaste, mujhe results check karne hain. "
            "Maza mulga, maza mulgi, shikshan, shala, mahiti pahije."
        )

        with open(audio_file_path, "rb") as file:
            # Groq is 100x faster than local CPU transcription
            transcription = await asyncio.to_thread(
                client.audio.transcriptions.create,
                file=(os.path.basename(audio_file_path), file.read()),
                model="whisper-large-v3-turbo",
                response_format="text",
                language=language,
                prompt=vocab_prompt
            )
        
        transcribed_text = transcription.strip()
        logger.info(f"[AUDIO] Result: {transcribed_text[:100]}...")
        return transcribed_text

    except Exception as e:
        logger.error(f"[AUDIO] Groq API Error: {e}")
        return ""


async def text_to_speech(text: str, lang: str = "hi") -> Optional[str]:
    """
    Convert text to speech using Edge-TTS and save as MP3.

    Args:
        text: Text to convert to speech
        lang: Language code (default: 'hi' for Hindi)

    Returns:
        URL path to the generated audio file.
    """
    try:
        # Map language codes to natural-sounding regional voices
        voice_map = {
            "hi": "hi-IN-MadhurNeural",   # Hindi (India) - Male
            "en": "en-IN-NeerjaNeural",   # English (India) - Female (Better for Indian context)
            "mr": "mr-IN-AarohiNeural",   # Marathi (India) - Female
        }

        voice = voice_map.get(lang, voice_map["hi"])

        # Ensure static/audio directory exists
        audio_dir = Path("static/audio")
        audio_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename for this session
        audio_filename = f"{uuid.uuid4().hex}.mp3"
        audio_path = audio_dir / audio_filename

        logger.info(f"[AUDIO] Generating speech for language: {lang}")
        communicate = edge_tts.Communicate(text, voice)
        
        # Save the audio file asynchronously
        await communicate.save(str(audio_path))

        # Return relative URL path for the frontend to play
        audio_url = f"/static/audio/{audio_filename}"
        return audio_url

    except Exception as e:
        logger.error(f"[AUDIO] Error generating speech: {e}")
        return None