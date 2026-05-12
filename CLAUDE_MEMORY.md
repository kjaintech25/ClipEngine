# ClipEngine — Claude Memory

Last updated: 2026-05-12 (Sprint 1 — Python processor)

## Status
Frontend + schema + Python processor scaffolded. Processor imports cleanly + boots locally. Still pending: Kush adds 3 API keys to `processor/.env`, runs his first real job.

## Sprint plan
1. **Sprint 1 (this one)** — Python processor MVP. ← SHIPPED
2. Sprint 2 — Auto-post (V4) + creator dashboard at `/creators/[id]`.
3. Sprint 3 — Scout (V3) + Analytics (V5) + Vercel production deploy.

## Repo / infra
- Repo: https://github.com/kjaintech25/ClipEngine
- Path: `/Users/kushjain/Desktop/voiding szn 1/ClipEngine`
- Supabase project: `ClipEngine` · id `xqcnbpiexojncxicrtji` · region `us-east-1` · org `KJ VOID` (`dfbjmkwnayezgontnxea`)
- Supabase URL: `https://xqcnbpiexojncxicrtji.supabase.co`
- Storage bucket: `clips` (public read)
- No Vercel deploy yet — local dev only

## Stack
Next.js 14 App Router + TS + Tailwind + Supabase JS. No Anthropic SDK in this repo — Claude calls happen in the separate Python processor.

## Non-obvious things
- **RLS is disabled** on all six tables (single-user app, anon key has full r/w). Don't add policies unless this changes.
- **Server-side Supabase client** uses `cache: "no-store"` on its global `fetch` (see `lib/supabase/server.ts`). Next.js's default fetch cache returns stale empty arrays on SSR otherwise.
- **`streamers` → `creators`**: PRD v1.0 named the table `streamers` for the V3 scout flow, but the 0002 migration renamed it to `creators` because it's now the canonical creator tag for projects too. PRD will be updated to v1.1 next time it's touched.
- **`projects.creator_id`** is nullable + auto-set during the New Project modal flow. URL parsing in `lib/url.ts` extracts the streamer name + channel_url, then we upsert into `creators` (unique on `channel_url`) and link.
- **lucide-react 1.14.0** is the installed version. No `Youtube` or `Twitch` brand icons — use `MonitorPlay` / `Tv` instead. Also no `LucideIcon` type export — use `ElementType` from React.

## Realtime topics
- `jobs:{projectId}` — status badges on the project detail page
- `job:{jobId}` — the single-job status banner on the clips viewer
- `clips:{jobId}` — live clip grid as the processor inserts rows

## File map (the load-bearing ones)
- `app/page.tsx` + `components/ProjectsHome.tsx` — most polished screen
- `components/NewProjectModal.tsx` — creator upsert lives here
- `components/CreatorChip.tsx` — used on ProjectCard + project detail
- `lib/supabase/server.ts` + `client.ts` — singleton clients
- `lib/hooks/use{Jobs,JobStatus,Clips}Realtime.ts` — three realtime hooks
- `supabase/migrations/000{1,2}*.sql` — schema source of truth

## Processor (Sprint 1)
- Code lives in `processor/` subdir of this repo.
- Stack: yt-dlp + OpenAI Whisper API + Claude Sonnet 4.6 + ffmpeg + supabase-py.
- 9:16 conversion = **letterbox** (black bars). Smart-crop with face tracking deferred to Sprint 3+.
- Claude model: `claude-sonnet-4-6` (PRD said `claude-sonnet-4-20250514` — that's a Sonnet 4.0 ID. Upgraded to current Sonnet 4.6).
- Hosting: local Mac only for Sprint 1. Run with `cd processor && source .venv/bin/activate && python processor.py`. Revisit Railway in Sprint 3.
- `.env` needs 3 keys filled in by Kush (service-role, Anthropic, OpenAI). See `processor/.env.example` for links.
- Service-role key location: https://supabase.com/dashboard/project/xqcnbpiexojncxicrtji/settings/api-keys (NOT the anon key — different one).
- Cost estimate: ~$0.50/video processed (Whisper $0.36 + Claude $0.10ish). 20 videos/month ≈ $10/month.

## Open items / next moves
1. Kush fills in `processor/.env` and runs his first real job to validate the full pipeline. ← Sprint 1 acceptance.
2. Decide processor host: local Mac (current) vs Railway.app. Open question in PRD §9. Revisit in Sprint 3.
3. Sprint 2 — auto-post integration + creator dashboard at `/creators/[id]`. Start TikTok + Instagram API approval flows on day 1 (they take weeks).

## Useful SQL snippets
```sql
-- Reset everything but keep the schema
truncate analytics_snapshots, posts, clips, jobs, projects, creators restart identity;

-- See projects + their creators
select p.name, p.streamer_name, c.name as creator_name, c.platform
  from projects p left join creators c on c.id = p.creator_id;

-- Manually re-queue a failed job (or use the Retry button in the UI)
update jobs set status='pending', error_message=null where id='...';
```
