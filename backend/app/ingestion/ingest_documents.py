from __future__ import annotations
"""
Ingests PDF documents into ChromaDB for semantic retrieval.
Chunks text with metadata, embeds using the default sentence-transformers model.
Also writes a JSON fallback index for keyword retrieval when ChromaDB is unavailable.
"""
import json
import re
from pathlib import Path

import chromadb

from pypdf import PdfReader

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
log = get_logger("ingest_documents")

CHROMA_DIR = Path(settings.chroma_persist_dir)
PDF_DIR = Path(settings.pdf_data_dir)
COLLECTION_NAME = "internal_documents"
CHUNK_SIZE = 600
CHUNK_OVERLAP = 100

# JSON fallback index — written even if ChromaDB embedding fails
FALLBACK_INDEX_PATH = CHROMA_DIR / "fallback_index.json"

DOC_TYPES = {
    "quarterly_executive_report": "quarterly_report",
    "campaign_performance_summary": "campaign_summary",
    "content_roadmap": "content_roadmap",
    "policy_guidelines": "policy",
    "audience_behavior_report": "audience_behavior",
}


def _get_doc_type(filename: str) -> str:
    stem = Path(filename).stem
    for key, doc_type in DOC_TYPES.items():
        if key in stem:
            return doc_type
    return "general"


def _extract_text(pdf_path: Path) -> list[dict]:
    reader = PdfReader(str(pdf_path))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            pages.append({"page": i, "text": text})
    return pages


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current = ""
    for sentence in sentences:
        if len(current) + len(sentence) > chunk_size and current:
            chunks.append(current.strip())
            current = current[-overlap:] + " " + sentence
        else:
            current += " " + sentence
    if current.strip():
        chunks.append(current.strip())
    return chunks


def _build_chunk_list(pdf_files: list[Path]) -> tuple[list[str], list[str], list[dict]]:
    """Extract all chunks from PDFs; return (ids, documents, metadatas)."""
    all_ids, all_docs, all_metas = [], [], []
    chunk_idx = 0

    for pdf_path in pdf_files:
        doc_type = _get_doc_type(pdf_path.name)
        try:
            pages = _extract_text(pdf_path)
        except Exception as e:
            log.warning("Failed to extract PDF", file=pdf_path.name, error=str(e))
            continue

        for page_info in pages:
            page_num = page_info["page"]
            for chunk in _chunk_text(page_info["text"]):
                if len(chunk) < 50:
                    continue
                chunk_id = f"{pdf_path.stem}_p{page_num}_c{chunk_idx}"
                all_ids.append(chunk_id)
                all_docs.append(chunk)
                all_metas.append({
                    "source": pdf_path.name,
                    "doc_type": doc_type,
                    "page": page_num,
                    "title": pdf_path.stem.replace("_", " ").title(),
                })
                chunk_idx += 1

    return all_ids, all_docs, all_metas


def _write_fallback_index(ids: list[str], docs: list[str], metas: list[dict]) -> None:
    """Write a simple JSON keyword index as a reliable fallback."""
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    entries = [{"id": i, "text": d, "meta": m} for i, d, m in zip(ids, docs, metas)]
    with open(FALLBACK_INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f)
    log.info("Fallback JSON index written", chunks=len(entries), path=str(FALLBACK_INDEX_PATH))


def ingest(force: bool = False) -> int:
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)

    pdf_files = list(PDF_DIR.glob("*.pdf"))
    if not pdf_files:
        log.warning("No PDF files found", dir=str(PDF_DIR))
        return 0

    # Always build chunks — needed for fallback index
    log.info("Extracting text from PDFs", count=len(pdf_files))
    all_ids, all_docs, all_metas = _build_chunk_list(pdf_files)

    if not all_ids:
        log.warning("No chunks extracted from PDFs")
        return 0

    # Write fallback JSON index (no network dependency)
    _write_fallback_index(all_ids, all_docs, all_metas)

    # Try ChromaDB with embeddings
    try:
        client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        existing = [c.name for c in client.list_collections()]

        if COLLECTION_NAME in existing:
            if not force:
                col = client.get_collection(COLLECTION_NAME)
                count = col.count()
                if count > 0:
                    log.info("ChromaDB collection already populated, skipping", count=count)
                    return count
            client.delete_collection(COLLECTION_NAME)

        collection = client.create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

        log.info("Embedding chunks into ChromaDB", total=len(all_ids))
        BATCH = 100
        for start in range(0, len(all_ids), BATCH):
            collection.add(
                ids=all_ids[start:start + BATCH],
                documents=all_docs[start:start + BATCH],
                metadatas=all_metas[start:start + BATCH],
            )

        log.info("ChromaDB ingestion complete", chunks=len(all_ids))
        return len(all_ids)

    except Exception as e:
        log.warning(
            "ChromaDB embedding ingestion failed — keyword fallback will be used",
            error=str(e)[:200],
        )
        return len(all_ids)  # fallback index was already written


if __name__ == "__main__":
    ingest(force=True)
