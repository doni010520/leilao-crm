import httpx
from loguru import logger
from app.core.config import get_settings


class UAZClient:
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.uaz_base_url.rstrip("/")
        self.headers = {"token": self.settings.uaz_token, "Content-Type": "application/json"}

    async def send_text(self, phone: str, text: str) -> bool:
        if self.settings.dry_run:
            logger.info(f"[DRY_RUN] → {phone}: {text}")
            return True

        url = f"{self.base_url}/message/sendText"
        payload = {"phone": phone, "message": text}

        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post(url, json=payload, headers=self.headers)
                resp.raise_for_status()
                return True
            except httpx.HTTPError as e:
                logger.error(f"UAZ send_text failed for {phone}: {e}")
                return False

    async def send_audio(self, phone: str, audio_url: str) -> bool:
        if self.settings.dry_run:
            logger.info(f"[DRY_RUN] → {phone}: [audio] {audio_url}")
            return True

        url = f"{self.base_url}/message/sendAudio"
        payload = {"phone": phone, "audio": audio_url}

        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post(url, json=payload, headers=self.headers)
                resp.raise_for_status()
                return True
            except httpx.HTTPError as e:
                logger.error(f"UAZ send_audio failed for {phone}: {e}")
                return False

    async def send_image(self, phone: str, image_url: str, caption: str = "") -> bool:
        if self.settings.dry_run:
            logger.info(f"[DRY_RUN] → {phone}: [image] {image_url}")
            return True

        url = f"{self.base_url}/message/sendImage"
        payload = {"phone": phone, "image": image_url, "caption": caption}

        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post(url, json=payload, headers=self.headers)
                resp.raise_for_status()
                return True
            except httpx.HTTPError as e:
                logger.error(f"UAZ send_image failed for {phone}: {e}")
                return False

    async def send_document(self, phone: str, doc_url: str, filename: str) -> bool:
        if self.settings.dry_run:
            logger.info(f"[DRY_RUN] → {phone}: [doc] {filename}")
            return True

        url = f"{self.base_url}/message/sendDocument"
        payload = {"phone": phone, "document": doc_url, "fileName": filename}

        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post(url, json=payload, headers=self.headers)
                resp.raise_for_status()
                return True
            except httpx.HTTPError as e:
                logger.error(f"UAZ send_document failed for {phone}: {e}")
                return False
