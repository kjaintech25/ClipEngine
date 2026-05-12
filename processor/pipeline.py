"""Per-job orchestrator. Pulls a job through the 9-step pipeline."""

from __future__ import annotations

import shutil
import time
import traceback
from pathlib import Path

from supabase import Client

import claude_client
import ffmpeg_utils
import supabase_client
import whisper_client
import ytdlp_utils

TMP_BASE = Path("./tmp")
THUMBNAIL_OFFSET_SECS = 1.0


def log(job_id: str, step: str, status: str, **kwargs) -> None:
    parts = [f"[{job_id[:8]}]", f"step={step}", f"status={status}"]
    parts.extend(f"{k}={v}" for k, v in kwargs.items())
    print(" ".join(parts), flush=True)


def process_job(supabase: Client, job: dict) -> None:
    job_id: str = job["id"]
    project_id: str = job["project_id"]
    url: str = job["url"]
    work_dir = TMP_BASE / job_id

    try:
        # Step 1: claim (already done by caller via claim_job, but track here)
        log(job_id, "claim", "ok")

        # Step 2: download
        t0 = time.time()
        video_path, metadata = ytdlp_utils.download_video(url, work_dir)
        supabase_client.update_job(
            supabase,
            job_id,
            video_title=metadata["title"],
            duration_secs=int(metadata["duration"]),
        )
        log(job_id, "download", "ok", elapsed=f"{time.time() - t0:.1f}s", duration=int(metadata["duration"]))

        # Step 3: extract audio
        t0 = time.time()
        audio_path = ffmpeg_utils.extract_audio(video_path, work_dir / "audio.mp3")
        log(job_id, "extract_audio", "ok", elapsed=f"{time.time() - t0:.1f}s")

        # Step 4: transcribe
        t0 = time.time()
        segments = whisper_client.transcribe(audio_path, work_dir)
        log(job_id, "transcribe", "ok", elapsed=f"{time.time() - t0:.1f}s", segments=len(segments))
        if not segments:
            raise RuntimeError("Whisper returned zero segments.")

        # Step 5: Claude clip selection
        project = supabase_client.fetch_project(supabase, project_id) or {}
        streamer_name = project.get("streamer_name") or (project.get("creator") or {}).get("name")

        t0 = time.time()
        specs = claude_client.generate_clip_specs(
            segments=segments,
            duration_secs=metadata["duration"],
            streamer_name=streamer_name,
        )
        log(job_id, "analyze", "ok", elapsed=f"{time.time() - t0:.1f}s", clips=len(specs))

        # Step 6: cut + convert + upload + insert per clip
        for idx, spec in enumerate(specs):
            t0 = time.time()
            raw_clip = work_dir / "clips" / f"{idx:02d}_raw.mp4"
            vertical_clip = work_dir / "clips" / f"{idx:02d}.mp4"
            thumb = work_dir / "clips" / f"{idx:02d}.jpg"

            ffmpeg_utils.cut_clip(video_path, spec["start_time"], spec["end_time"], raw_clip)
            ffmpeg_utils.to_vertical_9_16_letterbox(raw_clip, vertical_clip)
            ffmpeg_utils.extract_thumbnail(vertical_clip, thumb, at_seconds=THUMBNAIL_OFFSET_SECS)

            video_url = supabase_client.upload_to_storage(
                supabase, vertical_clip, f"{job_id}/{idx:02d}.mp4", "video/mp4"
            )
            thumb_url = supabase_client.upload_to_storage(
                supabase, thumb, f"{job_id}/{idx:02d}.jpg", "image/jpeg"
            )

            supabase_client.insert_clip(
                supabase,
                job_id=job_id,
                project_id=project_id,
                video_url=video_url,
                thumbnail_url=thumb_url,
                start_time=spec["start_time"],
                end_time=spec["end_time"],
                duration_secs=spec["end_time"] - spec["start_time"],
                title=spec["title"],
                description=spec["description"],
                hashtags=spec["hashtags"],
                viral_reason=spec["viral_reason"],
                approved=False,
            )

            # Free disk: drop the per-clip raw + final files now that they're uploaded.
            raw_clip.unlink(missing_ok=True)
            vertical_clip.unlink(missing_ok=True)
            thumb.unlink(missing_ok=True)

            log(job_id, "cut", "ok", idx=idx, elapsed=f"{time.time() - t0:.1f}s")

        # Step 7: mark done
        supabase_client.update_job(supabase, job_id, status="done")
        log(job_id, "done", "ok", total_clips=len(specs))

    except Exception as exc:
        tb = traceback.format_exc()
        err_msg = f"{type(exc).__name__}: {exc}"
        # Truncate so it fits comfortably in the DB column / UI banner.
        truncated = err_msg[:500]
        supabase_client.update_job(supabase, job_id, status="failed", error_message=truncated)
        log(job_id, "fail", "err", error=type(exc).__name__)
        print(tb, flush=True)

    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
