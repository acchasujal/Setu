# Use a stable Python base
FROM python:3.11-slim

# 1. Install system dependencies
# We KEEP ffmpeg because it is still needed for Edge-TTS (speech generation)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Copy only requirements first
# This ensures heavy installs aren't repeated if you only change a line of code
COPY requirements.txt .

# 4. Install Python dependencies
# We add --upgrade pip to ensure the latest package resolution for the httpx fix
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of the backend code
COPY . .

# 6. Pre-create necessary directories
# Ensure the audio folder is ready for Edge-TTS to save files
RUN mkdir -p static/audio

# 7. Start the application
# Use the $PORT variable provided by Render
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]