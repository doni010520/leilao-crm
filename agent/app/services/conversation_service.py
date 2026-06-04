"""
Conversation service — now uses Supabase as shared database.
Flow: incoming message → media → history → OpenAI → tools → save → reply
"""
from pathlib import Path
from loguru import logger

from app.core.config import get_settings
from app.schemas.webhook import IncomingMessage
from app.services import supabase_client as db
from app.services.openai_service import chat
from app.services.uaz_client import UAZClient
from app.services import media_processor
from app.tools.handlers import set_context

settings = get_settings()
_uaz = UAZClient()

HISTORY_LIMIT = 40


def _load_system_prompt() -> str:
    path = Path("prompts/system_prompt.txt")
    if not path.exists():
        logger.warning("prompts/system_prompt.txt not found")
        return ""
    raw = path.read_text(encoding="utf-8")
    raw = raw.replace("{NOME_IMOBILIARIA}", settings.agency_name)
    return raw


_SYSTEM_PROMPT = _load_system_prompt()


async def process_message(msg: IncomingMessage) -> None:
    phone = msg.phone
    logger.info(f"Processing message from {phone}")

    # 1. Get or create contact
    contact = await db.get_or_create_contact(phone, msg.name)
    if not contact:
        logger.error(f"Failed to get/create contact for {phone}")
        return
    contact_id = contact["id"]

    # 2. Get or create conversation
    conv = await db.get_or_create_conversation(contact_id)
    if not conv:
        logger.error(f"Failed to get/create conversation for {phone}")
        return
    conv_id = conv["id"]

    # Set context for tool handlers
    set_context(phone, contact_id)

    # 3. Build user text (media → text if applicable)
    user_text = msg.text or ""
    if msg.media_url and msg.media_type:
        media_text = await media_processor.process_media(msg.media_url, msg.media_type)
        user_text = f"{media_text}\n{user_text}".strip()

    if not user_text:
        return

    # 4. Save incoming message
    await db.save_message(conv_id, "in", "contact", user_text)

    # 5. Load conversation history
    raw_history = await db.get_message_history(conv_id, HISTORY_LIMIT)
    history = []
    for m in raw_history:
        role = "user" if m["direction"] == "in" else "assistant"
        if m.get("body"):
            history.append({"role": role, "content": m["body"]})

    # Ensure the current message is in history
    if not history or history[-1].get("content") != user_text:
        history.append({"role": "user", "content": user_text})

    # 6. Call OpenAI
    system_prompt = _SYSTEM_PROMPT
    reply_text, updated_history = await chat(history, system_prompt, phone=phone)

    # 7. Save assistant reply
    if reply_text:
        await db.save_message(conv_id, "out", "bot", reply_text)
        await _uaz.send_text(phone, reply_text)
    else:
        logger.warning(f"No reply generated for {phone}")
