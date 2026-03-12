import type { Config } from "tailwindcss";

const config: Config = {
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
        cream: "#f2eee3",
        surface: "#ffffff",
        ink: "#3b3c36",
        olive: "#778667",
        navy: "#3e4260",
        muted: "#b2b49c",
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
