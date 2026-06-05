"""
Manual scraper trigger endpoint.
POST /scraper/run — runs the Caixa scraper on demand.
"""
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from loguru import logger
from app.core.config import get_settings

router = APIRouter(prefix="/scraper", tags=["scraper"])
settings = get_settings()

_running = False


class ScrapeRequest(BaseModel):
    estados: list[str] = ["SP", "RJ", "MG", "PR", "RS", "BA"]
    fonte: str = "caixa"


class ScrapeResult(BaseModel):
    status: str
    message: str


async def _run_scrape(estados: list[str]):
    global _running
    _running = True
    try:
        from scrapers.scraper import CaixaScraper
        db_url = settings.database_url
        if not db_url:
            logger.error("[SCRAPER] DATABASE_URL not configured")
            return
        scraper = CaixaScraper(db_url, estados=estados)
        await scraper.run()
    except Exception as e:
        logger.exception(f"[SCRAPER] Error: {e}")
    finally:
        _running = False


@router.post("/run", response_model=ScrapeResult)
async def run_scraper(req: ScrapeRequest, bg: BackgroundTasks):
    if _running:
        return ScrapeResult(status="busy", message="Scraper já está rodando. Aguarde.")
    bg.add_task(_run_scrape, req.estados)
    return ScrapeResult(
        status="started",
        message=f"Scraper iniciado para {', '.join(req.estados)}. Os imóveis aparecerão na base em alguns minutos.",
    )


@router.get("/status", response_model=ScrapeResult)
async def scraper_status():
    if _running:
        return ScrapeResult(status="running", message="Scraper em execução...")
    return ScrapeResult(status="idle", message="Scraper parado.")
