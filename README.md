# DevFlow — AI-Powered Cloud IDE

DevFlow is a cloud-based AI-powered IDE that works fully from the browser and mobile. Describe what you want to build, and an AI agent writes the code, runs it in a cloud sandbox, previews it, builds mobile apps, and publishes to app stores.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TailwindCSS + shadcn/ui |
| Editor | Monaco Editor |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Cloud Sandbox | E2B API |
| Backend | Node.js + Express + Socket.io |
| Realtime | WebSockets (Socket.io) |

## Supported Frameworks

- **Flutter** — Cross-platform mobile & web
- **React + Vite** — Web applications
- **React Native** — Native mobile apps

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key
- E2B API key

### Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd devflow
```

2. Install dependencies:
```bash
cd frontend && npm install
cd ../backend && npm install
```

3. Configure environment variables:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys
```

4. Start the development servers:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

5. Open http://localhost:5173 in your browser.

## Project Structure

```
devflow/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   └── workspace/     # IDE workspace components
│   │   ├── lib/               # Utilities, API client, socket
│   │   ├── pages/             # Landing page, Workspace
│   │   └── stores/            # State management
│   └── index.html
├── backend/                   # Express + Socket.io backend
│   └── src/
│       ├── agent/             # Claude AI agent + tools
│       ├── routes/            # REST API routes
│       ├── sandbox/           # E2B sandbox manager
│       ├── socket/            # WebSocket handlers
│       └── store/             # In-memory project store
└── README.md
```

## Architecture

1. **User** submits a prompt describing what they want to build
2. **Backend** creates an E2B sandbox and sends the prompt to Claude
3. **Claude** uses tools (read_file, write_file, run_command, etc.) to build the project
4. **Activity** is streamed in real-time to the frontend via WebSockets
5. **User** can preview the running app, edit code in Monaco Editor, and chat with Claude
6. **Builds** are triggered via GitHub Actions for Android (AAB) and iOS (IPA)
7. **Publishing** to Google Play and App Store is one-click from the UI

## License

MIT
