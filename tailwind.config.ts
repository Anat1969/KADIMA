import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a1a",
        paper: "#faf9f7",
        surface: "#ffffff",
        line: "#e6e3de",
        accent: "#1f4d3a",
        accentSoft: "#e8f0ec",
        waiting: "#8a6d1f",
        waitingBg: "#f7efd8",
        progress: "#1f4d8a",
        progressBg: "#e3ecf7",
        ready: "#1f6d3a",
        readyBg: "#e2f2e7",
        delayed: "#8a2f1f",
        delayedBg: "#f7e3de",
        draft: "#5a5a5a",
        draftBg: "#efedea"
      },
      fontFamily: {
        hebrew: ["'Noto Sans Hebrew'", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
