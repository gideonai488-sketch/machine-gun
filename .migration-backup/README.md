# Machine Gun — Build Apps at Machine Gun Speed

AI-powered cloud IDE. Describe what you want, the AI builds it, you see it live, deploy with one click.

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && cp .env.example .env && npm install && npm run dev
```

Add your API keys to `backend/.env`:
- `ANTHROPIC_API_KEY` — Claude AI
- `E2B_API_KEY` — Cloud sandboxes
- `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` — Auth

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TailwindCSS + Monaco Editor |
| Backend | Express + Socket.io |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Sandbox | E2B (cloud Linux containers) |
| Builds | Codemagic API |
| Auth | GitHub OAuth |

## How It Works

1. User describes what they want in chat
2. AI agent builds it on a hidden cloud computer (E2B)
3. Live preview updates automatically
4. One-click deploy to web, Google Play, or App Store
