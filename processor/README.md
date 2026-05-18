# ClipEngine Processor

The background worker. Two jobs:
1. **Clip generation** — polls for pending jobs, downloads each video, transcribes it, asks Claude to pick 30 viral moments, cuts the clips, converts to 9:16, uploads to Supabase.
2. **Publishing** — polls for due posts (from the Post Manager screen) and uploads them to YouTube Shorts. *Dormant until you do the YouTube setup below.*

Runs locally on your Mac. The Next.js frontend never sees this — it just watches Supabase and the UI updates live.

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

When no jobs are pending, the processor checks for **due posts** (status `queued`, or `scheduled` with `scheduled_for` in the past), downloads the clip, and uploads it to YouTube. If YouTube isn't configured it just logs `youtube not configured — skipping` and leaves the posts untouched.

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

## YouTube setup

Posting to YouTube is **optional and dormant** until you do this. The processor runs clip generation fine without it. Do this once when you're ready to auto-post (planned for the start of Sprint 3).

1. Go to https://console.cloud.google.com/ and create a new project (call it "ClipEngine").
2. **Enable the API:** APIs & Services → Library → search "YouTube Data API v3" → Enable.
3. **OAuth consent screen:** APIs & Services → OAuth consent screen → choose "External" → fill in app name "ClipEngine" + your email → Save. Under "Test users" add your own Google account (the one that owns your YouTube channel).
4. **Create credentials:** APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type **"Desktop app"** → Create. Copy the **Client ID** and **Client secret**.
5. Paste those into `.env` as `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`.
6. Run the one-time auth helper:
   ```bash
   source .venv/bin/activate
   python youtube_auth.py
   ```
   A browser opens — sign in with your channel's Google account and approve. The script prints a refresh token.
7. Paste that into `.env` as `YOUTUBE_REFRESH_TOKEN`.
8. Restart `python processor.py` — it now prints `youtube posting: enabled` and will publish queued posts.

> Note: while your OAuth consent screen is in "Testing" mode, the refresh token expires after 7 days. To make it permanent, click "Publish app" on the OAuth consent screen (no Google review needed for a personal `youtube.upload` scope used only by you).

## Costs (posting)

YouTube Data API uploads are free, but each `videos.insert` costs **1,600 quota units** against a default daily budget of 10,000 — so ~6 uploads/day out of the box. Request a quota increase in Google Cloud if you need more.

## Not yet built

- TikTok + Instagram posting (their APIs need weeks of app approval — Sprint 3)
- Concurrency / multiple workers (single worker is fine for one operator)
- Smart 9:16 crop with face/object tracking (current letterbox preserves the full frame)
- Hosted version (Railway etc.) — TBD in Sprint 3
