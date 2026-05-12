import { Send } from "lucide-react";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export default function Page() {
  return (
    <PlaceholderScreen
      title="POSTS"
      version="V4 · Auto-post to social"
      Icon={Send}
      description="Schedule and publish approved clips to YouTube Shorts, TikTok, and Instagram Reels. Live view counts, queue management, per-platform editing, all from one screen."
    />
  );
}
