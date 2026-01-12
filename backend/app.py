from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from core.pdf_reader import extract_text_from_pdf
from core.processor import answer_from_notice

app = FastAPI(title="Setu Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok", "message": "Setu backend running"}


@app.post("/process")
async def process_pdf(
    pdf_file: UploadFile = File(...),
    question: str = Form(...)
):
    # Save PDF temporarily
    pdf_path = f"temp_{pdf_file.filename}"
    with open(pdf_path, "wb") as f:
        f.write(await pdf_file.read())

    # Extract text
    extracted_text = extract_text_from_pdf(pdf_path)

    # Gemini reasoning
    simplified_answer = answer_from_notice(extracted_text, question)

    return {
        "simplified_text": simplified_answer
    }
