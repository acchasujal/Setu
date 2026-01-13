"""
Audio processing module for SETU backend.

Handles:
- Speech-to-Text (STT) using OpenAI Whisper
- Text-to-Speech (TTS) using Edge-TTS
"""

import logging
import whisper
import edge_tts
import uuid
import asyncio
from pathlib import Path
from typing import Optional

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Whisper model cache
_whisper_model = None


def _get_whisper_model(model_size: str = "base"):
    """
    Lazy load Whisper model to avoid heavy load on import.
    Falls back to 'tiny' if the requested model fails.
    """
    global _whisper_model
    if _whisper_model is None:
        try:
            logger.info(f"[AUDIO] Loading Whisper model: {model_size}")
            _whisper_model = whisper.load_model(model_size)
        except Exception as e:
            logger.warning(f"[AUDIO] Failed to load '{model_size}' model: {e}")
            logger.info("[AUDIO] Falling back to 'tiny' model...")
            try:
                _whisper_model = whisper.load_model("tiny")
            except Exception as e2:
                logger.error(f"[AUDIO] Could not load Whisper model: {e2}")
                raise
    return _whisper_model


async def transcribe_audio(audio_file_path: str, language: Optional[str] = None) -> str:
    """
    Transcribe audio file to text using OpenAI Whisper.

    Args:
        audio_file_path: Path to audio file (.webm, .wav, .mp3, etc.)
        language: Optional language code (e.g., 'hi', 'en'). If None, auto-detect.

    Returns:
        Transcribed text as string. Empty string if transcription fails.
    """
    try:
        model = _get_whisper_model()
        logger.info(f"[AUDIO] Transcribing file: {audio_file_path}")
        
        # Whisper is CPU-bound and blocking, so we run it in a separate thread
        # to prevent blocking the FastAPI event loop.
        result = await asyncio.to_thread(
            model.transcribe, audio_file_path, language=language
        )
        
        transcribed_text = result["text"].strip()
        logger.info(f"[AUDIO] Transcribed: {transcribed_text[:100]}...")
        return transcribed_text
    except Exception as e:
        logger.error(f"[AUDIO] Error transcribing audio: {e}")
        return ""


async def text_to_speech(text: str, lang: str = "hi") -> Optional[str]:
    """
    Convert text to speech using Edge-TTS and save as MP3.

    Args:
        text: Text to convert to speech
        lang: Language code (default: 'hi' for Hindi)

    Returns:
        URL path to the generated audio file (e.g., '/static/audio/xxx.mp3')
        Returns None if TTS fails.
    """
    try:
        # Map language codes to Edge-TTS voice names
        voice_map = {
            "hi": "hi-IN-MadhurNeural",  # Hindi (India) - Male voice
            "en": "en-US-AriaNeural",    # English (US) - Female voice
            "mr": "mr-IN-AarohiNeural",  # Marathi (India) - Female voice
        }

        voice = voice_map.get(lang, voice_map["hi"])

        # Ensure static/audio directory exists
        audio_dir = Path("static/audio")
        audio_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        audio_filename = f"{uuid.uuid4().hex}.mp3"
        audio_path = audio_dir / audio_filename

        # Generate speech
        logger.info(f"[AUDIO] Generating speech for: {text[:50]}...")
        communicate = edge_tts.Communicate(text, voice)
        
        # FIX: 'communicate.save' is already an async coroutine.
        # Do NOT use asyncio.to_thread here. Await it directly.
        await communicate.save(str(audio_path))

        # Return URL path for frontend
        audio_url = f"/static/audio/{audio_filename}"
        logger.info(f"[AUDIO] Generated audio: {audio_url}")
        return audio_url

    except Exception as e:
        logger.error(f"[AUDIO] Error generating speech: {e}")
        return None