"""ClipEngine processor — polling loop entry point.

Usage:
    cd processor
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env   # then fill in the 3 missing keys
    python processor.py
"""

from __future__ import annotations

import os
import signal
import sys
import time

from dotenv import load_dotenv

import ffmpeg_utils
import pipeline
import post_pipeline
import supabase_client
import youtube_client

POLL_INTERVAL_SECS = 5
REQUIRED_ENV = (
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
)

_shutdown = False


def _handle_sigint(signum, frame):
    global _shutdown
    if _shutdown:
        print("\nforce-exit", flush=True)
        sys.exit(1)
    print("\nshutdown signal received — will exit after current job finishes (Ctrl+C again to force)", flush=True)
    _shutdown = True


def main() -> None:
    load_dotenv()
    missing = [k for k in REQUIRED_ENV if not os.environ.get(k)]
    if missing:
        print(f"missing env vars: {', '.join(missing)}", file=sys.stderr)
        print("copy .env.example to .env and fill them in.", file=sys.stderr)
        sys.exit(1)

    ffmpeg_utils.check_ffmpeg_installed()
    signal.signal(signal.SIGINT, _handle_sigint)
    signal.signal(signal.SIGTERM, _handle_sigint)

    supabase = supabase_client.get_client()
    yt_ready = youtube_client.youtube_configured()
    print(f"clipengine processor started. polling every {POLL_INTERVAL_SECS}s. ctrl+c to stop.", flush=True)
    print(f"youtube posting: {'enabled' if yt_ready else 'not configured (jobs still run)'}", flush=True)

    warned_youtube = False

    while not _shutdown:
        # Jobs take priority over posts.
        job = supabase_client.fetch_pending_job(supabase)
        if job is not None:
            if supabase_client.claim_job(supabase, job["id"]):
                print(f"\n--- picked up job {job['id']} ---", flush=True)
                pipeline.process_job(supabase, job)
                print(f"--- finished job {job['id']} ---\n", flush=True)
            continue

        # No job pending — check for a post that's due to publish.
        post = supabase_client.fetch_due_post(supabase)
        if post is not None:
            if youtube_client.youtube_configured():
                if supabase_client.claim_post(supabase, post["id"]):
                    print(f"\n--- publishing post {post['id']} ---", flush=True)
                    post_pipeline.process_post(supabase, post)
                    print(f"--- finished post {post['id']} ---\n", flush=True)
                continue
            elif not warned_youtube:
                due = supabase_client.count_due_posts(supabase)
                print(
                    f"youtube not configured — skipping {due} due post(s). "
                    "Add YOUTUBE_* keys to .env and run youtube_auth.py to enable posting.",
                    flush=True,
                )
                warned_youtube = True

        time.sleep(POLL_INTERVAL_SECS)

    print("processor exited cleanly.", flush=True)


if __name__ == "__main__":
    main()
