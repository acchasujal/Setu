from transformers import pipeline
from typing import Optional

# Load QA model once (IMPORTANT: do NOT reload per request)
qa_pipeline = pipeline(
    "question-answering",
    model="distilbert-base-cased-distilled-squad"
)


def extract_structured_info(
    extracted_text: str,
    question: Optional[str] = None
) -> str:
    """
    Answer a question based ONLY on the PDF text.
    If no question is provided, give a short summary-style answer.
    """

    # Safety checks
    if not extracted_text or not extracted_text.strip():
        return "Notice ka text samajh nahi aaya."

    # If no question asked → default helpful prompt
    if not question or not question.strip():
        question = "What should the parent do?"

    # Trim context to avoid overloading model
    context = extracted_text.strip()

    # Hard limit context size (VERY IMPORTANT)
    MAX_CHARS = 3000
    if len(context) > MAX_CHARS:
        context = context[:MAX_CHARS]

    try:
        result = qa_pipeline(
            question=question,
            context=context
        )

        answer = result.get("answer", "").strip()

        if not answer:
            return "Is notice mein is sawaal ka clear jawab nahi diya gaya hai."

        # Force short answers (hackathon demo friendly)
        if len(answer.split()) > 25:
            answer = " ".join(answer.split()[:25]) + "..."

        return answer

    except Exception:
        return "Is notice ko samajhne mein dikkat aa rahi hai."






