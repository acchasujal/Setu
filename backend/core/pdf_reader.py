"""
pdf_reader.py

Extracts raw text from PDF files using pdfplumber.
"""

import pdfplumber


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from a PDF file.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Extracted text as a single string.
        Returns empty string if extraction fails.
    """
    text_parts = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception:
        return ""

    return "\n".join(text_parts)

