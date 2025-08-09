from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional

import boto3
from app.core.config import settings
from botocore.client import BaseClient
from jinja2 import Environment, FileSystemLoader, select_autoescape


class EmailService:
    """Service for rendering and sending festival emails through AWS SES.

    Sending is gated by EMAIL_ENABLE_SENDING. When disabled, renders and returns
    the HTML so callers can log or test without attempting delivery.
    """

    def __init__(self) -> None:
        self.templates_dir = Path(__file__).resolve().parents[1] / "templates"
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=select_autoescape(["html", "xml"]),
            enable_async=False,
        )

        self.ses_client: Optional[BaseClient] = None
        if settings.EMAIL_ENABLE_SENDING and settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            self.ses_client = boto3.client(
                "ses",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )

    def _render(self, template_name: str, context: Dict) -> str:
        template = self.jinja_env.get_template(template_name)
        return template.render(**context)

    def _send_html_email(self, to_address: str, subject: str, html: str) -> Dict:
        if not self.ses_client:
            # Sending disabled; return a pseudo-response for logging/testing
            return {
                "MessageId": "dry-run",
                "To": to_address,
                "Subject": subject,
                "Length": len(html),
                "Enabled": False,
            }

        destination = {"ToAddresses": [to_address]}
        message = {
            "Subject": {"Data": subject},
            "Body": {"Html": {"Data": html}},
        }

        kwargs: Dict = {
            "Source": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>",
            "Destination": destination,
            "Message": message,
        }
        if settings.EMAIL_REPLY_TO:
            kwargs["ReplyToAddresses"] = [settings.EMAIL_REPLY_TO]

        return self.ses_client.send_email(**kwargs)  # type: ignore[arg-type]

    # Public API
    def send_booking_confirmation(self, to_address: str, context: Dict) -> Dict:
        html = self._render("emails/booking_confirmation.html", context)
        subject = "Your booking is confirmed – Food & Friends"
        return self._send_html_email(to_address, subject, html)

    def send_booking_update(self, to_address: str, context: Dict) -> Dict:
        html = self._render("emails/booking_update.html", context)
        subject = "Your booking was updated – Food & Friends"
        return self._send_html_email(to_address, subject, html)

    def send_booking_cancellation(self, to_address: str, context: Dict) -> Dict:
        html = self._render("emails/booking_cancellation.html", context)
        subject = "Your booking was cancelled – Food & Friends"
        return self._send_html_email(to_address, subject, html)


email_service = EmailService()
