"""
Tool handlers — now uses Supabase client for shared database access.
"""
import json
from loguru import logger
from app.core.config import get_settings
from app.services import supabase_client as db

settings = get_settings()

# Track current contact for tool calls
_current_contact_id: str | None = None
_current_phone: str = ""


def set_context(phone: str, contact_id: str):
    global _current_contact_id, _current_phone
    _current_phone = phone
    _current_contact_id = contact_id


# ─── BUSCAR IMÓVEIS ──────────────────────────────────────────────────────────

async def handle_buscar_imoveis(phone: str, args: dict) -> dict:
    estado = args.get("estado", "").upper().strip()
    logger.info(f"[TOOL] buscar_imoveis | {phone} | estado={estado}")

    properties = await db.search_properties(
        estado=estado,
        cidade=args.get("cidade"),
        tipo_imovel=args.get("tipo_imovel"),
        valor_max=args.get("valor_max"),
        valor_min=args.get("valor_min"),
        limit=args.get("limite", 3),
    )

    if not properties:
        return {
            "encontrados": 0,
            "mensagem": f"Não encontrei imóveis abertos em {estado}. Posso ajustar a busca."
        }

    return {
        "encontrados": len(properties),
        "imoveis": [
            {
                "id": p["id"], "tipo": p.get("tipo_imovel", "imóvel"),
                "endereco": p.get("endereco", "Endereço não informado"),
                "bairro": p.get("bairro", ""), "cidade": p.get("cidade", ""),
                "estado": p.get("estado", ""), "area": p.get("area_privativa"),
                "quartos": p.get("quartos"),
                "valor_avaliacao": p.get("valor_avaliacao"),
                "lance_minimo": p.get("lance_minimo"),
                "desconto_pct": p.get("desconto_pct"),
                "praca": p.get("praca"), "banco": p.get("banco", ""),
                "leiloeiro": p.get("leiloeiro", ""),
                "ocupacao": p.get("ocupacao"),
                "aceita_financiamento": p.get("aceita_financiamento"),
                "data_leilao": p.get("data_leilao"),
                "url": p.get("url_original"),
            }
            for p in properties
        ],
    }


# ─── SIMULAR ROI ─────────────────────────────────────────────────────────────

async def handle_simular_roi(phone: str, args: dict) -> dict:
    valor_lance = args["valor_lance"]
    valor_mercado = args["valor_mercado"]
    custo_reforma = args.get("custo_reforma", 0)
    divida_cond = args.get("divida_condominio", 0)
    finalidade = args.get("finalidade", "revenda")
    aluguel = args.get("aluguel_mensal", 0)

    logger.info(f"[TOOL] simular_roi | {phone} | lance={valor_lance}")

    comissao = valor_lance * 0.05
    itbi = valor_lance * 0.03
    registro = valor_lance * 0.01
    total = valor_lance + comissao + itbi + registro + custo_reforma + divida_cond

    result = {
        "detalhamento": {
            "valor_lance": valor_lance, "comissao_5pct": round(comissao, 2),
            "itbi_3pct": round(itbi, 2), "registro_1pct": round(registro, 2),
            "reforma": custo_reforma, "condominio": divida_cond,
            "custo_total": round(total, 2),
        },
        "valor_mercado": valor_mercado,
    }

    if finalidade == "revenda":
        lucro = valor_mercado - total
        margem = (lucro / total * 100) if total > 0 else 0
        result["revenda"] = {
            "lucro_bruto": round(lucro, 2), "margem_pct": round(margem, 1),
            "viavel": lucro > 0,
            "avaliacao": (
                "Excelente oportunidade" if margem > 25
                else "Boa margem" if margem > 15
                else "Margem apertada" if margem > 5
                else "Não recomendado"
            ),
        }
    elif finalidade == "aluguel" and aluguel > 0:
        renda = aluguel * 12
        cap = (renda / total * 100) if total > 0 else 0
        pb = (total / aluguel) if aluguel > 0 else 0
        result["aluguel"] = {
            "aluguel_mensal": aluguel, "renda_anual": round(renda, 2),
            "cap_rate_pct": round(cap, 2), "payback_meses": round(pb, 0),
            "avaliacao": (
                "Retorno excelente" if cap > 10
                else "Bom retorno" if cap > 7
                else "Retorno moderado" if cap > 5
                else "Retorno baixo"
            ),
        }

    # Log activity
    if _current_contact_id:
        await db.log_activity(_current_contact_id, "simulacao",
            f"Simulou ROI: lance {valor_lance}, mercado {valor_mercado}, finalidade {finalidade}",
            metadata=result)

    return result


# ─── QUALIFICAR LEAD ─────────────────────────────────────────────────────────

async def handle_qualificar_lead(phone: str, args: dict) -> dict:
    score = args.get("score", 0)
    score_label = "quente" if score >= 12 else ("morno" if score >= 6 else "curioso")
    logger.info(f"[TOOL] qualificar_lead | {phone} | score={score}")

    if not _current_contact_id:
        return {"status": "error", "message": "Contact not found"}

    estagio = "qualificado" if score_label == "quente" else ("interessado" if score_label == "morno" else "novo")

    data = {
        "perfil": args.get("perfil", "nao_definido"),
        "score_valor": score,
        "score_label": score_label,
        "estagio": estagio,
        "objetivo": args.get("objetivo", ""),
        "regiao_interesse": args.get("regiao", ""),
        "faixa_valor_min": args.get("faixa_valor_min"),
        "faixa_valor_max": args.get("faixa_valor_max"),
        "forma_pagamento": args.get("forma_pagamento"),
        "capital_disponivel": args.get("capital_disponivel"),
        "prazo_compra": args.get("prazo", ""),
        "ja_arrematou": args.get("ja_arrematou"),
    }

    await db.upsert_lead(_current_contact_id, data)
    await db.log_activity(_current_contact_id, "qualificacao",
        f"Qualificado como {data['perfil']} — Score {score} ({score_label})",
        metadata={"score": score, "label": score_label})

    return {"status": "ok", "score": score, "classificacao": score_label, "estagio": estagio}


# ─── TRANSFERIR CORRETOR ────────────────────────────────────────────────────

async def handle_transferir_corretor(phone: str, args: dict) -> dict:
    resumo = args.get("resumo", "")
    urgencia = args.get("urgencia", "media")
    logger.info(f"[TOOL] transferir_corretor | {phone} | urgencia={urgencia}")

    if _current_contact_id:
        await db.upsert_lead(_current_contact_id, {"estagio": "em_negociacao", "notas_corretor": resumo})
        await db.log_activity(_current_contact_id, "handoff",
            f"Transferido para corretor — urgência {urgencia}. {resumo}")

    # Notify admin phones
    if settings.admin_phone_list:
        from app.services.uaz_client import UAZClient
        uaz = UAZClient()
        emoji = "🔴" if urgencia == "alta" else "🟡" if urgencia == "media" else "🟢"
        msg = f"{emoji} *LEAD QUALIFICADO — HANDOFF*\n\n📱 {phone}\n⏱ Urgência: {urgencia}\n\n📋 {resumo}"
        for admin in settings.admin_phone_list:
            try:
                await uaz.send_text(admin, msg)
            except Exception as e:
                logger.error(f"Notify failed {admin}: {e}")

    return {"status": "ok", "message": "Transferido para o corretor.", "urgencia": urgencia}


# ─── REGISTRAR INTERESSE ────────────────────────────────────────────────────

async def handle_registrar_interesse(phone: str, args: dict) -> dict:
    property_id = args["property_id"]
    tipo = args.get("tipo", "visualizou")
    logger.info(f"[TOOL] registrar_interesse | {phone} | prop={property_id}")

    if _current_contact_id:
        # Get property info for the activity description
        props = await db.search_properties(estado="", limit=1)  # We'd need a get_by_id
        await db.log_activity(_current_contact_id, "interesse",
            f"Interesse ({tipo}) no imóvel #{property_id[:8]}",
            metadata={"property_id": property_id, "tipo": tipo})

    return {"status": "ok", "message": f"Interesse registrado no imóvel."}


# ─── REQUEST HUMAN ───────────────────────────────────────────────────────────

async def handle_request_human(phone: str, args: dict) -> dict:
    reason = args.get("reason", "")
    logger.info(f"[TOOL] request_human | {phone} | reason={reason}")

    if settings.admin_phone_list:
        from app.services.uaz_client import UAZClient
        uaz = UAZClient()
        msg = f"⚠️ *ATENDIMENTO HUMANO*\n\n📱 {phone}\n📋 {reason}"
        for admin in settings.admin_phone_list:
            try: await uaz.send_text(admin, msg)
            except: pass

    return {"status": "ok", "message": "Transferido para atendimento humano."}


# ─── REGISTRY ────────────────────────────────────────────────────────────────

HANDLERS = {
    "buscar_imoveis": handle_buscar_imoveis,
    "simular_roi": handle_simular_roi,
    "qualificar_lead": handle_qualificar_lead,
    "transferir_corretor": handle_transferir_corretor,
    "registrar_interesse": handle_registrar_interesse,
    "request_human": handle_request_human,
}


async def execute_tool(phone: str, tool_name: str, arguments_json: str) -> str:
    try:
        args = json.loads(arguments_json)
    except json.JSONDecodeError:
        args = {}

    handler = HANDLERS.get(tool_name)
    if not handler:
        return json.dumps({"error": f"Tool '{tool_name}' not found"})

    try:
        result = await handler(phone, args)
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        logger.exception(f"Tool '{tool_name}' error: {e}")
        return json.dumps({"error": str(e)})
