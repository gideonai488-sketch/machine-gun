# Machine Gun — AI IDE

## Overview

"Machine Gun" is an AI-powered IDE that lets users describe an app idea, then watches Claude AI build it live in an E2B cloud sandbox with a live preview. Built as a pnpm monorepo on Replit.

## Architecture

### Frontend — `artifacts/machine-gun` (port 24785 → external 80)
- **Stack**: React + Vite + TypeScript + Tailwind CSS
- **Auth**: Supabase (client-side via `@supabase/supabase-js`)
- **Pages**: Landing (auth), Dashboard (project list), Workspace (IDE), Settings, NotFound
- **Workspace components**: ChatPanel, PreviewPanel, CodeEditor, DeployPanel
- **Real-time**: Socket.io client — connects to same origin, proxied by Vite to api-server
- **API calls**: `/api/*` — proxied by Vite dev server to `localhost:8080`

### Backend — `artifacts/api-server` (port 8080)
- **Stack**: Express 5 + Socket.io + TypeScript + esbuild
- **Routes**: `GET/POST /api/projects`, `POST /api/projects/:id/chat`, `GET/PUT /api/projects/:id/files`, `POST /api/projects/:id/deploy/*`
- **Auth route**: `GET /api/auth/me` (validates Supabase JWT)
- **Agent**: Claude AI via `@anthropic-ai/sdk` — agentic loop with tools (read_file, write_file, run_command, list_files, search_code)
- **Sandbox**: E2B cloud sandboxes — each project gets its own Linux VM; creates scaffold, runs dev server, returns preview URL
- **Store**: In-memory project + chat history store with optional Supabase persistence
- **Real-time**: Socket.io events: `project:updated`, `chat:stream`, `activity`, `files:updated`, `file:changed`, `build:status`

### Component Preview Server — `artifacts/mockup-sandbox` (port 8081)
- Canvas component preview sandbox for design exploration

## Vite Proxy (dev)
The frontend Vite server proxies:
- `/api` → `http://localhost:8080`
- `/socket.io` → `http://localhost:8080` (WebSocket)

## Required Secrets
| Secret | Used by | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | frontend + backend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | frontend | Client-side auth |
| `SUPABASE_SERVICE_KEY` | backend | Server-side Supabase access (optional, falls back to anon key) |
| `E2B_API_KEY` | backend | E2B cloud sandbox creation |
| `ANTHROPIC_API_KEY` | backend | Claude AI (claude-sonnet-4-5) |
| `VITE_BACKEND_URL` | frontend | Backend URL (leave empty in dev — Vite proxies automatically) |

## Key Commands
- `pnpm --filter @workspace/machine-gun run dev` — run frontend
- `pnpm --filter @workspace/api-server run dev` — run backend (build + start)
- `pnpm run typecheck` — typecheck all packages

## Supabase Tables (optional — falls back to in-memory)
- `projects` — id, user_id, name, prompt, framework, status, preview_url, live_url, sandbox_id
- `chat_messages` — id, project_id, role, content, created_at
