import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        accent: "var(--accent)",
        "accent-glow": "var(--accent-glow)",
        ink: "var(--ink)",
        muted: "var(--muted)",
      },
      fontFamily: {
        sans: ["var(--font-source-sans)"],
        serif: ["var(--font-playfair)"],
        mono: ["var(--font-plex-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
