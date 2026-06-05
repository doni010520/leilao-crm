"""
Manual scraper trigger endpoint.
POST /scraper/run — runs the Caixa scraper on demand.
GET /scraper/test — tests CSV download and returns debug info.
"""
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from loguru import logger
from app.core.config import get_settings
import httpx

router = APIRouter(prefix="/scraper", tags=["scraper"])
settings = get_settings()

_running = False
_last_log: list[str] = []


class ScrapeRequest(BaseModel):
    estados: list[str] = ["SP", "RJ", "MG", "PR", "RS", "BA"]
    fonte: str = "caixa"


class ScrapeResult(BaseModel):
    status: str
    message: str
    log: list[str] = []


async def _run_scrape(estados: list[str]):
    global _running, _last_log
    _running = True
    _last_log = []
    try:
        from scrapers.scraper import CaixaScraper
        db_url = settings.database_url
        if not db_url:
            _last_log.append("ERROR: DATABASE_URL not configured")
            logger.error("[SCRAPER] DATABASE_URL not configured")
            return
        _last_log.append(f"Starting scraper for {estados}")
        scraper = CaixaScraper(db_url, estados=estados)
        await scraper.run()
        _last_log.append("Scraper finished")
    except Exception as e:
        _last_log.append(f"ERROR: {e}")
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
        return ScrapeResult(status="running", message="Scraper em execução...", log=_last_log)
    return ScrapeResult(status="idle", message="Scraper parado.", log=_last_log)


@router.get("/test")
async def test_download():
    """Test CSV download from Caixa and return debug info."""
    url = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_MG.csv"
    results = {}

    # Test 1: Simple httpx
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=False) as client:
            resp = await client.get(url)
            body = resp.text[:500]
            results["httpx_no_redirect"] = {
                "status": resp.status_code,
                "size": len(resp.text),
                "is_csv": "Lista de" in resp.text[:200],
                "is_captcha": "Radware" in body or "CAPTCHA" in body,
                "preview": body[:200],
            }
    except Exception as e:
        results["httpx_no_redirect"] = {"error": str(e)}

    # Test 2: httpx with redirects + browser UA
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True,
                                      headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}) as client:
            resp = await client.get(url)
            body = resp.text[:500]
            results["httpx_with_redirect"] = {
                "status": resp.status_code,
                "size": len(resp.text),
                "is_csv": "Lista de" in resp.text[:200],
                "is_captcha": "Radware" in body or "CAPTCHA" in body,
                "preview": body[:200],
            }
    except Exception as e:
        results["httpx_with_redirect"] = {"error": str(e)}

    # Test 3: Playwright
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
            page = await browser.new_page()
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(3000)
            content = await page.content()
            body_text = await page.evaluate("document.body.innerText")
            await browser.close()
            results["playwright"] = {
                "size": len(body_text or ""),
                "is_csv": "Lista de" in (body_text or "")[:200],
                "is_captcha": "Radware" in content or "CAPTCHA" in content,
                "preview": (body_text or "")[:200],
            }
    except Exception as e:
        results["playwright"] = {"error": str(e)}

    # Test 4: DB connection
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text as sql_text
        engine = create_async_engine(settings.database_url)
        async with engine.connect() as conn:
            r = await conn.execute(sql_text("SELECT count(*) FROM properties"))
            count = r.scalar()
            results["database"] = {"connected": True, "properties_count": count, "url": settings.database_url[:50]+"..."}
        await engine.dispose()
    except Exception as e:
        results["database"] = {"error": str(e), "url": (settings.database_url or "NOT SET")[:50]}

    return results
