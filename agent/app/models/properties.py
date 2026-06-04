"""
Extended models for the auction agent: properties, leads, agency users.
"""
from datetime import datetime
from sqlalchemy import (
    String, Text, DateTime, Boolean, Integer, Float,
    Enum as SAEnum, func, ForeignKey, JSON
)
from sqlalchemy.orm import Mapped, mapped_column
from app.models.conversation import Base
import enum


# ─── ENUMS ────────────────────────────────────────────────────────────────────

class TipoLeilao(str, enum.Enum):
    JUDICIAL = "judicial"
    EXTRAJUDICIAL = "extrajudicial"


class TipoImovel(str, enum.Enum):
    APARTAMENTO = "apartamento"
    CASA = "casa"
    TERRENO = "terreno"
    COMERCIAL = "comercial"
    RURAL = "rural"
    OUTRO = "outro"


class StatusLeilao(str, enum.Enum):
    ABERTO = "aberto"
    EM_ANDAMENTO = "em_andamento"
    ARREMATADO = "arrematado"
    SUSPENSO = "suspenso"
    FRUSTRADO = "frustrado"
    ENCERRADO = "encerrado"


class Praca(str, enum.Enum):
    PRIMEIRA = "1a"
    SEGUNDA = "2a"
    VENDA_DIRETA = "venda_direta"
    LICITACAO = "licitacao"


class OcupacaoStatus(str, enum.Enum):
    OCUPADO = "ocupado"
    DESOCUPADO = "desocupado"
    NAO_INFORMADO = "nao_informado"


class LeadScore(str, enum.Enum):
    QUENTE = "quente"       # 12+
    MORNO = "morno"         # 6-11
    CURIOSO = "curioso"     # 0-5


class LeadPerfil(str, enum.Enum):
    INVESTIDOR_EXPERIENTE = "investidor_experiente"
    INICIANTE = "iniciante"
    CASA_PROPRIA = "casa_propria"
    FLIPPER = "flipper"
    RENTEIRO = "renteiro"
    NAO_DEFINIDO = "nao_definido"


class FunilEstagio(str, enum.Enum):
    NOVO = "novo"
    QUALIFICADO = "qualificado"
    INTERESSADO = "interessado"
    EM_NEGOCIACAO = "em_negociacao"
    CONVERTIDO = "convertido"
    PERDIDO = "perdido"


# ─── PROPERTIES ───────────────────────────────────────────────────────────────

class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_id: Mapped[str | None] = mapped_column(String(100), index=True)
    fonte: Mapped[str] = mapped_column(String(50), index=True)  # caixa, zuk, mega, etc
    url_original: Mapped[str | None] = mapped_column(Text)

    tipo_leilao: Mapped[str | None] = mapped_column(String(20))
    banco: Mapped[str | None] = mapped_column(String(50))
    leiloeiro: Mapped[str | None] = mapped_column(String(100))
    tipo_imovel: Mapped[str | None] = mapped_column(String(30))

    endereco: Mapped[str | None] = mapped_column(Text)
    bairro: Mapped[str | None] = mapped_column(String(200))
    cidade: Mapped[str | None] = mapped_column(String(100), index=True)
    estado: Mapped[str | None] = mapped_column(String(2), index=True)
    cep: Mapped[str | None] = mapped_column(String(10))

    area_privativa: Mapped[float | None] = mapped_column(Float)
    area_terreno: Mapped[float | None] = mapped_column(Float)
    quartos: Mapped[int | None] = mapped_column(Integer)
    vagas: Mapped[int | None] = mapped_column(Integer)

    valor_avaliacao: Mapped[float | None] = mapped_column(Float)
    lance_minimo: Mapped[float | None] = mapped_column(Float)
    desconto_pct: Mapped[float | None] = mapped_column(Float)

    praca: Mapped[str | None] = mapped_column(String(20))
    data_leilao: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default="aberto", index=True)

    ocupacao: Mapped[str] = mapped_column(String(20), default="nao_informado")
    dividas_declaradas: Mapped[str | None] = mapped_column(Text)
    edital_url: Mapped[str | None] = mapped_column(Text)
    matricula_url: Mapped[str | None] = mapped_column(Text)
    imagem_url: Mapped[str | None] = mapped_column(Text)

    aceita_financiamento: Mapped[bool | None] = mapped_column(Boolean)
    aceita_fgts: Mapped[bool | None] = mapped_column(Boolean)

    score_risco: Mapped[int | None] = mapped_column(Integer)  # 1-10, 1=baixo risco
    notas: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ─── LEADS ────────────────────────────────────────────────────────────────────

class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(200))

    # Qualificação
    perfil: Mapped[str] = mapped_column(String(30), default="nao_definido")
    score_valor: Mapped[int] = mapped_column(Integer, default=0)
    score_label: Mapped[str] = mapped_column(String(20), default="curioso")
    estagio: Mapped[str] = mapped_column(String(20), default="novo")

    # Dados de qualificação
    ja_arrematou: Mapped[bool | None] = mapped_column(Boolean)
    objetivo: Mapped[str | None] = mapped_column(String(50))  # morar, investir, entender
    regiao_interesse: Mapped[str | None] = mapped_column(String(200))
    tipo_imovel_interesse: Mapped[str | None] = mapped_column(String(50))
    faixa_valor_min: Mapped[float | None] = mapped_column(Float)
    faixa_valor_max: Mapped[float | None] = mapped_column(Float)
    forma_pagamento: Mapped[str | None] = mapped_column(String(50))  # avista, financiamento
    capital_disponivel: Mapped[bool | None] = mapped_column(Boolean)
    prazo_compra: Mapped[str | None] = mapped_column(String(50))  # imediato, 30dias, sem_prazo
    tem_assessoria: Mapped[bool | None] = mapped_column(Boolean)
    origem: Mapped[str | None] = mapped_column(String(100))  # indicacao, youtube, ads, organico

    # Atribuição
    corretor_responsavel: Mapped[str | None] = mapped_column(String(200))
    notas_corretor: Mapped[str | None] = mapped_column(Text)

    metadata_json: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# ─── LEAD INTERESTS ──────────────────────────────────────────────────────────

class LeadInterest(Base):
    __tablename__ = "lead_interests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id"), index=True)
    property_id: Mapped[int] = mapped_column(Integer, ForeignKey("properties.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(20), default="visualizou")  # visualizou, pediu_simulacao, interessado
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ─── AGENCY USERS (dashboard access) ─────────────────────────────────────────

class AgencyUser(Base):
    __tablename__ = "agency_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(20), default="corretor")  # admin, corretor
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
