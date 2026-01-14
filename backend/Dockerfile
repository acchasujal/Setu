# Use a stable Python base
FROM python:3.11-slim

# 1. Install system dependencies first (FFmpeg is mandatory for Whisper/TTS)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Copy only requirements first to leverage Docker cache
COPY requirements.txt .

# 4. Install Python dependencies
# --no-cache-dir keeps the image size small for Render's free tier
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of the backend code
COPY . .

# 6. Pre-create necessary directories
RUN mkdir -p static/audio

# 7. Start the application
# We use $PORT because Render dynamically assigns a port
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]