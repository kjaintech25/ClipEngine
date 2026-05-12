import { Telescope } from "lucide-react";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export default function Page() {
  return (
    <PlaceholderScreen
      title="SCOUT"
      version="V3 · Streamer discovery"
      Icon={Telescope}
      description="Search YouTube + Twitch by niche, surface up-and-coming streamers, and let Claude score each one 0–100 for clip-monetization opportunity. Add a discovered streamer directly to a new project."
    />
  );
}
