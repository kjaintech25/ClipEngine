"""Single source of truth for the Claude clip-selection prompt (PRD §6)."""

CLIP_SELECTION_PROMPT = """You are a viral short-form content expert. Below is a timestamped transcript of a {duration_human} video from {streamer_name}.

Identify the 30 best moments to clip for YouTube Shorts / TikTok. Prioritize: shocking stats, strong opinions, funny moments, emotional peaks, controversial takes, and clear narrative arcs that work in 30-90 seconds.

For each clip return a JSON array with:
- start_time (seconds, float)
- end_time (seconds, float)
- title (hook-style, under 60 chars, no clickbait)
- description (2-3 sentences, SEO-optimized)
- hashtags (8-10 relevant hashtags, comma-separated string starting with #)
- viral_reason (1 sentence: why this specific moment works)

Constraints:
- Each clip must be 20-90 seconds long.
- Clips must not overlap.
- Clips must be ordered by start_time ascending.
- start_time and end_time must be within the video duration (0 to {duration_secs}).

Return ONLY a valid JSON array. No preamble. No code fences. No commentary. Just the array.

TRANSCRIPT:
{transcript}
"""


def format_transcript_for_prompt(segments: list[dict]) -> str:
    """Format Whisper segments as [HH:MM:SS] lines for Claude."""
    lines = []
    for seg in segments:
        start = seg["start"]
        h = int(start // 3600)
        m = int((start % 3600) // 60)
        s = int(start % 60)
        timestamp = f"[{h:02d}:{m:02d}:{s:02d}]"
        text = seg["text"].strip()
        lines.append(f"{timestamp} {text}")
    return "\n".join(lines)


def humanize_duration(secs: float) -> str:
    """'1h 23m' style."""
    h = int(secs // 3600)
    m = int((secs % 3600) // 60)
    if h > 0:
        return f"{h}h {m}m"
    return f"{m}m"
