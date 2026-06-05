"""
Property scrapers for LeilãoAgent.
Uses Supabase REST API for database operations (no direct PG needed).
Uses Playwright for Caixa (they block server IPs with Radware).
"""
import asyncio
import csv
import json
import re
import os
from abc import ABC, abstractmethod

import httpx
from loguru import logger


ALL_UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
           "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"]


class BaseScraper(ABC):
    """Base scraper using Supabase REST API for persistence."""
    name: str = "base"

    def __init__(self, organization_id: str | None = None):
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "")
        self.organization_id = organization_id
        self._headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }

    async def run(self):
        logger.info(f"[{self.name}] Starting scraper...")
        if not self.supabase_url or not self.supabase_key:
            logger.error(f"[{self.name}] SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
            return
        try:
            properties = await self.fetch_properties()
            logger.info(f"[{self.name}] Fetched {len(properties)} properties")
            if properties:
                inserted = await self._bulk_upsert(properties)
                logger.info(f"[{self.name}] Upserted {inserted} properties")
        except Exception as e:
            logger.exception(f"[{self.name}] Scraper failed: {e}")

    @abstractmethod
    async def fetch_properties(self) -> list[dict]:
        ...

    async def _bulk_upsert(self, properties: list[dict]) -> int:
        """Insert/update properties via Supabase REST API in batches."""
        url = f"{self.supabase_url}/rest/v1/properties"
        count = 0
        batch_size = 50
        async with httpx.AsyncClient(timeout=30) as client:
            for i in range(0, len(properties), batch_size):
                batch = properties[i:i+batch_size]
                # Clean data
                clean = []
                for p in batch:
                    row = {k: v for k, v in p.items() if v is not None}
                    if not row.get("cidade") or not row.get("estado"):
                        continue
                    row.setdefault("status", "aberto")
                    row.setdefault("ocupacao", "nao_informado")
                    if self.organization_id:
                        row["organization_id"] = self.organization_id
                    clean.append(row)

                if not clean:
                    continue

                headers = {**self._headers, "Prefer": "resolution=merge-duplicates"}
                resp = await client.post(url, json=clean, headers=headers,
                                         params={"on_conflict": "external_id,fonte"})
                if resp.status_code in (200, 201):
                    count += len(clean)
                else:
                    # Try one by one on conflict
                    for row in clean:
                        r = await client.post(url, json=row, headers=self._headers)
                        if r.status_code in (200, 201):
                            count += 1
                        elif r.status_code == 409:
                            # Already exists, try update
                            eid = row.get("external_id")
                            if eid:
                                await client.patch(
                                    f"{url}?external_id=eq.{eid}&fonte=eq.{row.get('fonte',self.name)}",
                                    json={"lance_minimo": row.get("lance_minimo"),
                                          "desconto_pct": row.get("desconto_pct"),
                                          "status": row.get("status"),
                                          "updated_at": "now()"},
                                    headers=self._headers
                                )
                                count += 1
                        else:
                            logger.warning(f"[{self.name}] Insert failed: {r.status_code} {r.text[:100]}")
        return count


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
    Downloads CSV files from Caixa using Playwright (headless browser).
    Caixa blocks server IPs, so we need a real browser to pass their challenge.
    Falls back to httpx if Playwright is not available.
    """
    name = "caixa"
    CSV_URL = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_{uf}.csv"

    def __init__(self, estados: list[str] | None = None, organization_id: str | None = None,
                 database_url: str = ""):
        super().__init__(organization_id)
        self.estados = estados or ["SP", "RJ", "MG"]

    async def fetch_properties(self) -> list[dict]:
        all_props = []

        for uf in self.estados:
            try:
                # Try Playwright first
                props = await self._fetch_with_playwright(uf)
                if props:
                    all_props.extend(props)
                    logger.info(f"[caixa] {uf}: {len(props)} properties")
                else:
                    logger.warning(f"[caixa] No properties found for {uf}")
            except Exception as e:
                logger.error(f"[caixa] Failed {uf}: {e}")
            await asyncio.sleep(2)

        return all_props

    async def _fetch_with_playwright(self, uf: str) -> list[dict]:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.error("[caixa] Playwright not installed")
            return await self._fetch_with_httpx(uf)

        url = self.CSV_URL.format(uf=uf)
        logger.info(f"[caixa] Downloading {url} via Playwright...")

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage",
                      "--disable-blink-features=AutomationControlled"]
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="pt-BR",
                viewport={"width": 1920, "height": 1080},
            )
            page = await context.new_page()
            await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            try:
                # First visit the main page to get cookies
                await page.goto("https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp",
                              wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(3000)

                # Now try the CSV
                response = await page.goto(url, wait_until="load", timeout=30000)
                await page.wait_for_timeout(5000)

                if response and response.status == 200:
                    body_bytes = await response.body()
                    body = body_bytes.decode("utf-8", errors="ignore")
                    if "Lista de" in body[:300]:
                        return self._parse_csv(body, uf)

                # Try reading page text as fallback
                body = await page.evaluate("document.body.innerText")
                if body and "Lista de" in body[:300]:
                    return self._parse_csv(body, uf)

                content = await page.content()
                if "Forbidden" in content or "403" in content:
                    logger.warning(f"[caixa] IP blocked for {uf}")
                elif "Radware" in content:
                    logger.warning(f"[caixa] Bot challenge for {uf}")

                return []
            except Exception as e:
                logger.error(f"[caixa] Playwright error for {uf}: {e}")
                return []
            finally:
                await browser.close()

    async def _fetch_with_httpx(self, uf: str) -> list[dict]:
        """Fallback: simple HTTP (works when not blocked)."""
        url = self.CSV_URL.format(uf=uf)
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                resp = await client.get(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                if resp.status_code == 200 and "Lista de" in resp.text[:300]:
                    return self._parse_csv(resp.text, uf)
        except Exception as e:
            logger.warning(f"[caixa] httpx failed for {uf}: {e}")
        return []

    def _parse_csv(self, csv_text: str, uf: str) -> list[dict]:
        lines = csv_text.strip().split("\n")
        if len(lines) < 3:
            return []

        # Skip row 1 (metadata), use row 2+ as data
        reader = csv.reader(lines[2:], delimiter=";")
        props = []
        for row in reader:
            if len(row) < 6 or not row[2]:  # needs at least cidade
                continue
            preco = _parse_br_number(row[5] if len(row) > 5 else "")
            avaliacao = _parse_br_number(row[6] if len(row) > 6 else "")
            desconto = _parse_desconto(row[7] if len(row) > 7 else "")
            descricao = row[9] if len(row) > 9 else ""

            props.append({
                "external_id": row[0].strip(),
                "fonte": "caixa",
                "tipo_leilao": "extrajudicial",
                "banco": "Caixa Econômica Federal",
                "tipo_imovel": _parse_tipo(descricao),
                "endereco": (row[4] if len(row) > 4 else "").strip(),
                "bairro": (row[3] if len(row) > 3 else "").strip(),
                "cidade": row[2].strip(),
                "estado": (row[1] if len(row) > 1 else uf).strip(),
                "valor_avaliacao": avaliacao,
                "lance_minimo": preco,
                "desconto_pct": desconto,
                "status": "aberto",
                "ocupacao": "nao_informado",
                "aceita_financiamento": (row[8] if len(row) > 8 else "").strip().lower() == "sim",
                "url_original": (row[11] if len(row) > 11 else "").strip(),
                "praca": (row[10] if len(row) > 10 else "").strip(),
            })

        return props


class ZukScraper(BaseScraper):
    """Stub — Zuk requires custom implementation."""
    name = "zuk"

    async def fetch_properties(self) -> list[dict]:
        logger.info("[zuk] ZukScraper not yet implemented")
        return []


class JsonImporter(BaseScraper):
    """Import properties from a JSON file."""
    name = "import"

    def __init__(self, filepath: str, fonte: str = "import", organization_id: str | None = None,
                 database_url: str = ""):
        super().__init__(organization_id)
        self.filepath = filepath
        self.fonte_name = fonte

    async def fetch_properties(self) -> list[dict]:
        from pathlib import Path
        data = json.loads(Path(self.filepath).read_text(encoding="utf-8"))
        if not isinstance(data, list):
            data = [data]
        for item in data:
            item.setdefault("fonte", self.fonte_name)
        return data
