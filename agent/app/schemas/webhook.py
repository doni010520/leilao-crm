from pydantic import BaseModel


class IncomingMessage(BaseModel):
    """Normalized message extracted from webhook payload."""
    phone: str
    name: str | None = None
    text: str | None = None
    media_url: str | None = None
    media_type: str | None = None  # image | audio | document | video
    message_id: str | None = None
    is_group: bool = False


class UAZWebhookPayload(BaseModel):
    """Raw UAZ API webhook payload — adapt fields to match your instance."""
    event: str | None = None
    phone: str | None = None
    pushname: str | None = None
    body: str | None = None
    type: str | None = None
    mimetype: str | None = None
    url: str | None = None
    id: str | None = None
    isGroup: bool = False

    def to_incoming(self) -> IncomingMessage | None:
        if self.event not in ("message", "messages.upsert"):
            return None
        return IncomingMessage(
            phone=self.phone or "",
            name=self.pushname,
            text=self.body,
            media_url=self.url,
            media_type=self.type if self.type in ("image", "audio", "document", "video") else None,
            message_id=self.id,
            is_group=self.isGroup,
        )
