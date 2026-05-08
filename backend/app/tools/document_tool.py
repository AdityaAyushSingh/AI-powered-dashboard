from __future__ import annotations
"""
Document retrieval tool — semantic search over ingested PDF documents.
Primary: ChromaDB vector search (requires ONNX model download on first run).
Fallback: TF-IDF keyword search over the JSON index (always available).
"""
import json
import math
import re
from collections import defaultdict
from pathlib import Path

import chromadb

from app.config import get_settings
from app.utils.security import sanitize_string_param, clamp_int
from app.utils.logger import get_logger

settings = get_settings()
log = get_logger("document_tool")

CHROMA_DIR = Path(settings.chroma_persist_dir)
COLLECTION_NAME = "internal_documents"
FALLBACK_INDEX_PATH = CHROMA_DIR / "fallback_index.json"

_VALID_DOC_TYPES = {"all", "quarterly_report", "campaign_summary", "content_roadmap",
                    "policy", "audience_behavior"}

_chroma_collection = None
_fallback_index: list[dict] | None = None
_tfidf_cache: dict | None = None


def _get_chroma_collection():
    global _chroma_collection
    if _chroma_collection is not None:
        return _chroma_collection
    try:
        client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        col = client.get_collection(COLLECTION_NAME)
        if col.count() > 0:
            _chroma_collection = col
            return _chroma_collection
    except Exception as e:
        log.debug("ChromaDB not available", error=str(e)[:100])
    return None


def _load_fallback_index() -> list[dict]:
    global _fallback_index
    if _fallback_index is not None:
        return _fallback_index
    if FALLBACK_INDEX_PATH.exists():
        with open(FALLBACK_INDEX_PATH, encoding="utf-8") as f:
            _fallback_index = json.load(f)
        log.debug("Loaded fallback index", chunks=len(_fallback_index))
    else:
        _fallback_index = []
    return _fallback_index


# ── TF-IDF keyword search ─────────────────────────────────────────────────────

def _tokenise(text: str) -> list[str]:
    return re.findall(r"\b[a-z]{2,}\b", text.lower())


def _build_tfidf(docs: list[str]) -> dict:
    """Build IDF table and per-doc term frequencies."""
    N = len(docs)
    df: dict[str, int] = defaultdict(int)
    tfs: list[dict[str, float]] = []

    for doc in docs:
        tokens = _tokenise(doc)
        if not tokens:
            tfs.append({})
            continue
        tf: dict[str, float] = defaultdict(float)
        for t in tokens:
            tf[t] += 1
        max_freq = max(tf.values())
        tf = {t: v / max_freq for t, v in tf.items()}
        tfs.append(tf)
        for t in set(tokens):
            df[t] += 1

    idf = {t: math.log(N / (1 + n)) for t, n in df.items()}
    return {"tfs": tfs, "idf": idf}


def _tfidf_score(query_tokens: list[str], tf: dict[str, float], idf: dict[str, float]) -> float:
    return sum(tf.get(t, 0) * idf.get(t, 0) for t in query_tokens)


def _keyword_search(query: str, entries: list[dict], doc_filter: str, n: int) -> list[dict]:
    global _tfidf_cache

    filtered = entries
    if doc_filter != "all":
        filtered = [e for e in entries if e["meta"].get("doc_type") == doc_filter]

    if not filtered:
        return []

    docs_text = [e["text"] for e in filtered]
    cache_key = id(filtered)

    if _tfidf_cache is None or _tfidf_cache.get("key") != cache_key:
        _tfidf_cache = {"key": cache_key, **_build_tfidf(docs_text)}

    query_tokens = _tokenise(query)
    scored = []
    for i, entry in enumerate(filtered):
        score = _tfidf_score(query_tokens, _tfidf_cache["tfs"][i], _tfidf_cache["idf"])
        if score > 0:
            scored.append((score, entry))

    scored.sort(key=lambda x: x[0], reverse=True)

    passages = []
    for score, entry in scored[:n]:
        passages.append({
            "text": entry["text"],
            "source": entry["meta"].get("source", ""),
            "doc_type": entry["meta"].get("doc_type", ""),
            "page": entry["meta"].get("page", 0),
            "title": entry["meta"].get("title", ""),
            "relevance_score": round(score, 3),
        })
    return passages


# ── Public interface ──────────────────────────────────────────────────────────

def search_documents(query: str, document_filter: str = "all", n_results: int = 3) -> dict:
    """Search internal documents; uses ChromaDB if available, else keyword fallback."""
    query = sanitize_string_param(query, 500)
    if not query:
        return {"error": "Empty query", "passages": []}

    if document_filter not in _VALID_DOC_TYPES:
        document_filter = "all"

    n_results = clamp_int(n_results, 1, 5, 3)

    # ── Try ChromaDB semantic search ──────────────────────────────────────────
    collection = _get_chroma_collection()
    if collection is not None:
        try:
            where = None if document_filter == "all" else {"doc_type": document_filter}
            results = collection.query(
                query_texts=[query],
                n_results=min(n_results, collection.count()),
                where=where,
                include=["documents", "metadatas", "distances"],
            )
            passages = []
            for doc_text, meta, dist in zip(
                results.get("documents", [[]])[0],
                results.get("metadatas", [[]])[0],
                results.get("distances", [[]])[0],
            ):
                relevance = round(1 - float(dist), 3)
                if relevance < 0.2:
                    continue
                passages.append({
                    "text": doc_text,
                    "source": meta.get("source", ""),
                    "doc_type": meta.get("doc_type", ""),
                    "page": meta.get("page", 0),
                    "title": meta.get("title", ""),
                    "relevance_score": relevance,
                })

            return {
                "query": query,
                "passages": passages,
                "total_found": len(passages),
                "retrieval_method": "semantic",
                "source": "documents",
            }
        except Exception as e:
            log.warning("ChromaDB query failed, using keyword fallback", error=str(e)[:100])

    # ── Fallback: keyword/TF-IDF search ──────────────────────────────────────
    entries = _load_fallback_index()
    if not entries:
        return {
            "error": "Document index not available. Run: python3 -m app.ingestion.ingest_documents",
            "passages": [],
        }

    passages = _keyword_search(query, entries, document_filter, n_results)
    return {
        "query": query,
        "passages": passages,
        "total_found": len(passages),
        "retrieval_method": "keyword",
        "source": "documents",
    }
