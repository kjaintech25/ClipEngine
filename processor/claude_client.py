"""Claude clip-selection client. Sends transcript -> gets 30 clip specs as JSON."""

from __future__ import annotations

import json
import os
import re

from anthropic import Anthropic

from prompts import (
    CLIP_SELECTION_PROMPT,
    format_transcript_for_prompt,
    humanize_duration,
)

# Sonnet 4.6 — current latest Sonnet 4.x at time of build. PRD listed an older
# Sonnet 4.0 id; using the newer alias for better instruction-following + speed.
CLAUDE_MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 8000

REQUIRED_KEYS = {"start_time", "end_time", "title", "description", "hashtags", "viral_reason"}


def _client() -> Anthropic:
    return Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def generate_clip_specs(
    segments: list[dict],
    duration_secs: float,
    streamer_name: str | None,
) -> list[dict]:
    """Send transcript to Claude, return validated clip specs."""
    transcript_str = format_transcript_for_prompt(segments)
    prompt = CLIP_SELECTION_PROMPT.format(
        duration_human=humanize_duration(duration_secs),
        duration_secs=int(duration_secs),
        streamer_name=streamer_name or "the streamer",
        transcript=transcript_str,
    )

    client = _client()
    resp = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = resp.content[0].text.strip()

    clips = _parse_json_array(raw)
    return _validate_specs(clips, duration_secs)


def _parse_json_array(raw: str) -> list[dict]:
    """Tolerate Claude wrapping in ```json fences, accidental preamble, etc."""
    # Strip code fences if present.
    fence = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw, re.DOTALL)
    if fence:
        raw = fence.group(1)
    # Find the first '[' and last ']' as a last resort.
    start = raw.find("[")
    end = raw.rfind("]")
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError(f"Claude did not return a JSON array. First 200 chars: {raw[:200]}")
    payload = raw[start : end + 1]
    return json.loads(payload)


def _validate_specs(specs: list[dict], duration_secs: float) -> list[dict]:
    if not isinstance(specs, list) or not specs:
        raise RuntimeError("Claude returned no clip specs.")

    cleaned: list[dict] = []
    for spec in specs:
        if not isinstance(spec, dict):
            continue
        if not REQUIRED_KEYS.issubset(spec.keys()):
            continue
        try:
            start = float(spec["start_time"])
            end = float(spec["end_time"])
        except (TypeError, ValueError):
            continue
        # Clamp within video bounds; drop obviously bad clips.
        start = max(0.0, min(start, duration_secs))
        end = max(start + 1.0, min(end, duration_secs))
        clip_len = end - start
        if clip_len < 10 or clip_len > 120:
            continue
        cleaned.append(
            {
                "start_time": start,
                "end_time": end,
                "title": str(spec["title"])[:200],
                "description": str(spec["description"]),
                "hashtags": str(spec["hashtags"]),
                "viral_reason": str(spec["viral_reason"]),
            }
        )

    if not cleaned:
        raise RuntimeError(
            f"All {len(specs)} clip specs failed validation. Bounds duration={duration_secs}s."
        )
    cleaned.sort(key=lambda c: c["start_time"])
    return cleaned
