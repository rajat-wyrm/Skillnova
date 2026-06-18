"""FAISS vector store + document loading for the SkillNova AI Chatbot."""
from __future__ import annotations

import glob
import logging
import os
import re
from typing import List, Optional

import yaml
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger("skillnova.retriever")

_KB_DEFAULT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge_base"
)


# ─────────────────────────────────────────────────────────────────────
# Metadata extraction (YAML frontmatter)
# ─────────────────────────────────────────────────────────────────────
_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def _extract_metadata(text: str, file_path: str) -> tuple[dict, str]:
    """Extract YAML frontmatter; return ``(metadata, content)``."""
    default_meta = {
        "source": os.path.basename(file_path),
        "topic": "General",
        "importance": "medium",
    }
    match = _FRONTMATTER_RE.match(text)
    if match:
        try:
            parsed = yaml.safe_load(match.group(1))
            if isinstance(parsed, dict):
                default_meta.update(parsed)
            content = text[match.end():]
        except yaml.YAMLError:
            content = text
    else:
        content = text
    return default_meta, content.strip()


# ─────────────────────────────────────────────────────────────────────
# Public API — used by ``main.init_pipeline``
# ─────────────────────────────────────────────────────────────────────
def load_documents(folder_path: str = _KB_DEFAULT) -> List[Document]:
    """Load every ``*.txt`` in ``folder_path`` as LangChain ``Document``."""
    docs: List[Document] = []
    if not os.path.exists(folder_path):
        logger.warning("[DOCS] Folder not found: %s", folder_path)
        return docs

    for path in sorted(glob.glob(os.path.join(folder_path, "*.txt"))):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                raw = fh.read().strip()
            if not raw:
                continue
            metadata, content = _extract_metadata(raw, path)
            metadata["file_path"] = path
            docs.append(Document(page_content=content, metadata=metadata))
        except Exception as exc:
            logger.error("[DOC LOAD ERROR] %s: %s", path, exc)
    logger.info("[DOCS] Loaded %d documents", len(docs))
    return docs


def split_documents(docs: List[Document]) -> List[Document]:
    """Split documents into retrieval-friendly chunks."""
    if not docs:
        return []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=120,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    for idx, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = idx
    logger.info("[SPLIT] Created %d chunks", len(chunks))
    return chunks


def build_vectorstore(kb_dir: str = _KB_DEFAULT) -> Optional[FAISS]:
    """Build (or rebuild) the FAISS index for the knowledge base."""
    try:
        docs = load_documents(kb_dir)
        if not docs:
            logger.warning("[VECTORSTORE] No documents found in %s", kb_dir)
            return None

        chunks = split_documents(docs)
        if not chunks:
            logger.warning("[VECTORSTORE] No chunks created")
            return None

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        vectorstore = FAISS.from_documents(chunks, embeddings)
        logger.info("[FAISS] Index ready (%d chunks)", len(chunks))
        return vectorstore
    except Exception:
        logger.exception("[VECTORSTORE ERROR]")
        return None


def get_available_topics(kb_dir: str = _KB_DEFAULT) -> List[dict]:
    """Return metadata for every KB document (useful for tooling)."""
    topics: List[dict] = []
    for path in sorted(glob.glob(os.path.join(kb_dir, "*.txt"))):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                raw = fh.read()
            metadata, _ = _extract_metadata(raw, path)
            topics.append(metadata)
        except Exception:
            continue
    return topics


# Optional CLI: `python -m retriever.vectorstore`
if __name__ == "__main__":  # pragma: no cover
    vs = build_vectorstore()
    print("FAISS index ready:", vs is not None)
