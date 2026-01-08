"""
Robust RAG utilities for hackathon demo.

- Loads curated text files as knowledge base
- Uses sentence-transformers for embeddings
- Uses FAISS for retrieval
- Works even when backend is inside venv
"""

from pathlib import Path
from typing import List, Tuple

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer


# -------------------------------
# PATH RESOLUTION (ROBUST)
# -------------------------------
def _find_knowledge_base_dir() -> Path:
    """
    Find knowledge_base directory robustly by walking up directories.
    """
    current = Path(__file__).resolve()

    for parent in current.parents:
        # Case 1: backend/knowledge_base
        candidate = parent / "knowledge_base"
        if candidate.exists():
            return candidate

        # Case 2: backend/core/../knowledge_base
        if parent.name == "core":
            candidate = parent.parent / "knowledge_base"
            if candidate.exists():
                return candidate

    raise FileNotFoundError(
        "knowledge_base directory not found. "
        "Ensure a folder named 'knowledge_base' exists with .txt files."
    )


# -------------------------------
# LOAD & CHUNK TEXT FILES
# -------------------------------
def _load_text_files(directory: Path) -> List[str]:
    texts: List[str] = []

    for txt in directory.glob("*.txt"):
        try:
            content = txt.read_text(encoding="utf-8").strip()
            if content:
                texts.append(content)
        except Exception:
            continue

    return texts


def _chunk_text(text: str, max_words: int = 200) -> List[str]:
    words = text.split()
    chunks = []

    for i in range(0, len(words), max_words):
        chunk = " ".join(words[i:i + max_words]).strip()
        if chunk:
            chunks.append(chunk)

    return chunks


# -------------------------------
# BUILD KNOWLEDGE BASE
# -------------------------------
def build_knowledge_base() -> Tuple[faiss.IndexFlatL2, List[str]]:
    kb_dir = _find_knowledge_base_dir()
    print(f"[RAG] Knowledge base directory: {kb_dir}")

    raw_texts = _load_text_files(kb_dir)
    print(f"[RAG] Loaded {len(raw_texts)} text files")

    chunk_texts: List[str] = []
    for text in raw_texts:
        chunk_texts.extend(_chunk_text(text))

    print(f"[RAG] Created {len(chunk_texts)} chunks")

    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    dim = model.get_sentence_embedding_dimension()

    index = faiss.IndexFlatL2(dim)

    if not chunk_texts:
        return index, []

    embeddings = model.encode(
        chunk_texts,
        convert_to_numpy=True,
        show_progress_bar=False
    ).astype("float32")

    index.add(embeddings)
    return index, chunk_texts


# -------------------------------
# RETRIEVE CONTEXT
# -------------------------------
def retrieve_context(
    query: str,
    faiss_index: faiss.IndexFlatL2,
    chunk_texts: List[str],
    top_k: int = 3
) -> str:
    if not chunk_texts:
        return ""

    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    query_embedding = model.encode(
        [query],
        convert_to_numpy=True,
        show_progress_bar=False
    ).astype("float32")

    top_k = min(top_k, len(chunk_texts))
    _, indices = faiss_index.search(query_embedding, top_k)

    retrieved = []
    for idx in indices[0]:
        retrieved.append(chunk_texts[idx])

    return "\n\n---\n\n".join(retrieved)


# -------------------------------
# MANUAL TEST
# -------------------------------
if __name__ == "__main__":
    print("\n[RAG TEST] Building knowledge base...\n")
    index, chunks = build_knowledge_base()

    print("\n[RAG TEST] Querying...\n")
    query = "income certificate deadline"
    context = retrieve_context(query, index, chunks)

    print("Retrieved context:\n")
    print(context if context else "[NO CONTEXT FOUND]")
