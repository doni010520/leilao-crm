"""
WhatsApp webhook handler.
Receives messages from UAZ/Evolution API, buffers, processes via AI agent.
"""
import hashlib
import hmac
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from loguru import logger

from app.core.config import get_settings
from app.schemas.webhook import UAZWebhookPayload
from app.services import buffer_service, conversation_service

settings = get_settings()
router = APIRouter()


def _verify_signature(body: bytes, signature: str) -> bool:
    if not settings.uaz_webhook_secret:
        return True
    expected = hmac.new(
        settings.uaz_webhook_secret.encode(), body, hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def _process_buffered(phone: str) -> None:
    messages = await buffer_service.wait_and_collect(phone)
    if not messages:
        return

    combined_text = "\n".join(messages)
    from app.schemas.webhook import IncomingMessage
    msg = IncomingMessage(phone=phone, text=combined_text)

    # Admin command check
    if phone in settings.admin_phone_list:
        await _handle_admin(phone, combined_text)
        return

    await conversation_service.process_message(msg)


async def _handle_admin(phone: str, text: str) -> None:
    from app.services.uaz_client import UAZClient
    uaz = UAZClient()
    cmd = text.strip().lower()
    logger.info(f"Admin command from {phone}: {cmd}")
    if cmd == "/status":
        await uaz.send_text(phone, "Agent running OK.")
    else:
        await uaz.send_text(phone, f"Comando desconhecido: {text}")


@router.post("/webhook")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    signature = request.headers.get("x-hub-signature-256", "")
    if not _verify_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = UAZWebhookPayload.model_validate(await request.json())
    except Exception as e:
        logger.warning(f"Failed to parse webhook: {e}")
        return {"ok": True}

    msg = payload.to_incoming()
    if not msg or not msg.phone or msg.is_group:
        return {"ok": True}

    await buffer_service.push_message(msg.phone, msg.text or "")

    if await buffer_service.is_first_in_buffer(msg.phone):
        background_tasks.add_task(_process_buffered, msg.phone)

    return {"ok": True}
