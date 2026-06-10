"""
Retriever module for SkillNova.

Handles:
- Document loading from knowledge base (with YAML metadata extraction)
- Text chunking (~500 tokens, 50 overlap — per best practices)
- FAISS vector store creation and search
- Metadata-aware filtering

DESIGN: Vector store is pluggable. Can swap FAISS for Chroma, Pinecone, etc.
"""

import os
import re
import glob
import yaml
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document


def _extract_metadata(text: str, file_path: str) -> tuple[dict, str]:
    """
    Extract YAML frontmatter metadata from document text.
    
    Format:
        ---
        source: filename.txt
        topic: Attendance
        importance: high
        ---
        <actual content>
    
    Returns: (metadata_dict, content_without_frontmatter)
    """
    default_meta = {
        "source": os.path.basename(file_path),
        "topic": "General",
        "importance": "medium",
    }

    pattern = r'^---\s*\n(.*?)\n---\s*\n'
    match = re.match(pattern, text, re.DOTALL)

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


def load_and_index_documents(kb_dir: str = None) -> FAISS:
    """
    Load all .txt files from the knowledge base directory,
    extract metadata, chunk them, embed them, and build a FAISS vector store.
    
    Metadata fields extracted from YAML frontmatter:
      - source: filename
      - topic: Attendance | Tasks | Meeting | Evaluation | DSA | Reports | etc.
      - importance: high | medium | low
      - last_updated: date string
      - author: department/person
    
    Chunk config: ~500 tokens, 50 overlap (tight, focused chunks).
    Embedding: all-MiniLM-L6-v2 (local, free, battle-tested).
    
    Returns: FAISS vectorstore instance
    """
    if kb_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        kb_dir = os.path.join(base_dir, "knowledge_base")

    kb_path = os.path.join(kb_dir, "*.txt")

    # 1. Load documents with metadata extraction
    docs = []
    for file_path in sorted(glob.glob(kb_path)):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                raw_text = f.read()

            metadata, content = _extract_metadata(raw_text, file_path)
            metadata["file_path"] = file_path

            doc = Document(page_content=content, metadata=metadata)
            docs.append(doc)
            print(f"  [DOC] Loaded: {metadata['source']} [topic={metadata['topic']}, importance={metadata['importance']}]")
        except Exception as e:
            print(f"  [WARN] Failed to load {os.path.basename(file_path)}: {e}")

    if not docs:
        raise FileNotFoundError(f"No .txt files found in {kb_dir}")

    # 2. Chunk documents (~500 chars, 50 overlap)
    #    Metadata is automatically propagated to each chunk
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    splits = text_splitter.split_documents(docs)
    print(f"  [SPLIT] Split {len(docs)} documents into {len(splits)} chunks")

    # 3. Build embeddings (local HuggingFace model)
    print("  [EMBED] Building embeddings (first run downloads ~80MB model)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # 4. Build FAISS vector store
    vectorstore = FAISS.from_documents(splits, embeddings)
    print(f"  [FAISS] Index ready ({len(splits)} vectors)")

    return vectorstore


def search(vectorstore: FAISS, query: str, k: int = 4, topic_filter: str = None):
    """
    Run similarity search against the vector store.
    
    Args:
        vectorstore: FAISS vector store instance
        query: Search query string
        k: Number of results to return
        topic_filter: Optional topic to filter results (e.g., "Attendance")
    
    Returns:
        List of Document objects matching the query and filters
    """
    # Fetch more results if filtering, since some will be removed
    fetch_k = k * 3 if topic_filter else k
    docs = vectorstore.similarity_search(query, k=fetch_k)

    if topic_filter:
        filtered = [d for d in docs if d.metadata.get("topic", "").lower() == topic_filter.lower()]
        return filtered[:k] if filtered else docs[:k]  # fallback to unfiltered if no matches

    return docs[:k]


def get_available_topics(kb_dir: str = None) -> list[dict]:
    """
    List all knowledge base documents with their metadata.
    Useful for MCP tool discovery and agent routing.
    """
    if kb_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        kb_dir = os.path.join(base_dir, "knowledge_base")

    topics = []
    for file_path in sorted(glob.glob(os.path.join(kb_dir, "*.txt"))):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                raw_text = f.read()
            metadata, _ = _extract_metadata(raw_text, file_path)
            topics.append(metadata)
        except Exception:
            pass

    return topics
