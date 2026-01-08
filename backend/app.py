from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from core.pdf_reader import extract_text_from_pdf
from core.processor import extract_structured_info

app = FastAPI(title="AwaazSetu Backend")

# Allow frontend / Postman
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temp upload directory
UPLOAD_DIR = Path("temp/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/")
def root():
    return {"status": "ok", "message": "AwaazSetu backend running"}


@app.post("/process")
async def process_pdf(
    pdf_file: UploadFile = File(...),
    question: str = ""
):
    # Save uploaded PDF
    pdf_path = UPLOAD_DIR / pdf_file.filename
    with open(pdf_path, "wb") as f:
        f.write(await pdf_file.read())

    # Extract text
    extracted_text = extract_text_from_pdf(str(pdf_path))
    if not extracted_text.strip():
        return {"simplified_text": "PDF se text extract nahi ho paaya."}

    # Ask QA model
    answer = extract_structured_info(
        extracted_text,
        question
    )

    # Always return plain JSON
    return {
        "simplified_text": answer
    }
