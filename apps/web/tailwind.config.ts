import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F7F4EC",
        navy: {
          DEFAULT: "#182A53",
          dark: "#0F1B38",
          light: "#233D75"
        },
        cyan: {
          DEFAULT: "#39C6D8",
          glow: "#5DE2F2"
        },
        violet: {
          DEFAULT: "#8669E8",
          dark: "#6749D0"
        },
        coral: {
          DEFAULT: "#F29B65",
          dark: "#DE7A3C"
        },
        softgreen: "#B8E3A3",
        ink: {
          DEFAULT: "#17191F",
          muted: "#5A6170",
          subtle: "#8E95A5"
        }
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
