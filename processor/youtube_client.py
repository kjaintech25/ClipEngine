"""YouTube Shorts upload client. Dormant until YouTube creds are in .env."""

from __future__ import annotations

import os
from pathlib import Path

YOUTUBE_ENV = ("YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN")
# "People & Blogs" category — safe default for clip content.
DEFAULT_CATEGORY_ID = "22"


def youtube_configured() -> bool:
    """True only if all three YouTube env vars are present."""
    return all(os.environ.get(k) for k in YOUTUBE_ENV)


def _service():
    # Imported lazily so the processor runs fine without the google libs
    # installed / configured (YouTube posting is opt-in).
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    creds = Credentials(
        token=None,
        refresh_token=os.environ["YOUTUBE_REFRESH_TOKEN"],
        client_id=os.environ["YOUTUBE_CLIENT_ID"],
        client_secret=os.environ["YOUTUBE_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
    )
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def upload_short(video_path: Path, title: str, description: str | None) -> str:
    """Upload a 9:16 clip as a YouTube Short. Returns the video id."""
    from googleapiclient.http import MediaFileUpload

    youtube = _service()
    desc = (description or "").strip()
    if "#shorts" not in desc.lower():
        desc = f"{desc}\n\n#Shorts".strip()

    body = {
        "snippet": {
            "title": (title or "Untitled")[:100],
            "description": desc[:4900],
            "categoryId": DEFAULT_CATEGORY_ID,
        },
        "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False,
        },
    }
    media = MediaFileUpload(
        str(video_path), chunksize=-1, resumable=True, mimetype="video/mp4"
    )
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    response = request.execute()
    return response["id"]
