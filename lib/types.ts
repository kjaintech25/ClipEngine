export type JobStatus = "pending" | "processing" | "done" | "failed";
export type ProjectStatus = "active" | "archived";
export type Platform = "youtube" | "twitch" | "both" | "unknown";

export type Project = {
  id: string;
  name: string | null;
  streamer_name: string | null;
  platform: Platform | string | null;
  channel_url: string | null;
  thumbnail_url: string | null;
  status: ProjectStatus | string | null;
  created_at: string;
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
};
