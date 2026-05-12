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
import supabase_client

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
    print(f"clipengine processor started. polling every {POLL_INTERVAL_SECS}s. ctrl+c to stop.", flush=True)

    while not _shutdown:
        job = supabase_client.fetch_pending_job(supabase)
        if job is None:
            time.sleep(POLL_INTERVAL_SECS)
            continue

        if not supabase_client.claim_job(supabase, job["id"]):
            # Lost the race (shouldn't happen with one worker, but cheap to check).
            continue

        print(f"\n--- picked up job {job['id']} ---", flush=True)
        pipeline.process_job(supabase, job)
        print(f"--- finished job {job['id']} ---\n", flush=True)

    print("processor exited cleanly.", flush=True)


if __name__ == "__main__":
    main()
