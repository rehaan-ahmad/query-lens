# QueryLens Frontend

The frontend for **QueryLens** — a natural language, conversation-driven BI Dashboard. Designed with **Next.js 14**, **React 18**, and **Tailwind CSS**.

## Design Philosophy
QueryLens's UI relies on dark-themed glassmorphism, conversational flow experiences instead of traditional data grids, and smooth hardware-accelerated animations (`animejs` + `framer-motion`).

## Features
- **Conversational UI Structure:** Interaction acts like chat apps, with floating inline Recharts graphs.
- **Micro-Animations:** Employs advanced custom web animations (Rubik's Cube loading, metronome phases) during LLM backend sync times.
- **Voice Interactions:** Fully supports speech-to-text querying seamlessly bridging Chromium's Web Speech API with frontend custom hooks.
- **Data Export capabilities:** One click PNG rendering and downloading of Recharts utilizing `html2canvas`.

## How to execute

```bash
# 1. Install Dependencies
npm install

# 2. Add local env pointing to backend
echo 'NEXT_PUBLIC_API_URL="http://localhost:8000"' > .env.local

# 3. Enter dev server
npm run dev
```

Proceed to `http://localhost:3000` to view the application.
