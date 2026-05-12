"""ffmpeg wrappers via subprocess. Requires `brew install ffmpeg`."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

# 9:16 target dimensions (1080x1920 is the YouTube Shorts / TikTok standard).
VERTICAL_W = 1080
VERTICAL_H = 1920


def _run(args: list[str]) -> None:
    """Run ffmpeg, raise with stderr on failure."""
    res = subprocess.run(args, capture_output=True, text=True)
    if res.returncode != 0:
        # Truncate stderr to keep error_message column readable
        err = res.stderr.strip()[-500:] if res.stderr else "(no stderr)"
        raise RuntimeError(f"ffmpeg failed: {err}")


def check_ffmpeg_installed() -> None:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError(
            "ffmpeg is not on PATH. Install with `brew install ffmpeg` and retry."
        )


def extract_audio(video_path: Path, output_path: Path) -> Path:
    """Extract mono 16kHz mp3 for Whisper API."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    _run(
        [
            "ffmpeg", "-y", "-i", str(video_path),
            "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k",
            "-loglevel", "error",
            str(output_path),
        ]
    )
    return output_path


def split_audio(audio_path: Path, chunk_dir: Path, segment_seconds: int = 1800) -> list[Path]:
    """Split audio into chunks ≤ ~14MB (30 min @ 64kbps mono). Returns chunk paths in order."""
    chunk_dir.mkdir(parents=True, exist_ok=True)
    pattern = str(chunk_dir / "chunk_%03d.mp3")
    _run(
        [
            "ffmpeg", "-y", "-i", str(audio_path),
            "-f", "segment", "-segment_time", str(segment_seconds),
            "-c", "copy",
            "-loglevel", "error",
            pattern,
        ]
    )
    chunks = sorted(chunk_dir.glob("chunk_*.mp3"))
    return chunks


def cut_clip(video_path: Path, start_time: float, end_time: float, output_path: Path) -> Path:
    """Frame-accurate cut. Re-encodes for accuracy and to normalize across sources."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    duration = max(end_time - start_time, 0.1)
    _run(
        [
            "ffmpeg", "-y",
            "-ss", f"{start_time:.3f}",
            "-i", str(video_path),
            "-t", f"{duration:.3f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            "-loglevel", "error",
            str(output_path),
        ]
    )
    return output_path


def to_vertical_9_16_letterbox(input_path: Path, output_path: Path) -> Path:
    """Scale + pad source to 1080x1920 9:16 with black bars. Preserves full frame."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    # Scale longest side to fit inside 1080x1920, then pad to exact target.
    vf = (
        f"scale={VERTICAL_W}:{VERTICAL_H}:force_original_aspect_ratio=decrease,"
        f"pad={VERTICAL_W}:{VERTICAL_H}:(ow-iw)/2:(oh-ih)/2:black,"
        "setsar=1"
    )
    _run(
        [
            "ffmpeg", "-y", "-i", str(input_path),
            "-vf", vf,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
            "-c:a", "copy",
            "-movflags", "+faststart",
            "-loglevel", "error",
            str(output_path),
        ]
    )
    return output_path


def extract_thumbnail(video_path: Path, output_path: Path, at_seconds: float = 1.0) -> Path:
    """Grab a still at `at_seconds` into the clip."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    _run(
        [
            "ffmpeg", "-y",
            "-ss", f"{at_seconds:.3f}",
            "-i", str(video_path),
            "-frames:v", "1",
            "-q:v", "3",
            "-loglevel", "error",
            str(output_path),
        ]
    )
    return output_path
