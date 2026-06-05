"""
LeilãoAgent — FastAPI app.
Handles WhatsApp webhooks and runs scraper worker.
All CRM UI is in the web/ (Next.js) app.
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from loguru import logger

from app.core.config import get_settings
from app.api import webhooks, health
try:
    from app.api import scraper as scraper_router_mod
except Exception as e:
    scraper_router_mod = None
    from loguru import logger as _lg
    _lg.warning(f"Scraper router import failed: {e}")
from app.services import buffer_service

settings = get_settings()

_scraper_task = None

async def _scraper_loop():
    interval = settings.scraper_interval_hours * 3600
    await asyncio.sleep(60)
    while True:
        logger.info("[SCRAPER] Starting scheduled scrape...")
        try:
            from scrapers.scraper import CaixaScraper, ZukScraper
            if settings.scraper_caixa_enabled and settings.database_url:
                caixa = CaixaScraper(
                    database_url=settings.database_url,
                    estados=["SP", "RJ", "MG", "PR", "RS", "BA", "PE", "CE", "DF", "GO"],
                )
                await caixa.run()
        except Exception as e:
            logger.error(f"[SCRAPER] Error: {e}")
        await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _scraper_task
    logger.info(f"Starting {settings.agent_name}...")

    if settings.scraper_caixa_enabled or settings.scraper_zuk_enabled:
        _scraper_task = asyncio.create_task(_scraper_loop())

    yield

    if _scraper_task:
        _scraper_task.cancel()
        try: await _scraper_task
        except asyncio.CancelledError: pass
    await buffer_service.close()
    logger.info("Shut down.")


app = FastAPI(
    title=settings.agent_name,
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

app.include_router(health.router, tags=["health"])
app.include_router(webhooks.router, tags=["webhook"])
if scraper_router_mod:
    app.include_router(scraper_router_mod.router)
