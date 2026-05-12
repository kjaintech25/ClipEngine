# ClipEngine — Product Requirements Document
**Version:** 1.0  
**Status:** Active  
**Owner:** Kush  
**Last Updated:** May 2026

---

## 1. Product Summary

ClipEngine is a personal creator monetization platform that automates the full lifecycle of clip-based content — from discovering up-and-coming streamers, to processing their videos into viral short clips, to publishing across social platforms and tracking revenue analytics. Built for one operator (you), running at scale across multiple streamers simultaneously.

**The business model it enables:**
- Find streamers early who will pay for clips
- Auto-clip their content into 30 viral candidates per video
- Auto-post the best clips to YouTube Shorts, TikTok, Instagram Reels
- Track views and estimated revenue across all platforms in one dashboard
- Target: 5 streamers × 1M views/month = ~$5,000/month, mostly automated

---

## 2. Feature Roadmap

| Phase | Feature | Priority | Status |
|-------|---------|----------|--------|
| MVP | Video processing + clip review + SEO | P0 | 🔴 Not started |
| V2 | Projects system (one project per streamer) | P0 | 🔴 Not started |
| V3 | Streamer discovery / scouting tool | P1 | 🔴 Not started |
| V4 | Auto-post to social media | P1 | 🔴 Not started |
| V5 | Cross-platform analytics dashboard | P2 | 🔴 Not started |

> **Build order recommendation:** MVP → V2 → V4 → V3 → V5  
> Auto-posting (V4) is prioritized over discovery (V3) because it generates revenue immediately.

---

## 3. Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend | Next.js 14 (App Router) | Web UI |
| Styling | Tailwind CSS | Design system |
| Database | Supabase (Postgres) | All structured data |
| File Storage | Supabase Storage | Clip .mp4 files |
| Realtime | Supabase Realtime | Live job status updates |
| AI (analysis) | Claude API (claude-sonnet-4-20250514) | Clip selection, SEO, scoring |
| AI (transcription) | OpenAI Whisper (local) | Speech → timestamped text |
| Video download | yt-dlp (Python) | YouTube / Twitch download |
| Video cutting | ffmpeg (Python) | Clip extraction |
| Processor | Python script (runs locally or Railway.app) | Background job runner |
| Hosting | Vercel | Frontend deployment |
| Social APIs | YouTube Data API, TikTok API, Instagram Graph API | V4 posting |
| Discovery APIs | YouTube Data API, Twitch Helix API | V3 scouting |

---

## 4. Full Database Schema

```sql
-- PROJECTS: one per streamer you work with
projects
  id            uuid PRIMARY KEY
  name          text              -- auto-generated: "Ludwig — May 2026"
  streamer_name text
  platform      text              -- "youtube" | "twitch" | "both"
  channel_url   text
  thumbnail_url text
  status        text              -- "active" | "archived"
  created_at    timestamp

-- JOBS: one per video processed
jobs
  id            uuid PRIMARY KEY
  project_id    uuid REFERENCES projects(id)
  url           text              -- original YouTube/Twitch URL
  video_title   text              -- pulled from yt-dlp metadata
  duration_secs int
  status        text              -- "pending" | "processing" | "done" | "failed"
  error_message text              -- populated if failed
  created_at    timestamp

-- CLIPS: individual clips from a job
clips
  id            uuid PRIMARY KEY
  job_id        uuid REFERENCES jobs(id)
  project_id    uuid REFERENCES projects(id)
  video_url     text              -- Supabase Storage URL for .mp4
  thumbnail_url text              -- auto-generated still frame
  start_time    float             -- seconds into original video
  end_time      float
  duration_secs float
  title         text              -- AI-generated
  description   text              -- AI-generated
  hashtags      text              -- AI-generated, comma separated
  viral_reason  text              -- Claude's reasoning for picking this moment
  approved      boolean DEFAULT false  -- did you approve it for posting?
  created_at    timestamp

-- POSTS: where each clip was published
posts
  id            uuid PRIMARY KEY
  clip_id       uuid REFERENCES clips(id)
  platform      text              -- "youtube_shorts" | "tiktok" | "instagram_reels"
  platform_post_id text           -- ID returned by the platform API after posting
  status        text              -- "scheduled" | "posted" | "failed"
  posted_at     timestamp
  scheduled_for timestamp
  title_used    text              -- title at time of posting
  description_used text

-- ANALYTICS_SNAPSHOTS: daily performance data per post
analytics_snapshots
  id            uuid PRIMARY KEY
  post_id       uuid REFERENCES posts(id)
  snapshot_date date
  views         int
  likes         int
  shares        int
  comments      int
  watch_time_secs int
  estimated_revenue_usd float    -- calculated from platform RPM estimates
  pulled_at     timestamp

-- STREAMERS: discovered via scout feature (V3)
streamers
  id            uuid PRIMARY KEY
  name          text
  platform      text              -- "youtube" | "twitch"
  channel_url   text
  channel_id    text              -- platform's internal ID
  subscriber_count int
  avg_viewers   int
  monthly_growth_pct float       -- % follower/sub growth last 30 days
  clip_program_detected boolean  -- does this streamer have a clip program?
  opportunity_score float        -- Claude's 0–100 score
  score_reason  text             -- why Claude scored them this way
  added_to_project_id uuid       -- if converted to a project
  discovered_at timestamp
```

---

## 5. Screens & Features

---

### MVP + V2: Core Clipping Platform

---

#### Screen 1 — Projects Home `/` 🔵 Claude Code
**What the user sees:**
- Header with ClipEngine logo
- "New Project" button — opens a modal to paste a URL and optionally name the project
- Grid of project cards, each showing: streamer name, thumbnail, clip count, last processed date, status badge
- Clicking a project card → goes to Project Detail

**Key actions:**
- Create new project from URL
- Archive a project
- See at-a-glance stats per project

---

#### Screen 2 — Project Detail `/projects/[id]` 🟢 OpenCode
**What the user sees:**
- Project name + streamer info at top
- "Process New Video" button → opens URL input
- List of past jobs with status (Pending / Processing / Done / Failed)
- Tabs: All Clips | Approved | Posted

**Key actions:**
- Submit new video URL for processing
- Navigate to a job's clips
- Filter clips by approval status

---

#### Screen 3 — Job / Clips Viewer `/projects/[id]/jobs/[jobId]` 🟢 OpenCode
**What the user sees:**
- Original video title + URL at top
- Processing status banner (live-updating via Supabase Realtime)
- Grid of clip cards — each showing:
  - Inline video player
  - AI title (editable)
  - Description (editable)
  - Hashtags (editable)
  - "Why viral" reason from Claude
  - Approve toggle
  - Download button
  - Post button (V4)

**Key actions:**
- Approve/reject clips
- Edit AI-generated metadata before posting
- Bulk approve all
- Download individual clips

---

### V3: Streamer Discovery

---

#### Screen 4 — Scout `/scout` 🔵 Claude Code
**What the user sees:**
- Search bar: "Search by niche, game, or streamer name"
- Platform filter toggle: YouTube | Twitch | Both
- Results list of streamers with:
  - Channel name + avatar
  - Subscriber/follower count
  - Monthly growth % (color coded: green if >10%)
  - Avg viewership
  - Opportunity Score (0–100, Claude-generated)
  - "Why" tooltip showing Claude's reasoning
  - Clip program detected badge
  - "Add to Projects" button

**How scoring works:**
- Pull channel data from YouTube Data API / Twitch Helix API
- Send to Claude: "Score this channel 0-100 for clip monetization opportunity based on: growth rate, engagement rate, content type, whether they likely have or would start a clip program"
- Claude returns score + 1-sentence reason

**Key actions:**
- Search by niche
- Sort by opportunity score, growth rate, subscriber count
- Add discovered streamer directly to a new project
- Save to a watchlist

---

### V4: Auto-Post to Social Media

---

#### Screen 5 — Post Manager `/posts` 🔵 Claude Code
**What the user sees:**
- Queue of approved clips ready to post
- Per clip: platform selector (YouTube Shorts / TikTok / Instagram Reels), schedule time picker, editable title/description
- "Post Now" and "Schedule" buttons
- Posted clips section with platform badges and live view counts

**Platform rollout order:**
1. YouTube Shorts (build first — easiest API, highest revenue)
2. TikTok (build second)
3. Instagram Reels (build last — Meta API approval is slowest)

**How it works technically:**
- YouTube: OAuth 2.0 → YouTube Data API v3 `videos.insert`
- TikTok: TikTok Content Posting API (requires app approval)
- Instagram: Instagram Graph API (requires Facebook Business account)

**Format requirements handled automatically:**
- Aspect ratio: 9:16 vertical (ffmpeg handles this during clip cutting)
- Max length: 60s YouTube Shorts, 10m TikTok, 90s Instagram Reels
- File size limits enforced before upload

---

### V5: Analytics Dashboard

---

#### Screen 6 — Analytics `/analytics` 🔵 Claude Code
**What the user sees:**
- Top stats row: Total Views (all time), Est. Revenue (this month), Active Posts, Best Performing Clip
- Revenue chart: line graph, views and estimated revenue over time
- Breakdown by platform: YouTube vs TikTok vs Instagram
- Breakdown by project: which streamer is making you the most money
- Clips table: sortable by views, revenue, engagement rate
- "Refresh Analytics" button (pulls fresh data from all APIs)

**Revenue estimation logic:**
- YouTube Shorts RPM: ~$0.03–0.07 per 1,000 views (conservative estimate)
- TikTok: ~$0.02–0.04 per 1,000 views
- Instagram: harder to monetize directly — track reach only for now

**Data refresh:**
- Auto-pull analytics daily via a scheduled job (cron)
- Manual refresh available on demand

---

## 6. Python Processor Script

The processor runs on your local machine (or Railway.app for always-on). It polls Supabase for pending jobs and handles all the heavy lifting.

**Flow:**
```
Poll Supabase for jobs WHERE status = 'pending'
  → Update status to 'processing'
  → yt-dlp: download video to /tmp
  → Whisper: transcribe audio → timestamped transcript
  → Claude API: send transcript, get back 30 clip timestamps + metadata
  → ffmpeg: cut 30 clips from video
  → ffmpeg: convert each clip to 9:16 vertical (crop or pad)
  → Supabase Storage: upload all 30 .mp4 files
  → Supabase DB: insert 30 rows into clips table
  → Update job status to 'done'
  → Delete local tmp files
```

**Claude prompt used for clip selection:**
```
You are a viral short-form content expert. Below is a timestamped 
transcript of a [DURATION] video from [STREAMER_NAME].

Identify the 30 best moments to clip for YouTube Shorts / TikTok. 
Prioritize: shocking stats, strong opinions, funny moments, 
emotional peaks, controversial takes, and clear narrative arcs 
that work in 30–90 seconds.

For each clip return a JSON array with:
- start_time (seconds)
- end_time (seconds) 
- title (hook-style, under 60 chars, no clickbait)
- description (2-3 sentences, SEO-optimized)
- hashtags (8-10 relevant hashtags)
- viral_reason (1 sentence: why this specific moment works)

Return only valid JSON. No preamble.

TRANSCRIPT:
[transcript]
```

---

## 7. Cursor/Windsurf Starter Prompt

```
Build me a Next.js 14 app called ClipEngine using TypeScript, 
Tailwind CSS, and Supabase. This is a personal creator monetization 
platform — no auth needed, just for one user (me).

STACK:
- Next.js 14 App Router
- Supabase (Postgres database + Storage for .mp4 files + Realtime)
- Tailwind CSS
- Vercel deployment
- Claude API (claude-sonnet-4-20250514) for AI features

DESIGN SYSTEM:
- Dark theme. Background: #0A0A0A, cards: #141414
- Accent: #E8FF47 (electric yellow-green) for CTAs and active states
- Text: #F0F0F0, muted text: #555555
- Font: Syne for headers (import from Google Fonts), IBM Plex Mono for body
- Sharp corners (border-radius: 4px max), brutalist professional tool aesthetic
- No gradients, no softness — this should feel like a pro video editor

DATABASE TABLES (create these in Supabase):

projects: id (uuid PK), name (text), streamer_name (text), platform (text), 
channel_url (text), thumbnail_url (text), status (text), created_at (timestamp)

jobs: id (uuid PK), project_id (uuid FK → projects), url (text), 
video_title (text), duration_secs (int), status (text), 
error_message (text), created_at (timestamp)

clips: id (uuid PK), job_id (uuid FK → jobs), project_id (uuid FK → projects),
video_url (text), thumbnail_url (text), start_time (float), end_time (float),
duration_secs (float), title (text), description (text), hashtags (text),
viral_reason (text), approved (boolean default false), created_at (timestamp)

posts: id (uuid PK), clip_id (uuid FK → clips), platform (text),
platform_post_id (text), status (text), posted_at (timestamp),
scheduled_for (timestamp), title_used (text), description_used (text)

analytics_snapshots: id (uuid PK), post_id (uuid FK → posts),
snapshot_date (date), views (int), likes (int), shares (int),
watch_time_secs (int), estimated_revenue_usd (float), pulled_at (timestamp)

streamers: id (uuid PK), name (text), platform (text), channel_url (text),
channel_id (text), subscriber_count (int), avg_viewers (int),
monthly_growth_pct (float), clip_program_detected (boolean),
opportunity_score (float), score_reason (text),
added_to_project_id (uuid), discovered_at (timestamp)

STORAGE: Create a Supabase Storage bucket called "clips" (public read)

SCREENS TO BUILD (in this order):

1. Projects Home (/) 
   - Grid of project cards with streamer name, thumbnail, clip count, status badge
   - "New Project" button that opens a modal with: URL input + optional project name
   - Submitting creates a row in projects table and a row in jobs table
   
2. Project Detail (/projects/[id])
   - Project header with streamer info
   - "Process New Video" button (URL input → new job)
   - List of jobs with live status badges using Supabase Realtime
   - Each job card links to the clips viewer

3. Job / Clips Viewer (/projects/[id]/jobs/[jobId])
   - Processing status banner (live via Supabase Realtime — updates without refresh)
   - Grid of clip cards, each with:
     - HTML5 video player
     - Editable title field
     - Editable description field  
     - Editable hashtags field
     - "Why viral" text from Claude (read-only)
     - Approve toggle (updates approved column in Supabase)
     - Download button
   - Bulk approve all button

4. Scout (/scout) — placeholder page is fine for now, just the shell

5. Post Manager (/posts) — placeholder page, just the shell

6. Analytics (/analytics) — placeholder page, just the shell

NAVIGATION:
Sidebar with icons + labels: Projects, Scout, Posts, Analytics

START WITH:
1. Supabase client setup in lib/supabase.ts
2. The full database schema as a SQL migration file
3. Projects home page — fully functional with create project modal
4. Supabase Realtime hook for job status updates
5. Basic routing to project detail and clips viewer pages

Make the homepage the most polished screen first. The clip cards grid 
should feel like a professional tool — dense, information-rich, dark.
```

---

## 8. Build Log

| Date | Version | What was built |
|------|---------|---------------|
| May 2026 | v1.0 | PRD created, full schema designed, Cursor prompt written |

---

## 9. Open Questions

- [ ] Railway.app vs local machine for processor — decide before V2
- [ ] TikTok API approval process — start this early, takes time
- [ ] Instagram Graph API business account setup — start this early
- [ ] Revenue share model if this becomes a SaaS product later
- [ ] Clip aspect ratio handling — auto-crop to 9:16 or letterbox?
