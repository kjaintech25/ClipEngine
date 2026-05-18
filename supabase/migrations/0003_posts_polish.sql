-- Post Manager (Sprint 2): give posts an error channel + created_at ordering,
-- and put the table on the realtime publication so the UI updates live.
alter table posts add column error_message text;
alter table posts add column created_at timestamptz default now();
alter publication supabase_realtime add table posts;
