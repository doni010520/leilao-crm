"""
Run all scrapers. Execute via:
    python -m scrapers.run_all
    python -m scrapers.run_all --import data/caixa.json --fonte caixa

Schedule: cron, GitHub Actions, Railway worker, or n8n.
"""
import asyncio
import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger


async def main():
    parser = argparse.ArgumentParser(description="LeilãoAgent Scraper Runner")
    parser.add_argument("--import-file", help="Import JSON file instead of scraping")
    parser.add_argument("--fonte", default="import", help="Source name for imported data")
    parser.add_argument("--estados", default="SP,RJ,MG,PR,RS,BA,PE,CE,DF,GO",
                       help="Comma-separated state codes for Caixa scraper")
    args = parser.parse_args()

    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/leilao_agent",
    )

    logger.info("═" * 60)
    logger.info("LEILÃO AGENT — SCRAPER RUNNER")
    logger.info("═" * 60)

    if args.import_file:
        from scrapers.scraper import JsonImporter
        importer = JsonImporter(database_url, args.import_file, args.fonte)
        await importer.run()
    else:
        from scrapers.scraper import CaixaScraper, ZukScraper

        caixa = CaixaScraper(database_url, estados=args.estados.split(","))
        await caixa.run()

        zuk = ZukScraper(database_url)
        await zuk.run()

    logger.info("═" * 60)
    logger.info("All scrapers finished.")
    logger.info("═" * 60)


if __name__ == "__main__":
    asyncio.run(main())
