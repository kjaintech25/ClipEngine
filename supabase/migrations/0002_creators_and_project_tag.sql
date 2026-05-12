-- Rename the V3 scout table to its broader purpose: canonical creator entity
alter table streamers rename to creators;

-- Drop the back-reference column (we're flipping the direction: projects link to creators)
alter table creators drop column added_to_project_id;

-- Make channel_url the natural key for dedup on upsert
alter table creators add constraint creators_channel_url_key unique (channel_url);

-- Project tag: which creator is this project clipping content for
alter table projects add column creator_id uuid references creators(id) on delete set null;
create index idx_projects_creator_id on projects(creator_id);

-- Backfill creators from any existing projects with detected channel info
insert into creators (name, platform, channel_url)
  select distinct streamer_name, coalesce(platform, 'unknown'), channel_url
  from projects
  where streamer_name is not null
    and channel_url is not null
on conflict (channel_url) do nothing;

-- Link existing projects to their newly created creator rows
update projects p set creator_id = c.id
  from creators c
  where p.channel_url = c.channel_url
    and p.creator_id is null;

-- Realtime on creators so the future creator dashboard updates live
alter publication supabase_realtime add table creators;
