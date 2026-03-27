---
sidebar_position: 5
---

# nextjs-k8s-deploy

Deploy Next.js 14 frontend with Monaco code editor on Kubernetes.

## Usage

```bash
bash scripts/deploy_frontend.sh | python scripts/verify_frontend.py

# Access via port-forward
kubectl port-forward -n learnflow svc/learnflow-frontend 3000:80
```

## Pages

| Route | Role | Features |
|-------|------|----------|
| `/` | Landing | Student/Teacher role selector |
| `/student` | Student | Chat + Monaco Editor + Progress (3-column) |
| `/teacher` | Teacher | Class overview + Struggle alerts + Exercise generator |

## Components

- **ChatPanel** — sends messages to Triage Agent, shows truncated responses with "Show more"
- **CodeEditor** — Monaco editor with Python syntax, Run button, output panel
- **MasteryBadge** — color-coded mastery (Red/Yellow/Green/Blue)
- **ProgressDashboard** — topic progress with empty state support

## Code Sandbox

- Timeout: 5 seconds
- Memory: 50MB (via Python `resource.setrlimit`)
- Standard library only
- API route: `POST /api/execute`

## Architecture

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Monaco loaded from CDN via `@monaco-editor/react`
- Standalone Docker output (~150MB image)
- Chat proxied server-side via `/api/chat` → K8s internal DNS
