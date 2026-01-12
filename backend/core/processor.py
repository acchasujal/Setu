from google import genai
from dotenv import load_dotenv

load_dotenv()

# Gemini client auto-loads GEMINI_API_KEY from .env
client = genai.Client()


def answer_from_notice(notice_text: str, question: str) -> str:
    prompt = f"""
You are explaining a school or scholarship notice to a parent.

NOTICE TEXT:
{notice_text}

QUESTION FROM PARENT:
{question}

Rules:
- Answer ONLY what the question asks
- Keep it VERY short (1–2 sentences max)
- Use simple spoken Hindi (Hinglish)
- If the answer is not mentioned in the notice, say:
  "Notice mein mention nahi hai."
- If date, document, or process is mentioned, say it clearly

Answer:
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text.strip()






