#!/usr/bin/env python3
"""
Caixa Econômica Federal property scraper.
Downloads CSV files via Playwright (bypasses Radware bot manager)
and upserts to Supabase via REST API.

Usage:
  python scrape_caixa.py --estados SP,RJ,MG --supabase-url URL --supabase-key KEY
"""
import argparse
import asyncio
import csv
import json
import re
import sys

import httpx


CSV_URL = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_{uf}.csv"
DOWNLOAD_PAGE = "https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp"


def parse_br_number(s: str) -> float | None:
    if not s or not s.strip():
        return None
    s = s.strip().replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def parse_tipo(desc: str) -> str:
    d = desc.lower()
    for kw, tp in [("apartamento", "apartamento"), ("apto", "apartamento"),
                   ("casa", "casa"), ("terreno", "terreno"), ("lote", "terreno"),
                   ("comercial", "comercial"), ("sala", "comercial"), ("loja", "comercial"),
                   ("galpão", "comercial"), ("galpao", "comercial"),
                   ("rural", "rural"), ("fazenda", "rural"), ("sítio", "rural")]:
        if kw in d:
            return tp
    return "outro"


def parse_csv(text: str, uf: str) -> list[dict]:
    lines = text.strip().split("\n")
    if len(lines) < 3:
        return []

    props = []
    for row in csv.reader(lines[2:], delimiter=";"):
        if len(row) < 6 or not row[2]:
            continue
        preco = parse_br_number(row[5] if len(row) > 5 else "")
        avaliacao = parse_br_number(row[6] if len(row) > 6 else "")
        desc_raw = row[7] if len(row) > 7 else ""
        desconto = None
        m = re.search(r"([\d.,]+)", desc_raw.replace("%", ""))
        if m:
            desconto = parse_br_number(m.group(1))

        descricao = row[9] if len(row) > 9 else ""

        props.append({
            "external_id": row[0].strip(),
            "fonte": "caixa",
            "tipo_leilao": "extrajudicial",
            "banco": "Caixa Econômica Federal",
            "tipo_imovel": parse_tipo(descricao),
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


async def download_csv(uf: str) -> str | None:
    """Try httpx first, then Playwright."""

    # Strategy 1: simple HTTP
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(CSV_URL.format(uf=uf), headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            if resp.status_code == 200 and "Lista de" in resp.text[:300]:
                print(f"  [{uf}] Downloaded via HTTP ({len(resp.text)} bytes)")
                return resp.text
    except Exception as e:
        print(f"  [{uf}] HTTP failed: {e}")

    # Strategy 2: Playwright
    print(f"  [{uf}] Trying Playwright...")
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage",
                      "--disable-blink-features=AutomationControlled"]
            )
            ctx = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                locale="pt-BR",
                viewport={"width": 1920, "height": 1080},
            )
            page = await ctx.new_page()
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3]});
                window.chrome = {runtime: {}};
            """)

            # Visit download page first to get session cookies
            try:
                await page.goto(DOWNLOAD_PAGE, wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(3000)
            except:
                pass

            # Now fetch the CSV
            url = CSV_URL.format(uf=uf)
            response = await page.goto(url, wait_until="load", timeout=30000)
            await page.wait_for_timeout(5000)

            # Check for challenge page
            content = await page.content()
            if "Radware" in content or "validate.perfdrive" in content:
                print(f"  [{uf}] Bot challenge detected, waiting 15s...")
                await page.wait_for_timeout(15000)
                # After challenge, the page should redirect
                content = await page.content()

            # Try to get body text
            body = await page.evaluate("document.body.innerText || ''")
            await browser.close()

            if body and "Lista de" in body[:300]:
                print(f"  [{uf}] Downloaded via Playwright ({len(body)} bytes)")
                return body

            if "Forbidden" in content or "403" in content:
                print(f"  [{uf}] BLOCKED (403 Forbidden)")
            elif "Radware" in content:
                print(f"  [{uf}] BLOCKED (Radware challenge)")
            else:
                print(f"  [{uf}] Unknown response ({len(body)} bytes)")
            return None

    except Exception as e:
        print(f"  [{uf}] Playwright failed: {e}")
        return None


def _sql_val(v) -> str:
    """Escape a value for SQL."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"


async def upsert_to_supabase(props: list[dict], supabase_url: str, supabase_key: str) -> int:
    """Insert properties to Supabase via pg/query (SQL direct) in batches."""
    pg_url = f"{supabase_url}/pg/query"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }
    cols = ["external_id","fonte","organization_id","tipo_leilao","banco","tipo_imovel","endereco",
            "bairro","cidade","estado","valor_avaliacao","lance_minimo","desconto_pct",
            "status","ocupacao","aceita_financiamento","url_original","praca"]

    # Clean data
    clean = []
    for p in props:
        row = {k: v for k, v in p.items() if v is not None and k in cols}
        if not row.get("cidade") or not row.get("estado"):
            continue
        row.setdefault("status", "aberto")
        row.setdefault("ocupacao", "nao_informado")
        row.setdefault("fonte", "caixa")
        clean.append(row)

    if not clean:
        return 0

    count = 0
    batch_size = 100
    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=60.0)) as client:
        for i in range(0, len(clean), batch_size):
            batch = clean[i:i+batch_size]
            # Build VALUES clause
            values_rows = []
            for row in batch:
                vals = [_sql_val(row.get(c)) for c in cols]
                values_rows.append(f"({', '.join(vals)})")

            sql = f"""INSERT INTO properties ({', '.join(cols)})
VALUES {', '.join(values_rows)}
ON CONFLICT (external_id, fonte) DO UPDATE SET
  lance_minimo = EXCLUDED.lance_minimo,
  desconto_pct = EXCLUDED.desconto_pct,
  aceita_financiamento = EXCLUDED.aceita_financiamento,
  status = EXCLUDED.status,
  updated_at = now();"""

            for attempt in range(3):
                try:
                    resp = await client.post(pg_url, json={"query": sql}, headers=headers)
                    body = resp.text
                    if resp.status_code == 200 and "error" not in body.lower():
                        count += len(batch)
                        break
                    else:
                        err = body[:200]
                        if attempt == 0:
                            print(f"  SQL error: {err}")
                        # If unique constraint missing, try without ON CONFLICT
                        if "constraint" in body.lower() and attempt == 1:
                            sql_simple = f"INSERT INTO properties ({', '.join(cols)}) VALUES {', '.join(values_rows)} ON CONFLICT DO NOTHING;"
                            resp2 = await client.post(pg_url, json={"query": sql_simple}, headers=headers)
                            if resp2.status_code == 200:
                                count += len(batch)
                                break
                        await asyncio.sleep(2)
                except httpx.TimeoutException:
                    print(f"  Timeout on batch {i//batch_size + 1}, retry {attempt + 1}")
                    await asyncio.sleep(5)
                except Exception as e:
                    print(f"  Error: {e}")
                    break

            if (i // batch_size) % 3 == 0:
                print(f"  Progress: {count}/{len(clean)}")

    return count


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--estados", default="SP,RJ,MG")
    parser.add_argument("--supabase-url", required=True)
    parser.add_argument("--supabase-key", required=True)
    parser.add_argument("--organization-id", default="", help="Assign properties to this org")
    args = parser.parse_args()

    estados = [s.strip() for s in args.estados.split(",") if s.strip()]
    print(f"═══ CAIXA SCRAPER ═══")
    print(f"Estados: {', '.join(estados)}")
    print()

    total = 0
    for uf in estados:
        print(f"[{uf}] Downloading CSV...")
        csv_text = await download_csv(uf)
        if not csv_text:
            print(f"[{uf}] SKIP — could not download")
            continue

        props = parse_csv(csv_text, uf)
        print(f"[{uf}] Parsed {len(props)} properties")

        if props:
            # Assign org if provided
            if args.organization_id:
                for p in props:
                    p["organization_id"] = args.organization_id
            count = await upsert_to_supabase(props, args.supabase_url, args.supabase_key)
            print(f"[{uf}] Upserted {count} properties to Supabase")
            total += count

        await asyncio.sleep(2)

    print()
    print(f"═══ TOTAL: {total} properties ═══")


if __name__ == "__main__":
    asyncio.run(main())
