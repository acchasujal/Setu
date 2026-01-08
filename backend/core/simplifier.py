"""
simplifier.py

Converts extracted text into simple, spoken Hinglish.
"""

def simplify_explanation(data: dict) -> str:
    answer = data.get("answer", "").strip()

    if not answer:
        return "Is notice mein clear information nahi di gayi hai."

    # Make it sound spoken and reassuring
    return (
        "Sunita, dhyaan se suniye. "
        + answer.replace("\n", " ")
    )


