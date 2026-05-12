# ClipEngine Processor

The background worker that polls Supabase for pending jobs, downloads each video, transcribes it, asks Claude to pick 30 viral moments, cuts the clips, converts to 9:16, and uploads everything back to Supabase.

Runs locally on your Mac. The Next.js frontend never sees this — it just watches Supabase and the UI updates live as clips appear.

## One-time setup

```bash
# 1. ffmpeg (you only have to do this once on your machine)
brew install ffmpeg

# 2. Python deps
cd processor
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Env vars
cp .env.example .env
# Edit .env — fill in these 3 keys:
#   SUPABASE_SERVICE_ROLE_KEY  → https://supabase.com/dashboard/project/xqcnbpiexojncxicrtji/settings/api-keys
#                                Copy "service_role" — NOT "anon"
#   ANTHROPIC_API_KEY          → https://console.anthropic.com/settings/keys
#   OPENAI_API_KEY             → https://platform.openai.com/api-keys
```

## Run it

```bash
cd processor
source .venv/bin/activate
python processor.py
```

You'll see `clipengine processor started. polling every 5s.` Leave it running in a Terminal tab. Queue a job in the UI; the processor picks it up within 5 seconds.

`Ctrl+C` once to stop gracefully (finishes current job). Twice to force-quit.

## How the pipeline works

For each job:

1. **claim** — atomic flip `pending` → `processing`
2. **download** — `yt-dlp` → `tmp/{job_id}/video.mp4` (capped at 1080p)
3. **extract_audio** — `ffmpeg` → mono 16kHz mp3
4. **transcribe** — OpenAI Whisper API (chunks >25MB audio into 30-min pieces)
5. **analyze** — Claude Sonnet 4.6 picks ~30 viral moments with title/description/hashtags/why-viral
6. **cut** — for each spec: ffmpeg cut → 9:16 letterbox → thumbnail → Supabase Storage upload → DB row
7. **done** — flip `processing` → `done`. The UI sees this via realtime instantly.

## Logs

Structured one-liner per step:
```
[1a5cc472] step=download status=ok elapsed=42s duration=4283
[1a5cc472] step=analyze status=ok elapsed=18s clips=30
[1a5cc472] step=cut status=ok idx=0 elapsed=5.4s
...
```

## Costs (rough)

Per 1-hour stream:
- OpenAI Whisper API: ~$0.36
- Claude Sonnet 4.6 (transcript ~20KB in, JSON ~10KB out): ~$0.10
- **Total: ~$0.50 per video processed**

At 5 streamers × 4 videos/month = 20 videos/month ≈ **$10/month** in API costs.

## Failure modes

If any step fails, the job flips to `failed` and the truncated error appears in the UI banner. Hit the "Retry" button on the clips viewer to flip it back to `pending` and the processor will try again.

Common errors:
- `ffmpeg failed: ...` — Usually a corrupt source video or unsupported codec. Try a different URL.
- `Whisper returned zero segments` — Audio is silent or extraction failed. Check the video has audio.
- `All N clip specs failed validation` — Claude returned junk; usually a transient model issue. Retry.
- `403 Unauthorized` / `Invalid JWT` — Service role key in `.env` is wrong. Re-copy from Supabase dashboard.

## Not yet built

- Concurrency / multiple workers (single worker is fine for one operator)
- Smart 9:16 crop with face/object tracking (current letterbox preserves the full frame)
- Hosted version (Railway etc.) — TBD in Sprint 3
