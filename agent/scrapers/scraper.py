"""
Property scrapers for LeilãoAgent.

CaixaScraper: downloads CSV files from Caixa's website using Playwright
(required because Caixa uses Radware Bot Manager that blocks simple HTTP).

The CSV URL pattern is:
    https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_{UF}.csv

CSV format: semicolon-delimited, UTF-8, row 1 = metadata, row 2 = headers.
Columns: Nº do imóvel;UF;Cidade;Bairro;Endereço;Preço;Valor de avaliação;
         Desconto;Financiamento;Descrição;Modalidade de venda;Link de acesso
"""
import asyncio
import csv
import io
import json
import re
from abc import ABC, abstractmethod
from pathlib import Path

from loguru import logger
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


ALL_UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
           "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"]


class BaseScraper(ABC):
    name: str = "base"

    def __init__(self, database_url: str):
        self.engine = create_async_engine(database_url)
        self.Session = async_sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)

    async def run(self):
        logger.info(f"[{self.name}] Starting scraper...")
        try:
            properties = await self.fetch_properties()
            logger.info(f"[{self.name}] Fetched {len(properties)} properties")
            if properties:
                async with self.Session() as db:
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
        external_id = data.get("external_id")
        fonte = data.get("fonte", self.name)
        org_id = data.get("organization_id")

        if external_id:
            result = await db.execute(
                text("SELECT id FROM properties WHERE external_id = :eid AND fonte = :fonte LIMIT 1"),
                {"eid": external_id, "fonte": fonte}
            )
            existing = result.scalar_one_or_none()
            if existing:
                # Update mutable fields
                await db.execute(
                    text("""UPDATE properties SET
                        lance_minimo = COALESCE(:lance, lance_minimo),
                        desconto_pct = COALESCE(:desconto, desconto_pct),
                        status = COALESCE(:status, status),
                        aceita_financiamento = COALESCE(:financ, aceita_financiamento),
                        updated_at = now()
                    WHERE id = :id"""),
                    {"lance": data.get("lance_minimo"), "desconto": data.get("desconto_pct"),
                     "status": data.get("status"), "financ": data.get("aceita_financiamento"),
                     "id": existing}
                )
                return False

        # Insert new
        cols = ["external_id","fonte","organization_id","tipo_leilao","banco","leiloeiro",
                "tipo_imovel","endereco","bairro","cidade","estado","valor_avaliacao",
                "lance_minimo","desconto_pct","status","ocupacao","aceita_financiamento",
                "url_original","praca"]
        vals = {k: data.get(k) for k in cols}
        vals = {k: v for k, v in vals.items() if v is not None}
        if not vals.get("cidade"):
            return False
        col_str = ", ".join(vals.keys())
        param_str = ", ".join(f":{k}" for k in vals.keys())
        await db.execute(text(f"INSERT INTO properties ({col_str}) VALUES ({param_str})"), vals)
        return True


def _parse_br_number(s: str) -> float | None:
    if not s or not s.strip():
        return None
    s = s.strip().replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _parse_desconto(s: str) -> float | None:
    if not s:
        return None
    m = re.search(r"([\d.,]+)", s.replace("%", ""))
    if m:
        return _parse_br_number(m.group(1))
    return None


def _parse_tipo(descricao: str) -> str:
    d = descricao.lower()
    if "apartamento" in d or "apto" in d:
        return "apartamento"
    if "casa" in d:
        return "casa"
    if "terreno" in d or "lote" in d:
        return "terreno"
    if "comercial" in d or "sala" in d or "loja" in d or "galpão" in d or "galpao" in d:
        return "comercial"
    if "rural" in d or "fazenda" in d or "sítio" in d or "sitio" in d:
        return "rural"
    return "outro"


class CaixaScraper(BaseScraper):
    """
    Downloads CSV files from Caixa's website using Playwright.
    Caixa protects everything with Radware Bot Manager — needs a real browser.
    """
    name = "caixa"
    CSV_URL = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_{uf}.csv"

    def __init__(self, database_url: str, estados: list[str] | None = None, organization_id: str | None = None):
        super().__init__(database_url)
        self.estados = estados or ["SP", "RJ", "MG"]
        self.organization_id = organization_id

    async def fetch_properties(self) -> list[dict]:
        all_props = []
        import httpx

        # Strategy 1: Try simple HTTP first (works when server is in Brazil / not blocked)
        async with httpx.AsyncClient(timeout=30, follow_redirects=False) as client:
            for uf in self.estados:
                try:
                    url = self.CSV_URL.format(uf=uf)
                    logger.info(f"[caixa] Trying HTTP download for {uf}...")
                    resp = await client.get(url)
                    if resp.status_code == 200 and "Lista de" in resp.text[:200]:
                        props = self._parse_csv(resp.text, uf)
                        all_props.extend(props)
                        logger.info(f"[caixa] {uf}: {len(props)} properties (via HTTP)")
                        await asyncio.sleep(1)
                        continue
                    logger.info(f"[caixa] HTTP blocked for {uf} (status={resp.status_code}), trying Playwright...")
                except Exception as e:
                    logger.warning(f"[caixa] HTTP failed for {uf}: {e}")

                # Strategy 2: Playwright
                try:
                    props = await self._fetch_with_playwright(uf)
                    all_props.extend(props)
                    logger.info(f"[caixa] {uf}: {len(props)} properties (via Playwright)")
                except Exception as e:
                    logger.error(f"[caixa] Playwright also failed for {uf}: {e}")
                await asyncio.sleep(2)

        return all_props

    async def _fetch_with_playwright(self, uf: str) -> list[dict]:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.error("[caixa] Playwright not installed")
            return []

        url = self.CSV_URL.format(uf=uf)
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-blink-features=AutomationControlled"])
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="pt-BR",
            )
            page = await context.new_page()
            # Remove webdriver flag
            await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            try:
                await page.goto(url, wait_until="networkidle", timeout=60000)
                await page.wait_for_timeout(5000)
                content = await page.content()
                if "Radware" in content or "CAPTCHA" in content:
                    await page.wait_for_timeout(15000)
                    content = await page.content()

                body = await page.evaluate("document.body.innerText")
                if body and "Lista de" in body[:200]:
                    return self._parse_csv(body, uf)

                logger.warning(f"[caixa] Playwright could not get CSV for {uf}")
                return []
            finally:
                await browser.close()

    async def _fetch_csv(self, page, uf: str) -> list[dict]:
        url = self.CSV_URL.format(uf=uf)
        logger.info(f"[caixa] Downloading {url}")

        # Navigate and wait for any bot challenge to resolve
        resp = await page.goto(url, wait_until="networkidle", timeout=60000)

        # Wait a bit for any JS challenge to complete
        await page.wait_for_timeout(3000)

        # Check if we got a CAPTCHA page
        content = await page.content()
        if "Radware" in content or "CAPTCHA" in content:
            logger.warning(f"[caixa] Bot challenge detected for {uf}, waiting longer...")
            await page.wait_for_timeout(10000)
            content = await page.content()
            if "Radware" in content:
                logger.error(f"[caixa] Could not bypass bot manager for {uf}")
                return []

        # Try to get the CSV content
        # After challenge resolution, the page should have the CSV text
        body = await page.evaluate("document.body.innerText")
        if not body or len(body) < 100:
            # Try downloading via a direct request in the browser context
            try:
                response = await page.goto(url, wait_until="load", timeout=30000)
                if response:
                    body_bytes = await response.body()
                    body = body_bytes.decode("utf-8", errors="ignore")
            except:
                pass

        if not body or "Lista de Imóveis" not in body[:200]:
            logger.warning(f"[caixa] No valid CSV content for {uf} (got {len(body or '')} chars)")
            return []

        return self._parse_csv(body, uf)

    def _parse_csv(self, csv_text: str, uf: str) -> list[dict]:
        lines = csv_text.strip().split("\n")
        if len(lines) < 3:
            return []

        # Skip row 1 (metadata), row 2 is headers
        reader = csv.DictReader(lines[2:], fieldnames=[
            "numero","uf","cidade","bairro","endereco","preco",
            "valor_avaliacao","desconto","financiamento","descricao",
            "modalidade","link"
        ], delimiter=";")

        props = []
        for row in reader:
            if not row.get("cidade"):
                continue
            preco = _parse_br_number(row.get("preco", ""))
            avaliacao = _parse_br_number(row.get("valor_avaliacao", ""))
            desconto = _parse_desconto(row.get("desconto", ""))

            props.append({
                "external_id": (row.get("numero") or "").strip(),
                "fonte": "caixa",
                "organization_id": self.organization_id,
                "tipo_leilao": "extrajudicial",
                "banco": "Caixa Econômica Federal",
                "tipo_imovel": _parse_tipo(row.get("descricao", "")),
                "endereco": (row.get("endereco") or "").strip(),
                "bairro": (row.get("bairro") or "").strip(),
                "cidade": (row.get("cidade") or "").strip(),
                "estado": (row.get("uf") or uf).strip(),
                "valor_avaliacao": avaliacao,
                "lance_minimo": preco,
                "desconto_pct": desconto,
                "status": "aberto",
                "ocupacao": "nao_informado",
                "aceita_financiamento": (row.get("financiamento") or "").strip().lower() == "sim",
                "url_original": (row.get("link") or "").strip(),
                "praca": (row.get("modalidade") or "").strip(),
            })

        return props


class ZukScraper(BaseScraper):
    """Stub — Zuk requires Playwright and custom parsing."""
    name = "zuk"

    async def fetch_properties(self) -> list[dict]:
        logger.info("[zuk] ZukScraper not yet implemented")
        return []


class JsonImporter(BaseScraper):
    """Import properties from a JSON file."""
    name = "import"

    def __init__(self, database_url: str, filepath: str, fonte: str = "import", organization_id: str | None = None):
        super().__init__(database_url)
        self.filepath = filepath
        self.fonte_name = fonte
        self.organization_id = organization_id

    async def fetch_properties(self) -> list[dict]:
        data = json.loads(Path(self.filepath).read_text(encoding="utf-8"))
        if not isinstance(data, list):
            data = [data]
        for item in data:
            item.setdefault("fonte", self.fonte_name)
            if self.organization_id:
                item["organization_id"] = self.organization_id
        return data
