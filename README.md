# ClipEngine

Personal creator monetization platform. One operator, many streamers — process long-form streams into 30 viral short clips per video, review and approve, push to YouTube Shorts / TikTok / Reels, track revenue.

This repo is the **frontend + database**. The Python processor (yt-dlp + Whisper + Claude + ffmpeg) lives separately and polls the same Supabase project.

See [`ClipEngine_PRD_v1.0.md`](./ClipEngine_PRD_v1.0.md) for the full product spec.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind**
- **Supabase** — Postgres, Storage (`clips` bucket), Realtime
- **Claude API** (`claude-sonnet-4-20250514`) — wired from the Python processor, not from the Next.js app
- Hosted on **Vercel**, intended for one user (no auth, RLS disabled)

## Design

Brutalist pro-tool dark theme. `#0A0A0A` background, `#141414` cards, `#E8FF47` accent, Syne for headers, IBM Plex Mono for body. 4px corners max, no gradients.

## Database

Six tables, all in [`supabase/migrations/`](./supabase/migrations/):

| Table | Purpose |
|---|---|
| `creators` | Canonical YouTuber / streamer entity. Tag for projects + clips. |
| `projects` | One per creator-engagement. Has `creator_id` FK. |
| `jobs` | One per video processed. |
| `clips` | Individual short clips produced by the processor. |
| `posts` | Where a clip was published (V4). |
| `analytics_snapshots` | Daily perf data per post (V5). |

Migrations:
- `0001_init.sql` — full schema, RLS disabled, `clips` Storage bucket, realtime on `jobs` + `clips`
- `0002_creators_and_project_tag.sql` — renamed `streamers` → `creators`, added `projects.creator_id`, unique constraint on `channel_url` for upserts

## Local development

```bash
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
npm run dev                  # http://localhost:3000
```

## Routes

| Route | What it does |
|---|---|
| `/` | Projects home — dashboard stats, grid of project cards, New Project modal |
| `/projects/[id]` | Project detail — creator chip, queue new video, live jobs list |
| `/projects/[id]/jobs/[jobId]` | Clips viewer — live status banner, editable clip grid, bulk approve |
| `/scout` | Placeholder (V3 — streamer discovery) |
| `/posts` | Placeholder (V4 — auto-post to social) |
| `/analytics` | Placeholder (V5 — revenue dashboard) |

## How the creator tag works

When you paste a streamer URL into **New Project**, `lib/url.ts` parses out the platform + channel handle + channel URL. The modal then `upsert`s into `creators` (channel_url is the unique key), so multiple projects for the same streamer all link back to one canonical creator row. The home page stat "Creators tagged" counts distinct creators across all your active projects.

The creator dashboard (`/creators/[id]`) is deferred — once built, the `CreatorChip` becomes clickable.

## What's not in this repo

- The Python processor (yt-dlp → Whisper → Claude → ffmpeg → Supabase Storage)
- Anthropic SDK — the Next.js app only reads + writes Supabase; all Claude calls happen processor-side
- Auth — single-user app, RLS disabled on all tables, anon key has full r/w

## Build log

| Date | Notes |
|---|---|
| 2026-05-12 | Initial scaffold + Supabase project (`xqcnbpiexojncxicrtji`) + creator tagging |
