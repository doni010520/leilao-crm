"""
RAG (Retrieval-Augmented Generation) service using pgvector.

Index documents once via index_document(), then call retrieve()
to get relevant chunks before calling the LLM.
"""
import json
from loguru import logger
from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings

settings = get_settings()
_openai = AsyncOpenAI(api_key=settings.openai_api_key)

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMS = 1536


async def embed(text_content: str) -> list[float]:
    resp = await _openai.embeddings.create(model=EMBEDDING_MODEL, input=text_content)
    return resp.data[0].embedding


async def index_document(db: AsyncSession, source: str, content: str) -> None:
    """Chunk and index a document into the knowledge base."""
    chunks = _chunk_text(content, size=800, overlap=100)
    for chunk in chunks:
        vector = await embed(chunk)
        await db.execute(
            text("""
                INSERT INTO knowledge_chunks (source, content, embedding)
                VALUES (:source, :content, :embedding)
            """),
            {"source": source, "content": chunk, "embedding": json.dumps(vector)},
        )
    await db.commit()
    logger.info(f"Indexed {len(chunks)} chunks from '{source}'")


async def retrieve(db: AsyncSession, query: str) -> str:
    """Return top-K relevant chunks as a formatted context string."""
    if not settings.rag_enabled:
        return ""

    try:
        vector = await embed(query)
        result = await db.execute(
            text("""
                SELECT content, source,
                       1 - (embedding <=> :embedding::vector) AS similarity
                FROM knowledge_chunks
                ORDER BY embedding <=> :embedding::vector
                LIMIT :k
            """),
            {"embedding": json.dumps(vector), "k": settings.rag_top_k},
        )
        rows = result.fetchall()
        if not rows:
            return ""

        chunks = "\n\n---\n\n".join(
            f"[Fonte: {row.source}]\n{row.content}" for row in rows
        )
        return f"CONTEXTO RELEVANTE DA BASE DE CONHECIMENTO:\n\n{chunks}\n\n---"
    except Exception as e:
        logger.error(f"RAG retrieval failed: {e}")
        return ""


def _chunk_text(text: str, size: int = 800, overlap: int = 100) -> list[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunk = " ".join(words[i : i + size])
        chunks.append(chunk)
        i += size - overlap
    return chunks
