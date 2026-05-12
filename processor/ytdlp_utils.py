"""yt-dlp wrappers for download + metadata."""

from __future__ import annotations

from pathlib import Path

import yt_dlp


def download_video(url: str, dest_dir: Path) -> tuple[Path, dict]:
    """Download the video; return (local_path, metadata_dict)."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    outtmpl = str(dest_dir / "video.%(ext)s")

    ydl_opts = {
        # Prefer mp4 at <=1080p to keep file sizes sane and ffmpeg processing fast.
        "format": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
        "outtmpl": outtmpl,
        "merge_output_format": "mp4",
        "quiet": True,
        "noprogress": True,
        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        local_path = Path(ydl.prepare_filename(info)).with_suffix(".mp4")

    metadata = {
        "title": info.get("title") or "Untitled",
        "duration": float(info.get("duration") or 0.0),
        "thumbnail": info.get("thumbnail"),
        "uploader": info.get("uploader"),
        "webpage_url": info.get("webpage_url", url),
    }
    return local_path, metadata
