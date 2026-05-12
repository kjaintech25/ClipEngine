create extension if not exists "pgcrypto";

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text,
  streamer_name text,
  platform text,
  channel_url text,
  thumbnail_url text,
  status text default 'active',
  created_at timestamptz default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  url text,
  video_title text,
  duration_secs int,
  status text default 'pending',
  error_message text,
  created_at timestamptz default now()
);

create table clips (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  video_url text,
  thumbnail_url text,
  start_time float,
  end_time float,
  duration_secs float,
  title text,
  description text,
  hashtags text,
  viral_reason text,
  approved boolean default false,
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid references clips(id) on delete cascade,
  platform text,
  platform_post_id text,
  status text,
  posted_at timestamptz,
  scheduled_for timestamptz,
  title_used text,
  description_used text
);

create table analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  snapshot_date date,
  views int,
  likes int,
  shares int,
  watch_time_secs int,
  estimated_revenue_usd float,
  pulled_at timestamptz default now()
);

create table streamers (
  id uuid primary key default gen_random_uuid(),
  name text,
  platform text,
  channel_url text,
  channel_id text,
  subscriber_count int,
  avg_viewers int,
  monthly_growth_pct float,
  clip_program_detected boolean,
  opportunity_score float,
  score_reason text,
  added_to_project_id uuid references projects(id),
  discovered_at timestamptz default now()
);

create index idx_jobs_project_id on jobs(project_id);
create index idx_clips_job_id on clips(job_id);
create index idx_clips_project_id on clips(project_id);
create index idx_posts_clip_id on posts(clip_id);
create index idx_analytics_post_id on analytics_snapshots(post_id);

alter table projects disable row level security;
alter table jobs disable row level security;
alter table clips disable row level security;
alter table posts disable row level security;
alter table analytics_snapshots disable row level security;
alter table streamers disable row level security;

alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table clips;

insert into storage.buckets (id, name, public) values ('clips', 'clips', true)
  on conflict (id) do nothing;
