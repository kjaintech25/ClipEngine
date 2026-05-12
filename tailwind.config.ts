import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        card: "#141414",
        border: "#222222",
        accent: "#E8FF47",
        text: "#F0F0F0",
        muted: "#555555",
        success: "#4ADE80",
        warn: "#FACC15",
        danger: "#F87171",
      },
      fontFamily: {
        head: ["var(--font-syne)", "system-ui", "sans-serif"],
        body: ["var(--font-plex)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "4px",
        full: "9999px",
      },
      letterSpacing: {
        tightest: "-0.04em",
        wider: "0.08em",
        widest: "0.16em",
      },
    },
  },
  plugins: [],
};
export default config;
