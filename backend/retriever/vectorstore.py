import os
import logging
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document

logger = logging.getLogger("skillnova.retriever")


# -----------------------------------------------
# LOAD DOCUMENTS (UPGRADED)
# -----------------------------------------------
def load_documents(folder_path="knowledge_base"):
    docs = []

    if not os.path.exists(folder_path):
        logger.warning(f"[DOCS] Folder not found: {folder_path}")
        return docs

    for file in os.listdir(folder_path):
        if file.endswith(".txt"):
            path = os.path.join(folder_path, file)

            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read().strip()

                if not content:
                    continue

                metadata = {
                    "source": file,
                    "filename": file
                }

                # topic extraction (safe)
                if "topic:" in content.lower():
                    try:
                        topic_line = next(
                            l for l in content.split("\n")
                            if "topic:" in l.lower()
                        )
                        metadata["topic"] = topic_line.split(":", 1)[1].strip()
                    except Exception:
                        pass

                docs.append(Document(
                    page_content=content,
                    metadata=metadata
                ))

            except Exception as e:
                logger.error(f"[DOC LOAD ERROR] {file}: {e}")

    logger.info(f"[DOCS] Loaded {len(docs)} documents")
    return docs


# -----------------------------------------------
# SPLIT DOCUMENTS (UPGRADED FOR RAG QUALITY)
# -----------------------------------------------
def split_documents(docs):
    if not docs:
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,        # better retrieval precision
        chunk_overlap=120,     # better context continuity
        separators=["\n\n", "\n", ".", " ", ""]
    )

    chunks = splitter.split_documents(docs)

    # attach chunk index (helps debugging + traceability)
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = i

    logger.info(f"[SPLIT] Created {len(chunks)} chunks")
    return chunks


# -----------------------------------------------
# BUILD VECTORSTORE (PRODUCTION UPGRADED)
# -----------------------------------------------
def build_vectorstore():
    try:
        docs = load_documents()

        if not docs:
            logger.warning("[VECTORSTORE] No documents found")
            return None

        chunks = split_documents(docs)

        if not chunks:
            logger.warning("[VECTORSTORE] No chunks created")
            return None

        # optimized embedding config
        embedding = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={
                "normalize_embeddings": True  # improves similarity search
            }
        )

        vectorstore = FAISS.from_documents(
            chunks,
            embedding
        )

        logger.info(f"[FAISS] Index ready ({len(chunks)} chunks)")
        return vectorstore

    except Exception:
        logger.exception("[VECTORSTORE ERROR]")
        return None