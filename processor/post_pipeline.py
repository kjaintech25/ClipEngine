"""Publishes one due post (Sprint 2). Currently YouTube Shorts only."""

from __future__ import annotations

import shutil
import time
import traceback
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from supabase import Client

import supabase_client
import youtube_client
from pipeline import TMP_BASE, log


def _download(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, dest)  # noqa: S310 — our own Supabase URL
    return dest


def process_post(supabase: Client, post: dict) -> None:
    post_id: str = post["id"]
    platform: str = post["platform"]
    work_dir = TMP_BASE / f"post_{post_id}"

    try:
        if platform != "youtube_shorts":
            raise RuntimeError(f"Unsupported platform '{platform}' (YouTube only for now).")

        clip = supabase_client.fetch_clip(supabase, post["clip_id"])
        if not clip:
            raise RuntimeError("Clip not found.")
        if not clip.get("video_url"):
            raise RuntimeError("Clip has no video_url.")

        t0 = time.time()
        video_path = _download(clip["video_url"], work_dir / "clip.mp4")
        log(post_id, "post_download", "ok", elapsed=f"{time.time() - t0:.1f}s")

        title = post.get("title_used") or clip.get("title") or "Untitled"
        description = post.get("description_used") or clip.get("description") or ""

        t0 = time.time()
        video_id = youtube_client.upload_short(video_path, title, description)
        log(post_id, "post_upload", "ok", elapsed=f"{time.time() - t0:.1f}s", video=video_id)

        supabase_client.update_post(
            supabase,
            post_id,
            status="posted",
            platform_post_id=video_id,
            posted_at=datetime.now(timezone.utc).isoformat(),
        )
        log(post_id, "post_done", "ok")

    except Exception as exc:
        err = f"{type(exc).__name__}: {exc}"[:500]
        supabase_client.update_post(
            supabase, post_id, status="failed", error_message=err
        )
        log(post_id, "post_fail", "err", error=type(exc).__name__)
        print(traceback.format_exc(), flush=True)

    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
