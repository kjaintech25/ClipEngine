# ClipEngine — Claude Memory

Last updated: 2026-05-12 (initial scaffold)

## Status
MVP frontend scaffolded. Schema live. Python processor not yet built — this is the next major work item.

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

## Open items / next moves
1. Build the Python processor (PRD §6) — polls `jobs where status='pending'`, runs yt-dlp + Whisper + Claude + ffmpeg, uploads to `clips/` bucket, inserts into `clips` table.
2. Decide processor host: local machine vs Railway.app (open question in PRD §9).
3. Build the creator dashboard at `/creators/[id]` so the `CreatorChip` becomes clickable.
4. Clip aspect ratio: auto-crop to 9:16 or letterbox (open question in PRD §9).

## Useful SQL snippets
```sql
-- Reset everything but keep the schema
truncate analytics_snapshots, posts, clips, jobs, projects, creators restart identity;

-- See projects + their creators
select p.name, p.streamer_name, c.name as creator_name, c.platform
  from projects p left join creators c on c.id = p.creator_id;
```
