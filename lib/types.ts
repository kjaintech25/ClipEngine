export type JobStatus = "pending" | "processing" | "done" | "failed";
export type ProjectStatus = "active" | "archived";
export type Platform = "youtube" | "twitch" | "both" | "unknown";

export type Creator = {
  id: string;
  name: string | null;
  platform: Platform | string | null;
  channel_url: string | null;
  channel_id: string | null;
  subscriber_count: number | null;
  avg_viewers: number | null;
  monthly_growth_pct: number | null;
  clip_program_detected: boolean | null;
  opportunity_score: number | null;
  score_reason: string | null;
  discovered_at: string;
};

export type Project = {
  id: string;
  name: string | null;
  streamer_name: string | null;
  platform: Platform | string | null;
  channel_url: string | null;
  thumbnail_url: string | null;
  status: ProjectStatus | string | null;
  creator_id: string | null;
  created_at: string;
};

export type ProjectWithCreator = Project & {
  creator: Pick<Creator, "id" | "name" | "platform" | "channel_url"> | null;
};

export type Job = {
  id: string;
  project_id: string;
  url: string | null;
  video_title: string | null;
  duration_secs: number | null;
  status: JobStatus | string;
  error_message: string | null;
  created_at: string;
};

export type Clip = {
  id: string;
  job_id: string;
  project_id: string;
  video_url: string | null;
  thumbnail_url: string | null;
  start_time: number | null;
  end_time: number | null;
  duration_secs: number | null;
  title: string | null;
  description: string | null;
  hashtags: string | null;
  viral_reason: string | null;
  approved: boolean;
  created_at: string;
};

export type ProjectWithClipCount = Project & {
  clips: { count: number }[];
  creator: Pick<Creator, "id" | "name" | "platform" | "channel_url"> | null;
};

export type ProjectWithCounts = Project & {
  clips: { count: number }[];
  jobs: { count: number }[];
};

export type CreatorWithProjects = Creator & {
  projects: { id: string; clips: { count: number }[] }[];
};
