"""
Supabase client for the agent.
Uses service_role key to bypass RLS (agent is a backend service, not a user).
All operations are scoped to the organization_id from settings.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from loguru import logger
from app.core.config import get_settings

settings = get_settings()

_BASE = settings.supabase_url.rstrip("/") + "/rest/v1" if settings.supabase_url else ""
_HEADERS = {
    "apikey": settings.supabase_service_key,
    "Authorization": f"Bearer {settings.supabase_service_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def _org() -> str:
    return settings.organization_id


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _req(method: str, table: str, params: dict | None = None,
               body: dict | list | None = None, single: bool = False) -> Any:
    """Generic Supabase REST request."""
    if not _BASE:
        logger.warning("Supabase not configured — skipping DB operation")
        return None

    url = f"{_BASE}/{table}"
    headers = {**_HEADERS}
    if single:
        headers["Accept"] = "application/vnd.pgrst.object+json"

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.request(method, url, params=params, json=body, headers=headers)
        if resp.status_code >= 400:
            logger.error(f"Supabase {method} {table}: {resp.status_code} {resp.text[:200]}")
            return None
        if resp.status_code == 204:
            return True
        return resp.json()


# ─── Contacts ─────────────────────────────────────────────────────────────────

async def get_or_create_contact(phone: str, name: str | None = None) -> dict | None:
    """Get existing contact or create one."""
    result = await _req("GET", "contacts", params={
        "organization_id": f"eq.{_org()}",
        "phone": f"eq.{phone}",
        "select": "*",
    })
    if result and len(result) > 0:
        contact = result[0]
        # Update name if missing
        if name and not contact.get("name"):
            await _req("PATCH", "contacts", params={
                "id": f"eq.{contact['id']}",
            }, body={"name": name})
            contact["name"] = name
        return contact

    # Create
    new_contact = {
        "id": str(uuid.uuid4()),
        "organization_id": _org(),
        "phone": phone,
        "name": name,
        "custom_fields": {},
        "created_at": _now(),
    }
    result = await _req("POST", "contacts", body=new_contact)
    return result[0] if result else new_contact


# ─── Conversations ────────────────────────────────────────────────────────────

async def get_or_create_conversation(contact_id: str, channel_id: str | None = None) -> dict | None:
    """Get open conversation or create one."""
    result = await _req("GET", "conversations", params={
        "organization_id": f"eq.{_org()}",
        "contact_id": f"eq.{contact_id}",
        "status": f"in.(bot,queued,open)",
        "select": "*",
        "order": "created_at.desc",
        "limit": "1",
    })
    if result and len(result) > 0:
        return result[0]

    new_conv = {
        "id": str(uuid.uuid4()),
        "organization_id": _org(),
        "contact_id": contact_id,
        "channel_id": channel_id or _org(),  # fallback
        "status": "bot",
        "opened_at": _now(),
        "created_at": _now(),
    }
    result = await _req("POST", "conversations", body=new_conv)
    return result[0] if result else new_conv


# ─── Messages ─────────────────────────────────────────────────────────────────

async def save_message(
    conversation_id: str,
    direction: str,  # 'in' | 'out'
    sender_type: str,  # 'contact' | 'agent' | 'bot' | 'system'
    body: str,
    content_type: str = "text",
    sender_id: str | None = None,
) -> dict | None:
    msg = {
        "id": str(uuid.uuid4()),
        "organization_id": _org(),
        "conversation_id": conversation_id,
        "direction": direction,
        "sender_type": sender_type,
        "sender_id": sender_id,
        "content_type": content_type,
        "body": body,
        "status": "sent",
        "created_at": _now(),
    }
    result = await _req("POST", "messages", body=msg)

    # Update conversation last_message_at
    await _req("PATCH", "conversations", params={
        "id": f"eq.{conversation_id}",
    }, body={"last_message_at": _now()})

    return result[0] if result else msg


async def get_message_history(conversation_id: str, limit: int = 40) -> list[dict]:
    result = await _req("GET", "messages", params={
        "conversation_id": f"eq.{conversation_id}",
        "select": "*",
        "order": "created_at.desc",
        "limit": str(limit),
    })
    return list(reversed(result)) if result else []


# ─── Properties ───────────────────────────────────────────────────────────────

async def search_properties(
    estado: str,
    cidade: str | None = None,
    tipo_imovel: str | None = None,
    valor_max: float | None = None,
    valor_min: float | None = None,
    limit: int = 3,
) -> list[dict]:
    params: dict = {
        "organization_id": f"eq.{_org()}",
        "estado": f"eq.{estado.upper()}",
        "status": "eq.aberto",
        "select": "*",
        "order": "desconto_pct.desc.nullslast",
        "limit": str(limit),
    }
    if cidade:
        params["cidade"] = f"ilike.%{cidade}%"
    if tipo_imovel:
        params["tipo_imovel"] = f"eq.{tipo_imovel}"
    if valor_max:
        params["lance_minimo"] = f"lte.{valor_max}"
    if valor_min:
        params["lance_minimo"] = f"gte.{valor_min}"

    return await _req("GET", "properties", params=params) or []


# ─── Lead Qualifications ─────────────────────────────────────────────────────

async def upsert_lead(contact_id: str, data: dict) -> dict | None:
    """Create or update lead qualification for a contact."""
    result = await _req("GET", "lead_qualifications", params={
        "organization_id": f"eq.{_org()}",
        "contact_id": f"eq.{contact_id}",
        "select": "*",
    })

    if result and len(result) > 0:
        # Update
        lead = result[0]
        await _req("PATCH", "lead_qualifications", params={
            "id": f"eq.{lead['id']}",
        }, body={**data, "updated_at": _now()})
        return {**lead, **data}
    else:
        # Create
        new_lead = {
            "id": str(uuid.uuid4()),
            "organization_id": _org(),
            "contact_id": contact_id,
            **data,
            "created_at": _now(),
            "updated_at": _now(),
        }
        result = await _req("POST", "lead_qualifications", body=new_lead)
        return result[0] if result else new_lead


# ─── Activities ───────────────────────────────────────────────────────────────

async def log_activity(
    contact_id: str,
    tipo: str,
    descricao: str,
    deal_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    await _req("POST", "activities", body={
        "id": str(uuid.uuid4()),
        "organization_id": _org(),
        "contact_id": contact_id,
        "deal_id": deal_id,
        "tipo": tipo,
        "descricao": descricao,
        "metadata": metadata or {},
        "created_at": _now(),
    })


# ─── Deals ────────────────────────────────────────────────────────────────────

async def create_deal(
    contact_id: str,
    property_id: str,
    title: str,
    valor: float | None = None,
) -> dict | None:
    deal = {
        "id": str(uuid.uuid4()),
        "organization_id": _org(),
        "contact_id": contact_id,
        "property_id": property_id,
        "title": title,
        "valor_pretendido": valor,
        "status": "acompanhando",
        "created_at": _now(),
        "updated_at": _now(),
    }
    result = await _req("POST", "deals", body=deal)
    return result[0] if result else deal
