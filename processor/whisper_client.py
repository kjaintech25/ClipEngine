"""OpenAI Whisper API wrapper with audio chunking for >25MB files."""

from __future__ import annotations

import os
from pathlib import Path

from openai import OpenAI

from ffmpeg_utils import split_audio

WHISPER_MODEL = "whisper-1"
# Whisper API limit is 25MB. We chunk by time, ~14MB safe at 64kbps mono mp3 (30 min).
CHUNK_SECONDS = 1800


def _client() -> OpenAI:
    return OpenAI(api_key=os.environ["OPENAI_API_KEY"])


def transcribe(audio_path: Path, tmp_dir: Path) -> list[dict]:
    """Return list of segments [{start, end, text}, ...] with absolute timestamps."""
    client = _client()
    size_mb = audio_path.stat().st_size / (1024 * 1024)

    if size_mb <= 24:
        return _transcribe_one(client, audio_path, time_offset=0.0)

    # Split + transcribe each chunk, then stitch with offsets.
    chunks = split_audio(audio_path, tmp_dir / "chunks", segment_seconds=CHUNK_SECONDS)
    all_segments: list[dict] = []
    for idx, chunk_path in enumerate(chunks):
        offset = idx * CHUNK_SECONDS
        segments = _transcribe_one(client, chunk_path, time_offset=float(offset))
        all_segments.extend(segments)
    return all_segments


def _transcribe_one(client: OpenAI, audio_path: Path, time_offset: float) -> list[dict]:
    with open(audio_path, "rb") as f:
        resp = client.audio.transcriptions.create(
            model=WHISPER_MODEL,
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )
    segments = getattr(resp, "segments", None) or []
    out: list[dict] = []
    for seg in segments:
        # Each segment is a pydantic model — pull start/end/text defensively.
        start = float(getattr(seg, "start", 0.0)) + time_offset
        end = float(getattr(seg, "end", 0.0)) + time_offset
        text = str(getattr(seg, "text", "")).strip()
        if text:
            out.append({"start": start, "end": end, "text": text})
    return out
