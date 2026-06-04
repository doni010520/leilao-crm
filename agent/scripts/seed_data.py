"""
Seed the database with sample properties for testing.
Run: python scripts/seed_data.py
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.models.conversation import Base
from app.models.properties import Property, Lead, AgencyUser

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/leilao_agent",
)

SAMPLE_PROPERTIES = [
    {
        "external_id": "CAIXA-SP-001",
        "fonte": "caixa",
        "tipo_leilao": "extrajudicial",
        "banco": "Caixa Econômica Federal",
        "leiloeiro": "Superbid Exchange",
        "tipo_imovel": "apartamento",
        "endereco": "Rua Augusta, 1200 — Apto 42",
        "bairro": "Consolação",
        "cidade": "São Paulo",
        "estado": "SP",
        "cep": "01304-001",
        "area_privativa": 68.0,
        "quartos": 2,
        "vagas": 1,
        "valor_avaliacao": 520000,
        "lance_minimo": 312000,
        "desconto_pct": 40.0,
        "praca": "2a",
        "data_leilao": datetime.now() + timedelta(days=15),
        "status": "aberto",
        "ocupacao": "ocupado",
        "aceita_financiamento": False,
        "url_original": "https://venda-imoveis.caixa.gov.br/exemplo",
    },
    {
        "external_id": "CAIXA-SP-002",
        "fonte": "caixa",
        "tipo_leilao": "extrajudicial",
        "banco": "Caixa Econômica Federal",
        "leiloeiro": "Mega Leilões",
        "tipo_imovel": "casa",
        "endereco": "Rua das Palmeiras, 450",
        "bairro": "Jardim Europa",
        "cidade": "Campinas",
        "estado": "SP",
        "cep": "13090-000",
        "area_privativa": 120.0,
        "area_terreno": 200.0,
        "quartos": 3,
        "vagas": 2,
        "valor_avaliacao": 680000,
        "lance_minimo": 374000,
        "desconto_pct": 45.0,
        "praca": "2a",
        "data_leilao": datetime.now() + timedelta(days=22),
        "status": "aberto",
        "ocupacao": "desocupado",
        "aceita_financiamento": True,
        "url_original": "https://venda-imoveis.caixa.gov.br/exemplo2",
    },
    {
        "external_id": "ZUK-RJ-001",
        "fonte": "zuk",
        "tipo_leilao": "extrajudicial",
        "banco": "Itaú",
        "leiloeiro": "Zuk Leilões",
        "tipo_imovel": "apartamento",
        "endereco": "Av. Atlântica, 2800 — Apto 1201",
        "bairro": "Copacabana",
        "cidade": "Rio de Janeiro",
        "estado": "RJ",
        "cep": "22041-001",
        "area_privativa": 95.0,
        "quartos": 3,
        "vagas": 1,
        "valor_avaliacao": 1200000,
        "lance_minimo": 720000,
        "desconto_pct": 40.0,
        "praca": "1a",
        "data_leilao": datetime.now() + timedelta(days=10),
        "status": "aberto",
        "ocupacao": "nao_informado",
        "aceita_financiamento": True,
        "url_original": "https://portalzuk.com.br/exemplo",
    },
    {
        "external_id": "MEGA-MG-001",
        "fonte": "mega",
        "tipo_leilao": "judicial",
        "banco": None,
        "leiloeiro": "Mega Leilões",
        "tipo_imovel": "terreno",
        "endereco": "Rodovia MG-030, Km 12",
        "bairro": "Nova Lima",
        "cidade": "Nova Lima",
        "estado": "MG",
        "cep": "34000-000",
        "area_terreno": 500.0,
        "valor_avaliacao": 350000,
        "lance_minimo": 175000,
        "desconto_pct": 50.0,
        "praca": "2a",
        "data_leilao": datetime.now() + timedelta(days=30),
        "status": "aberto",
        "ocupacao": "desocupado",
        "aceita_financiamento": False,
        "url_original": "https://megaleiloes.com.br/exemplo",
    },
    {
        "external_id": "BRAD-SP-001",
        "fonte": "bradesco",
        "tipo_leilao": "extrajudicial",
        "banco": "Bradesco",
        "leiloeiro": "Sodré Santoro",
        "tipo_imovel": "apartamento",
        "endereco": "Rua Oscar Freire, 680 — Apto 91",
        "bairro": "Jardins",
        "cidade": "São Paulo",
        "estado": "SP",
        "cep": "01426-000",
        "area_privativa": 140.0,
        "quartos": 4,
        "vagas": 2,
        "valor_avaliacao": 1800000,
        "lance_minimo": 810000,
        "desconto_pct": 55.0,
        "praca": "2a",
        "data_leilao": datetime.now() + timedelta(days=8),
        "status": "aberto",
        "ocupacao": "ocupado",
        "dividas_declaradas": "Condomínio: R$ 45.000 (responsabilidade do arrematante conforme edital)",
        "aceita_financiamento": False,
        "url_original": "https://sodresantoro.com.br/exemplo",
    },
    {
        "external_id": "CAIXA-PR-001",
        "fonte": "caixa",
        "tipo_leilao": "extrajudicial",
        "banco": "Caixa Econômica Federal",
        "leiloeiro": "Frazão Leilões",
        "tipo_imovel": "casa",
        "endereco": "Rua XV de Novembro, 1340",
        "bairro": "Centro",
        "cidade": "Curitiba",
        "estado": "PR",
        "cep": "80020-310",
        "area_privativa": 90.0,
        "area_terreno": 150.0,
        "quartos": 2,
        "vagas": 1,
        "valor_avaliacao": 420000,
        "lance_minimo": 252000,
        "desconto_pct": 40.0,
        "praca": "2a",
        "data_leilao": datetime.now() + timedelta(days=18),
        "status": "aberto",
        "ocupacao": "desocupado",
        "aceita_financiamento": True,
        "aceita_fgts": True,
        "url_original": "https://venda-imoveis.caixa.gov.br/exemplo3",
    },
    {
        "external_id": "SANT-RJ-001",
        "fonte": "santander",
        "tipo_leilao": "extrajudicial",
        "banco": "Santander",
        "leiloeiro": "Biasi Leilões",
        "tipo_imovel": "comercial",
        "endereco": "Av. Rio Branco, 185 — Sala 802",
        "bairro": "Centro",
        "cidade": "Rio de Janeiro",
        "estado": "RJ",
        "cep": "20040-007",
        "area_privativa": 55.0,
        "quartos": 0,
        "vagas": 0,
        "valor_avaliacao": 380000,
        "lance_minimo": 190000,
        "desconto_pct": 50.0,
        "praca": "2a",
        "data_leilao": datetime.now() + timedelta(days=12),
        "status": "aberto",
        "ocupacao": "desocupado",
        "aceita_financiamento": True,
        "url_original": "https://santanderimoveis.com.br/exemplo",
    },
    {
        "external_id": "CAIXA-BA-001",
        "fonte": "caixa",
        "tipo_leilao": "extrajudicial",
        "banco": "Caixa Econômica Federal",
        "leiloeiro": "Sold",
        "tipo_imovel": "apartamento",
        "endereco": "Rua da Graça, 250 — Apto 504",
        "bairro": "Graça",
        "cidade": "Salvador",
        "estado": "BA",
        "cep": "40150-055",
        "area_privativa": 78.0,
        "quartos": 2,
        "vagas": 1,
        "valor_avaliacao": 310000,
        "lance_minimo": 186000,
        "desconto_pct": 40.0,
        "praca": "1a",
        "data_leilao": datetime.now() + timedelta(days=25),
        "status": "aberto",
        "ocupacao": "nao_informado",
        "aceita_financiamento": True,
        "url_original": "https://venda-imoveis.caixa.gov.br/exemplo4",
    },
]

SAMPLE_LEADS = [
    {
        "phone": "5511999990001",
        "name": "Carlos Investidor",
        "perfil": "investidor_experiente",
        "score_valor": 15,
        "score_label": "quente",
        "estagio": "qualificado",
        "ja_arrematou": True,
        "objetivo": "investir",
        "regiao_interesse": "São Paulo - SP",
        "faixa_valor_min": 200000,
        "faixa_valor_max": 500000,
        "forma_pagamento": "avista",
        "capital_disponivel": True,
        "prazo_compra": "imediato",
    },
    {
        "phone": "5511999990002",
        "name": "Ana Primeira Casa",
        "perfil": "casa_propria",
        "score_valor": 9,
        "score_label": "morno",
        "estagio": "interessado",
        "ja_arrematou": False,
        "objetivo": "morar",
        "regiao_interesse": "Campinas - SP",
        "faixa_valor_min": 150000,
        "faixa_valor_max": 350000,
        "forma_pagamento": "financiamento",
        "capital_disponivel": False,
        "prazo_compra": "60dias",
    },
    {
        "phone": "5511999990003",
        "name": "Pedro Curioso",
        "perfil": "nao_definido",
        "score_valor": 3,
        "score_label": "curioso",
        "estagio": "novo",
        "ja_arrematou": False,
        "objetivo": "entender",
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # Seed properties
        for data in SAMPLE_PROPERTIES:
            prop = Property(**data)
            db.add(prop)
        logger.info(f"Seeded {len(SAMPLE_PROPERTIES)} properties")

        # Seed leads
        for data in SAMPLE_LEADS:
            lead = Lead(**data)
            db.add(lead)
        logger.info(f"Seeded {len(SAMPLE_LEADS)} leads")

        # Seed admin user (email: admin@leilao.com, password: admin123)
        import bcrypt
        admin = AgencyUser(
            email="admin@leilao.com",
            password_hash=bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode(),
            name="Administrador",
            role="admin",
        )
        db.add(admin)
        logger.info("Seeded admin user: admin@leilao.com / admin123")

        await db.commit()

    await engine.dispose()
    logger.info("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
