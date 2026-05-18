"""Supabase service-role client + CRUD helpers for the processor."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from supabase import Client, create_client


def get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def fetch_pending_job(supabase: Client) -> dict | None:
    """Get the oldest pending job, or None."""
    res = (
        supabase.table("jobs")
        .select("*")
        .eq("status", "pending")
        .order("created_at", desc=False)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def claim_job(supabase: Client, job_id: str) -> bool:
    """Atomically flip pending → processing. Returns True if we claimed it."""
    res = (
        supabase.table("jobs")
        .update({"status": "processing", "error_message": None})
        .eq("id", job_id)
        .eq("status", "pending")
        .execute()
    )
    return bool(res.data)


def update_job(supabase: Client, job_id: str, **fields: Any) -> None:
    supabase.table("jobs").update(fields).eq("id", job_id).execute()


def fetch_project(supabase: Client, project_id: str) -> dict | None:
    res = (
        supabase.table("projects")
        .select("*, creator:creators(name, platform, channel_url)")
        .eq("id", project_id)
        .single()
        .execute()
    )
    return res.data


def insert_clip(supabase: Client, **fields: Any) -> dict:
    res = supabase.table("clips").insert(fields).execute()
    return res.data[0]


def upload_to_storage(
    supabase: Client,
    local_path: Path,
    storage_path: str,
    content_type: str,
) -> str:
    """Upload a file and return its public URL."""
    with open(local_path, "rb") as f:
        supabase.storage.from_("clips").upload(
            path=storage_path,
            file=f,
            file_options={
                "content-type": content_type,
                "upsert": "true",
            },
        )
    return supabase.storage.from_("clips").get_public_url(storage_path)


# --- Posts (Sprint 2) ---------------------------------------------------


def count_due_posts(supabase: Client) -> int:
    """How many posts are ready to publish right now."""
    now = datetime.now(timezone.utc).isoformat()
    res = (
        supabase.table("posts")
        .select("id", count="exact", head=True)
        .or_(f"status.eq.queued,and(status.eq.scheduled,scheduled_for.lte.{now})")
        .execute()
    )
    return res.count or 0


def fetch_due_post(supabase: Client) -> dict | None:
    """Oldest post ready to publish: queued now, or scheduled and due."""
    now = datetime.now(timezone.utc).isoformat()
    res = (
        supabase.table("posts")
        .select("*")
        .or_(f"status.eq.queued,and(status.eq.scheduled,scheduled_for.lte.{now})")
        .order("scheduled_for", desc=False)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def claim_post(supabase: Client, post_id: str) -> bool:
    """Atomically flip queued/scheduled → posting. True if we claimed it."""
    res = (
        supabase.table("posts")
        .update({"status": "posting", "error_message": None})
        .eq("id", post_id)
        .in_("status", ["queued", "scheduled"])
        .execute()
    )
    return bool(res.data)


def update_post(supabase: Client, post_id: str, **fields: Any) -> None:
    supabase.table("posts").update(fields).eq("id", post_id).execute()


def fetch_clip(supabase: Client, clip_id: str) -> dict | None:
    res = supabase.table("clips").select("*").eq("id", clip_id).single().execute()
    return res.data
