"""
Dashboard API: endpoints for the agency frontend panel.
Auth-protected. bcrypt password hashing. Full CRUD.
"""
import json
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select, func, desc, and_, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db import get_db
from app.models.conversation import Contact, Message
from app.models.properties import Property, Lead, LeadInterest, AgencyUser

settings = get_settings()
router = APIRouter(prefix="/api", tags=["dashboard"])


# ─── AUTH HELPERS ─────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    user_role: str

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def _create_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.dashboard_token_expire_minutes),
    }
    return jwt.encode(payload, settings.dashboard_secret_key, algorithm="HS256")

def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.dashboard_secret_key, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


async def get_current_user(
    authorization: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
) -> AgencyUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token não fornecido")
    token = authorization.replace("Bearer ", "")
    payload = _decode_token(token)
    result = await db.execute(
        select(AgencyUser).where(AgencyUser.id == int(payload["sub"]))
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuário inválido")
    return user


# ─── AUTH ENDPOINTS (public) ─────────────────────────────────────────────────

@router.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AgencyUser).where(AgencyUser.email == body.email)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuário desativado")

    token = _create_token(user.id, user.email, user.role)
    return TokenResponse(access_token=token, user_name=user.name, user_role=user.role)


@router.post("/auth/setup")
async def setup_admin(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Create first admin user. Only works if no users exist."""
    result = await db.execute(select(func.count(AgencyUser.id)))
    count = result.scalar()
    if count and count > 0:
        raise HTTPException(status_code=403, detail="Setup já realizado")

    user = AgencyUser(
        email=body.email,
        password_hash=hash_password(body.password),
        name="Administrador",
        role="admin",
    )
    db.add(user)
    await db.commit()
    return {"status": "ok", "message": "Admin criado com sucesso"}


# ─── STATS (protected) ───────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _user: AgencyUser = Depends(get_current_user),
):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)

    total_leads = (await db.execute(select(func.count(Lead.id)))).scalar() or 0
    leads_quentes = (await db.execute(
        select(func.count(Lead.id)).where(Lead.score_label == "quente")
    )).scalar() or 0
    leads_mornos = (await db.execute(
        select(func.count(Lead.id)).where(Lead.score_label == "morno")
    )).scalar() or 0
    leads_curiosos = (await db.execute(
        select(func.count(Lead.id)).where(Lead.score_label == "curioso")
    )).scalar() or 0
    leads_semana = (await db.execute(
        select(func.count(Lead.id)).where(Lead.created_at >= week_ago)
    )).scalar() or 0

    total_imoveis = (await db.execute(select(func.count(Property.id)))).scalar() or 0
    imoveis_abertos = (await db.execute(
        select(func.count(Property.id)).where(Property.status == "aberto")
    )).scalar() or 0

    msgs_hoje = (await db.execute(
        select(func.count(Message.id)).where(
            and_(Message.created_at >= today, Message.role == "user")
        )
    )).scalar() or 0
    total_conversas = (await db.execute(
        select(func.count(func.distinct(Message.phone)))
    )).scalar() or 0

    convertidos = (await db.execute(
        select(func.count(Lead.id)).where(Lead.estagio == "em_negociacao")
    )).scalar() or 0
    taxa_conversao = round((convertidos / total_leads * 100), 1) if total_leads > 0 else 0

    return {
        "leads": {
            "total": total_leads, "quentes": leads_quentes,
            "mornos": leads_mornos, "curiosos": leads_curiosos,
            "esta_semana": leads_semana, "taxa_conversao": taxa_conversao,
        },
        "imoveis": {"total": total_imoveis, "abertos": imoveis_abertos},
        "atendimento": {"mensagens_hoje": msgs_hoje, "total_conversas": total_conversas},
    }


# ─── LEADS (protected) ───────────────────────────────────────────────────────

@router.get("/leads")
async def list_leads(
    score: Optional[str] = None,
    estagio: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: AgencyUser = Depends(get_current_user),
):
    query = select(Lead).order_by(desc(Lead.updated_at))
    count_query = select(func.count(Lead.id))
    if score:
        query = query.where(Lead.score_label == score)
        count_query = count_query.where(Lead.score_label == score)
    if estagio:
        query = query.where(Lead.estagio == estagio)
        count_query = count_query.where(Lead.estagio == estagio)

    total = (await db.execute(count_query)).scalar() or 0
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    leads = result.scalars().all()

    return {
        "total": total, "page": page, "per_page": per_page,
        "leads": [
            {
                "id": l.id, "phone": l.phone, "name": l.name,
                "perfil": l.perfil, "score_valor": l.score_valor,
                "score_label": l.score_label, "estagio": l.estagio,
                "objetivo": l.objetivo, "regiao_interesse": l.regiao_interesse,
                "faixa_valor_min": l.faixa_valor_min, "faixa_valor_max": l.faixa_valor_max,
                "forma_pagamento": l.forma_pagamento, "prazo_compra": l.prazo_compra,
                "ja_arrematou": l.ja_arrematou, "corretor_responsavel": l.corretor_responsavel,
                "created_at": l.created_at.isoformat() if l.created_at else None,
                "updated_at": l.updated_at.isoformat() if l.updated_at else None,
            }
            for l in leads
        ],
    }


@router.get("/leads/{lead_id}")
async def get_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    _user: AgencyUser = Depends(get_current_user),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")

    msgs = await db.execute(
        select(Message).where(Message.phone == lead.phone)
        .order_by(Message.created_at.asc()).limit(200)
    )
    messages = [
        {"role": m.role, "content": m.content,
         "created_at": m.created_at.isoformat() if m.created_at else None}
        for m in msgs.scalars().all()
    ]

    interests_result = await db.execute(
        select(LeadInterest, Property)
        .join(Property, Property.id == LeadInterest.property_id, isouter=True)
        .where(LeadInterest.lead_id == lead_id)
    )
    interests = [
        {"property_id": li.property_id, "tipo": li.tipo,
         "endereco": p.endereco if p else None, "cidade": p.cidade if p else None}
        for li, p in interests_result.all()
    ]

    return {
        "lead": {
            "id": lead.id, "phone": lead.phone, "name": lead.name,
            "perfil": lead.perfil, "score_valor": lead.score_valor,
            "score_label": lead.score_label, "estagio": lead.estagio,
            "objetivo": lead.objetivo, "regiao_interesse": lead.regiao_interesse,
            "faixa_valor_min": lead.faixa_valor_min, "faixa_valor_max": lead.faixa_valor_max,
            "forma_pagamento": lead.forma_pagamento, "capital_disponivel": lead.capital_disponivel,
            "prazo_compra": lead.prazo_compra, "ja_arrematou": lead.ja_arrematou,
            "notas_corretor": lead.notas_corretor,
            "created_at": lead.created_at.isoformat() if lead.created_at else None,
        },
        "messages": messages,
        "interests": interests,
    }


@router.patch("/leads/{lead_id}")
async def update_lead(
    lead_id: int, body: dict,
    db: AsyncSession = Depends(get_db),
    _user: AgencyUser = Depends(get_current_user),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    allowed = ["estagio", "corretor_responsavel", "notas_corretor", "perfil"]
    for key in allowed:
        if key in body:
            setattr(lead, key, body[key])
    await db.commit()
    return {"status": "ok"}


# ─── PROPERTIES (protected) ──────────────────────────────────────────────────

@router.get("/properties")
async def list_properties(
    estado: Optional[str] = None, cidade: Optional[str] = None,
    tipo_imovel: Optional[str] = None, status: Optional[str] = "aberto",
    valor_min: Optional[float] = None, valor_max: Optional[float] = None,
    page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: AgencyUser = Depends(get_current_user),
):
    query = select(Property).order_by(desc(Property.created_at))
    count_query = select(func.count(Property.id))

    if estado:
        f = Property.estado == estado.upper()
        query = query.where(f); count_query = count_query.where(f)
    if cidade:
        f = Property.cidade.ilike(f"%{cidade}%")
        query = query.where(f); count_query = count_query.where(f)
    if tipo_imovel:
        f = Property.tipo_imovel == tipo_imovel
        query = query.where(f); count_query = count_query.where(f)
    if status:
        f = Property.status == status
        query = query.where(f); count_query = count_query.where(f)
    if valor_min:
        f = Property.lance_minimo >= valor_min
        query = query.where(f); count_query = count_query.where(f)
    if valor_max:
        f = Property.lance_minimo <= valor_max
        query = query.where(f); count_query = count_query.where(f)

    total = (await db.execute(count_query)).scalar() or 0
    query = query.offset((page - 1) * per_page).limit(per_page)
    props = (await db.execute(query)).scalars().all()

    return {
        "total": total, "page": page, "per_page": per_page,
        "properties": [
            {
                "id": p.id, "fonte": p.fonte, "tipo_leilao": p.tipo_leilao,
                "banco": p.banco, "leiloeiro": p.leiloeiro, "tipo_imovel": p.tipo_imovel,
                "endereco": p.endereco, "bairro": p.bairro, "cidade": p.cidade,
                "estado": p.estado, "area_privativa": p.area_privativa,
                "quartos": p.quartos, "valor_avaliacao": p.valor_avaliacao,
                "lance_minimo": p.lance_minimo, "desconto_pct": p.desconto_pct,
                "praca": p.praca,
                "data_leilao": p.data_leilao.isoformat() if p.data_leilao else None,
                "status": p.status, "ocupacao": p.ocupacao,
                "aceita_financiamento": p.aceita_financiamento,
                "url_original": p.url_original, "imagem_url": p.imagem_url,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in props
        ],
    }


# ─── CONVERSATIONS (protected) ───────────────────────────────────────────────

@router.get("/conversations")
async def list_conversations(
    page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: AgencyUser = Depends(get_current_user),
):
    result = await db.execute(text("""
        SELECT m.phone, c.name,
               MAX(m.created_at) as last_msg_at,
               COUNT(*) as msg_count,
               (SELECT content FROM messages m2
                WHERE m2.phone = m.phone
                ORDER BY m2.created_at DESC LIMIT 1) as last_message,
               l.score_label, l.estagio
        FROM messages m
        LEFT JOIN contacts c ON c.phone = m.phone
        LEFT JOIN leads l ON l.phone = m.phone
        GROUP BY m.phone, c.name, l.score_label, l.estagio
        ORDER BY last_msg_at DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": per_page, "offset": (page - 1) * per_page})
    rows = result.fetchall()
    return {
        "conversations": [
            {
                "phone": row.phone, "name": row.name,
                "last_message_at": row.last_msg_at.isoformat() if row.last_msg_at else None,
                "message_count": row.msg_count,
                "last_message": (row.last_message or "")[:100],
                "score_label": row.score_label, "estagio": row.estagio,
            }
            for row in rows
        ]
    }


@router.get("/conversations/{phone}")
async def get_conversation(
    phone: str,
    db: AsyncSession = Depends(get_db),
    _user: AgencyUser = Depends(get_current_user),
):
    result = await db.execute(
        select(Message).where(Message.phone == phone).order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    contact = (await db.execute(select(Contact).where(Contact.phone == phone))).scalar_one_or_none()
    lead = (await db.execute(select(Lead).where(Lead.phone == phone))).scalar_one_or_none()

    return {
        "phone": phone,
        "contact_name": contact.name if contact else None,
        "lead_score": lead.score_label if lead else None,
        "lead_estagio": lead.estagio if lead else None,
        "messages": [
            {"id": m.id, "role": m.role, "content": m.content,
             "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in messages
        ],
    }


# ─── PROPERTY IMPORT (protected, admin only) ─────────────────────────────────

class PropertyImportItem(BaseModel):
    external_id: Optional[str] = None
    fonte: str = "import"
    tipo_imovel: Optional[str] = None
    endereco: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    valor_avaliacao: Optional[float] = None
    lance_minimo: Optional[float] = None
    banco: Optional[str] = None
    leiloeiro: Optional[str] = None
    tipo_leilao: Optional[str] = "extrajudicial"
    url_original: Optional[str] = None
    area_privativa: Optional[float] = None
    quartos: Optional[int] = None
    praca: Optional[str] = None
    ocupacao: Optional[str] = "nao_informado"
    aceita_financiamento: Optional[bool] = None

class PropertyImportRequest(BaseModel):
    properties: list[PropertyImportItem]


@router.post("/properties/import")
async def import_properties(
    body: PropertyImportRequest,
    db: AsyncSession = Depends(get_db),
    user: AgencyUser = Depends(get_current_user),
):
    """Bulk import properties. Admin only."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem importar")

    inserted = 0
    for item in body.properties:
        data = item.model_dump(exclude_none=True)
        # Calculate discount
        if data.get("valor_avaliacao") and data.get("lance_minimo"):
            data["desconto_pct"] = round(
                (1 - data["lance_minimo"] / data["valor_avaliacao"]) * 100, 1
            )
        data["status"] = "aberto"

        # Check for existing
        existing = None
        if data.get("external_id"):
            result = await db.execute(
                select(Property).where(
                    Property.external_id == data["external_id"],
                    Property.fonte == data.get("fonte", "import"),
                )
            )
            existing = result.scalar_one_or_none()

        if not existing:
            prop = Property(**data)
            db.add(prop)
            inserted += 1

    await db.commit()
    return {"status": "ok", "imported": inserted, "total_received": len(body.properties)}

# ─── USER MANAGEMENT (admin only) ────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "corretor"  # admin | corretor


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    user: AgencyUser = Depends(get_current_user),
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores")
    result = await db.execute(select(AgencyUser).order_by(AgencyUser.created_at.desc()))
    users = result.scalars().all()
    return {
        "users": [
            {
                "id": u.id, "email": u.email, "name": u.name,
                "role": u.role, "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }


@router.post("/users")
async def create_user(
    body: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    user: AgencyUser = Depends(get_current_user),
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores")
    existing = await db.execute(select(AgencyUser).where(AgencyUser.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email já cadastrado")
    new_user = AgencyUser(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=body.role,
    )
    db.add(new_user)
    await db.commit()
    return {"status": "ok", "id": new_user.id}


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int, body: dict,
    db: AsyncSession = Depends(get_db),
    user: AgencyUser = Depends(get_current_user),
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores")
    result = await db.execute(select(AgencyUser).where(AgencyUser.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if "name" in body:
        target.name = body["name"]
    if "role" in body and body["role"] in ("admin", "corretor"):
        target.role = body["role"]
    if "is_active" in body:
        target.is_active = body["is_active"]
    if "password" in body and body["password"]:
        target.password_hash = hash_password(body["password"])
    await db.commit()
    return {"status": "ok"}


# ─── CREATE PROPERTY MANUALLY (protected) ────────────────────────────────────

class CreatePropertyRequest(BaseModel):
    tipo_imovel: str
    endereco: Optional[str] = None
    bairro: Optional[str] = None
    cidade: str
    estado: str
    valor_avaliacao: Optional[float] = None
    lance_minimo: Optional[float] = None
    banco: Optional[str] = None
    leiloeiro: Optional[str] = None
    tipo_leilao: Optional[str] = "extrajudicial"
    area_privativa: Optional[float] = None
    quartos: Optional[int] = None
    praca: Optional[str] = None
    data_leilao: Optional[str] = None
    ocupacao: Optional[str] = "nao_informado"
    aceita_financiamento: Optional[bool] = None
    url_original: Optional[str] = None
    notas: Optional[str] = None


@router.post("/properties")
async def create_property(
    body: CreatePropertyRequest,
    db: AsyncSession = Depends(get_db),
    _user: AgencyUser = Depends(get_current_user),
):
    data = body.model_dump(exclude_none=True)
    data["fonte"] = "manual"
    data["status"] = "aberto"
    data["estado"] = data["estado"].upper()
    if data.get("valor_avaliacao") and data.get("lance_minimo"):
        data["desconto_pct"] = round(
            (1 - data["lance_minimo"] / data["valor_avaliacao"]) * 100, 1
        )
    # Parse date if string
    if data.get("data_leilao"):
        from datetime import datetime as dt
        for fmt in ["%Y-%m-%dT%H:%M", "%Y-%m-%d", "%d/%m/%Y"]:
            try:
                data["data_leilao"] = dt.strptime(data["data_leilao"], fmt)
                break
            except ValueError:
                continue
    prop = Property(**data)
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    return {"status": "ok", "id": prop.id}
