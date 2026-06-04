"""
Property scrapers + JSON import endpoint.

Strategy:
1. CaixaScraper — attempts Caixa's internal API (breaks when they change it)
2. JSON import — universal: feed data from Apify, n8n, or manual export
3. ZukScraper — stub for future implementation
"""
import asyncio
import json
import re
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path

import httpx
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ─── BASE SCRAPER ─────────────────────────────────────────────────────────────

class BaseScraper(ABC):
    name: str = "base"

    def __init__(self, database_url: str):
        self.engine = create_async_engine(database_url)
        self.SessionLocal = async_sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)

    async def run(self):
        logger.info(f"[{self.name}] Starting scraper...")
        try:
            properties = await self.fetch_properties()
            logger.info(f"[{self.name}] Fetched {len(properties)} properties")
            async with self.SessionLocal() as db:
                inserted, updated = 0, 0
                for prop in properties:
                    is_new = await self._upsert(db, prop)
                    if is_new:
                        inserted += 1
                    else:
                        updated += 1
                await db.commit()
                logger.info(f"[{self.name}] Inserted {inserted}, updated {updated}")
        except Exception as e:
            logger.exception(f"[{self.name}] Scraper failed: {e}")
        finally:
            await self.engine.dispose()

    @abstractmethod
    async def fetch_properties(self) -> list[dict]:
        ...

    async def _upsert(self, db: AsyncSession, data: dict) -> bool:
        from app.models.properties import Property
        external_id = data.get("external_id")
        fonte = data.get("fonte", self.name)

        existing = None
        if external_id:
            result = await db.execute(
                select(Property).where(
                    Property.external_id == external_id, Property.fonte == fonte
                )
            )
            existing = result.scalar_one_or_none()

        if existing:
            for key in ["lance_minimo", "desconto_pct", "status", "praca",
                        "data_leilao", "ocupacao", "aceita_financiamento"]:
                if key in data and data[key] is not None:
                    setattr(existing, key, data[key])
            return False

        prop = Property(**{k: v for k, v in data.items() if v is not None})
        db.add(prop)
        return True


# ─── CAIXA SCRAPER ────────────────────────────────────────────────────────────

class CaixaScraper(BaseScraper):
    """
    Scraper for Caixa Econômica Federal.
    Uses the internal API that venda-imoveis.caixa.gov.br calls.
    NOTE: This endpoint changes periodically. If it breaks, use the
    JSON import method with Apify data instead.
    """
    name = "caixa"
    # Caixa's internal search API (discovered via browser devtools)
    API_URL = "https://venda-imoveis.caixa.gov.br/sistema/carregaPesquisaImoveis.asp"

    def __init__(self, database_url: str, estados: list[str] | None = None):
        super().__init__(database_url)
        self.estados = estados or ["SP", "RJ", "MG"]

    async def fetch_properties(self) -> list[dict]:
        all_props = []
        async with httpx.AsyncClient(
            timeout=30, follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; LeilaoAgent/1.0)"}
        ) as client:
            for estado in self.estados:
                try:
                    props = await self._fetch_estado(client, estado)
                    all_props.extend(props)
                    logger.info(f"[caixa] {estado}: {len(props)} properties")
                    await asyncio.sleep(2)
                except Exception as e:
                    logger.error(f"[caixa] Failed {estado}: {e}")
        return all_props

    async def _fetch_estado(self, client: httpx.AsyncClient, estado: str) -> list[dict]:
        """
        Attempt to fetch from Caixa's internal API.
        This may break when Caixa updates their site.
        """
        try:
            resp = await client.get(
                self.API_URL,
                params={"uf": estado, "cidade": "", "bairro": "", "faixaPreco": ""},
            )
            if resp.status_code != 200:
                logger.warning(f"[caixa] HTTP {resp.status_code} for {estado}")
                return []

            # Try to parse as JSON
            try:
                data = resp.json()
                if isinstance(data, list):
                    return [self._normalize(item, estado) for item in data]
            except json.JSONDecodeError:
                pass

            # If not JSON, it's HTML — parse it
            return self._parse_html(resp.text, estado)

        except Exception as e:
            logger.error(f"[caixa] Request failed for {estado}: {e}")
            return []

    def _normalize(self, item: dict, estado: str) -> dict:
        """Normalize a single item from Caixa's API response."""
        valor_avaliacao = _safe_float(item.get("valorAvaliacao") or item.get("evaluationValue", 0))
        lance_minimo = _safe_float(item.get("valorVenda") or item.get("minimumSaleValue", 0))
        desconto = round((1 - lance_minimo / valor_avaliacao) * 100, 1) if valor_avaliacao and valor_avaliacao > 0 else 0

        return {
            "external_id": str(item.get("numeroImovel") or item.get("propertyNumber", "")),
            "fonte": "caixa",
            "url_original": item.get("linkImovel") or item.get("url", ""),
            "tipo_leilao": "extrajudicial",
            "banco": "Caixa Econômica Federal",
            "leiloeiro": item.get("edital") or item.get("notice", ""),
            "tipo_imovel": _map_tipo(item.get("tipoImovel") or item.get("type", "")),
            "endereco": item.get("endereco") or item.get("address", ""),
            "bairro": item.get("bairro") or item.get("district", ""),
            "cidade": item.get("cidade") or item.get("city", ""),
            "estado": item.get("uf") or item.get("state", estado),
            "cep": item.get("cep") or item.get("zipCode", ""),
            "area_privativa": _safe_float(item.get("areaPrivativa") or item.get("privateArea")),
            "area_terreno": _safe_float(item.get("areaTerreno") or item.get("landArea")),
            "quartos": _safe_int(item.get("quartos") or item.get("bedrooms")),
            "vagas": _safe_int(item.get("garagem") or item.get("parkingSpaces")),
            "valor_avaliacao": valor_avaliacao,
            "lance_minimo": lance_minimo,
            "desconto_pct": desconto,
            "praca": item.get("modalidade") or item.get("modality", ""),
            "data_leilao": _parse_date(item.get("dataLeilao") or item.get("auctionDate")),
            "status": "aberto",
            "ocupacao": "nao_informado",
            "aceita_financiamento": item.get("aceitaFinanciamento") or item.get("acceptsFinancing", False),
            "aceita_fgts": item.get("aceitaFGTS") or item.get("acceptsFGTS", False),
            "edital_url": item.get("linkEdital") or item.get("noticeUrl", ""),
        }

    def _parse_html(self, html: str, estado: str) -> list[dict]:
        """Fallback HTML parser for Caixa's server-rendered pages."""
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, "lxml")
            # This is a simplified parser — adjust selectors based on actual HTML
            items = soup.select(".dadosImovel, .imovel-item, .resultado-item")
            logger.info(f"[caixa] HTML parse found {len(items)} elements for {estado}")
            # HTML parsing is highly specific to Caixa's current layout
            # which changes frequently. Return empty and log for manual inspection.
            if not items:
                logger.warning(f"[caixa] No items found in HTML for {estado}. "
                             f"Selectors may need updating. HTML length: {len(html)}")
            return []
        except ImportError:
            logger.error("[caixa] beautifulsoup4 not installed")
            return []


# ─── JSON IMPORT ──────────────────────────────────────────────────────────────

class JsonImporter(BaseScraper):
    """
    Import properties from a JSON file.
    Use this with exports from Apify, n8n workflows, or manual data.

    Expected format: list of dicts with at least:
        external_id, cidade, estado, lance_minimo

    Usage:
        python -c "
        import asyncio
        from scrapers.scraper import JsonImporter
        importer = JsonImporter('postgresql+asyncpg://...', 'data/caixa_export.json', 'caixa')
        asyncio.run(importer.run())
        "
    """
    name = "json_import"

    def __init__(self, database_url: str, filepath: str, fonte: str = "import"):
        super().__init__(database_url)
        self.filepath = filepath
        self.fonte_name = fonte

    async def fetch_properties(self) -> list[dict]:
        path = Path(self.filepath)
        if not path.exists():
            logger.error(f"File not found: {self.filepath}")
            return []

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            data = [data]

        logger.info(f"[json_import] Loaded {len(data)} items from {self.filepath}")

        # Auto-detect format and normalize
        normalized = []
        for item in data:
            prop = {
                "external_id": str(item.get("external_id") or item.get("id") or item.get("propertyNumber", "")),
                "fonte": self.fonte_name,
                "url_original": item.get("url_original") or item.get("url", ""),
                "tipo_leilao": item.get("tipo_leilao") or item.get("auction_type", "extrajudicial"),
                "banco": item.get("banco") or item.get("bank", ""),
                "leiloeiro": item.get("leiloeiro") or item.get("auctioneer", ""),
                "tipo_imovel": _map_tipo(item.get("tipo_imovel") or item.get("type", "")),
                "endereco": item.get("endereco") or item.get("address", ""),
                "bairro": item.get("bairro") or item.get("district", ""),
                "cidade": item.get("cidade") or item.get("city", ""),
                "estado": (item.get("estado") or item.get("state", "")).upper(),
                "cep": item.get("cep") or item.get("zipCode", ""),
                "area_privativa": _safe_float(item.get("area_privativa") or item.get("privateArea")),
                "area_terreno": _safe_float(item.get("area_terreno") or item.get("landArea")),
                "quartos": _safe_int(item.get("quartos") or item.get("bedrooms")),
                "vagas": _safe_int(item.get("vagas") or item.get("parkingSpaces")),
                "valor_avaliacao": _safe_float(item.get("valor_avaliacao") or item.get("evaluationValue")),
                "lance_minimo": _safe_float(item.get("lance_minimo") or item.get("minimumSaleValue")),
                "status": "aberto",
            }
            # Calc discount
            if prop["valor_avaliacao"] and prop["lance_minimo"] and prop["valor_avaliacao"] > 0:
                prop["desconto_pct"] = round((1 - prop["lance_minimo"] / prop["valor_avaliacao"]) * 100, 1)
            normalized.append(prop)

        return normalized


# ─── ZUK SCRAPER (stub) ──────────────────────────────────────────────────────

class ZukScraper(BaseScraper):
    name = "zuk"

    async def fetch_properties(self) -> list[dict]:
        logger.info("[zuk] Stub — implement with Playwright or use JsonImporter with Apify export")
        return []


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _map_tipo(raw: str) -> str:
    raw = raw.lower().strip()
    if "apart" in raw: return "apartamento"
    if "casa" in raw: return "casa"
    if "terren" in raw: return "terreno"
    if "comerc" in raw or "sala" in raw or "loja" in raw: return "comercial"
    if "rural" in raw or "fazend" in raw or "sítio" in raw or "chácar" in raw: return "rural"
    return "outro"

def _safe_float(val) -> float | None:
    if val is None: return None
    try: return float(str(val).replace(",", ".").replace("R$", "").replace(" ", "").strip())
    except (ValueError, TypeError): return None

def _safe_int(val) -> int | None:
    if val is None: return None
    try: return int(val)
    except (ValueError, TypeError): return None

def _parse_date(val) -> datetime | None:
    if not val: return None
    if isinstance(val, datetime): return val
    for fmt in ["%Y-%m-%dT%H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%d"]:
        try: return datetime.strptime(str(val).strip(), fmt)
        except ValueError: continue
    return None
