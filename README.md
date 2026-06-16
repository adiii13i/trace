# trace

Proof-of-work project management for engineering teams.

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- GitHub OAuth App ([create one](https://github.com/settings/developers))
- Anthropic API key

### 1. Clone and install

```bash
git clone <your-repo>
cd trace
npm install
```

### 2. Configure environment

**Backend** — copy and fill in:
```bash
cp .env.example apps/api/.env
```

Required values in `apps/api/.env`:
```
MONGODB_URI=mongodb://localhost:27017/trace
GITHUB_TOKEN=ghp_...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=<64 random chars>
SESSION_SECRET=<64 random chars>
FRONTEND_URL=http://localhost:3000
```

**Frontend** — copy and fill in:
```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Required values in `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GITHUB_CLIENT_ID=<same as above>
```

### 3. GitHub OAuth App setup

In your GitHub OAuth App settings:
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3000/auth/github`

### 4. Run

```bash
# Both frontend and backend in parallel:
npm run dev

# Or individually:
npm run dev --workspace=apps/api   # http://localhost:4000
npm run dev --workspace=apps/web   # http://localhost:3000
```

### 5. VS Code Extension

```bash
cd packages/vscode-extension
npm install
npm run compile
```
Press `F5` in VS Code to launch the Extension Development Host, or package it:
```bash
npm run package   # produces trace-context-bridge-0.1.0.vsix
code --install-extension trace-context-bridge-0.1.0.vsix
```

Then in VS Code:
- Run `trace: Set Auth Token` — paste your JWT from the web app's Settings page
- Run `trace: Fetch My Tasks` — tasks appear in the sidebar

### 6. GitHub Webhook

In your GitHub repo → Settings → Webhooks → Add:
- **Payload URL**: `http://<your-server>:4000/api/webhooks/github`
- **Content type**: `application/json`
- **Secret**: the `webhookSecret` from your project (shown after creating a project)
- **Events**: Just the push event

## Project Structure

```
trace/
├── apps/
│   ├── web/          # Next.js 14 App Router frontend
│   └── api/          # Express.js backend
├── packages/
│   └── vscode-extension/   # VS Code Context Bridge
├── package.json      # Workspace root
└── .env.example
```

## Core Flow

1. Manager creates project → LLM generates tasks
2. Manager assigns tasks to developers
3. Developer pulls tasks in VS Code extension
4. Developer pushes code → GitHub webhook fires
5. API fetches git diff → LLM verifies completion
6. Task marked verified, points awarded
7. Manager dashboard updates in real-time
