# AGENTS.md

## Cursor Cloud specific instructions

### Overview

DevFlow is an AI-powered Cloud IDE with two services:
- **Frontend** (React + Vite + TailwindCSS + shadcn/ui) — port 5173
- **Backend** (Express + Socket.io) — port 3001

See `README.md` for full tech stack and project structure.

### Running Services

Start **backend** first, then **frontend**:
```bash
cd backend && npm run dev    # Port 3001 — uses node --watch for hot reload
cd frontend && npm run dev   # Port 5173 — Vite dev server with HMR
```

The Vite config proxies `/api` and `/socket.io` to `localhost:3001`, so the frontend works without a separate `VITE_BACKEND_URL` env var when both run locally.

### Environment Variables

The backend requires two external API keys in `backend/.env`:
- `ANTHROPIC_API_KEY` — for Claude AI code generation
- `E2B_API_KEY` — for cloud sandbox execution

Copy from example: `cp backend/.env.example backend/.env` and fill in keys. Without these keys the backend starts and serves the API (health check, project CRUD), but sandbox creation and AI chat fail with auth errors.

### Lint / Build / Test

- **Lint (frontend only):** `cd frontend && npm run lint` — ESLint 9, flat config. Note: the codebase has 8 pre-existing lint errors (unused imports, React Compiler memoization warnings, `__dirname` in `vite.config.js`).
- **Build (frontend):** `cd frontend && npm run build`
- **No test suite exists** — there are no test files or test dependencies in either package.

### Gotchas

- Backend uses in-memory `Map` for project state — restarting the backend loses all projects.
- Backend uses `node --watch` (native Node.js watch mode), not nodemon.
- The frontend `.env.example` references `VITE_BACKEND_URL` but it's not needed when using the Vite proxy (default setup).
- No workspace-level `package.json` — install dependencies separately in `frontend/` and `backend/`.
