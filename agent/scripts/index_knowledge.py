"""
Index documents into the RAG knowledge base.
Usage:
    python scripts/index_knowledge.py docs/catalogo.pdf
    python scripts/index_knowledge.py docs/    # indexes all files in folder
"""
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.models.conversation import Base
from app.services.rag_service import index_document


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/leilao_agent",
)


def extract_text(filepath: str) -> str:
    """Extract text from various file formats."""
    path = Path(filepath)
    ext = path.suffix.lower()

    if ext == ".txt" or ext == ".md":
        return path.read_text(encoding="utf-8")

    elif ext == ".pdf":
        import pymupdf
        doc = pymupdf.open(filepath)
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text

    elif ext == ".docx":
        from docx import Document
        doc = Document(filepath)
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    elif ext == ".csv":
        return path.read_text(encoding="utf-8")

    else:
        logger.warning(f"Unsupported format: {ext}, trying as text")
        return path.read_text(encoding="utf-8", errors="ignore")


async def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/index_knowledge.py <file_or_folder>")
        sys.exit(1)

    target = Path(sys.argv[1])
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Ensure pgvector extension + embedding column
    async with engine.begin() as conn:
        await conn.execute(
            __import__("sqlalchemy").text("CREATE EXTENSION IF NOT EXISTS vector")
        )
        try:
            await conn.execute(
                __import__("sqlalchemy").text(
                    "ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536)"
                )
            )
        except Exception:
            pass

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    files = []
    if target.is_dir():
        for ext in ["*.txt", "*.md", "*.pdf", "*.docx", "*.csv"]:
            files.extend(target.glob(ext))
    elif target.is_file():
        files = [target]
    else:
        print(f"Not found: {target}")
        sys.exit(1)

    logger.info(f"Found {len(files)} files to index")

    async with Session() as db:
        for filepath in files:
            try:
                text = extract_text(str(filepath))
                if not text.strip():
                    logger.warning(f"Empty file: {filepath}")
                    continue
                await index_document(db, str(filepath.name), text)
                logger.info(f"✅ Indexed: {filepath.name} ({len(text)} chars)")
            except Exception as e:
                logger.error(f"❌ Failed: {filepath.name} — {e}")

    await engine.dispose()
    logger.info("Done!")


if __name__ == "__main__":
    asyncio.run(main())
