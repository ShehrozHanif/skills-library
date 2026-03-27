# Next.js on Kubernetes Guide

## Standalone Output
`next.config.js` with `output: "standalone"` creates a minimal server:
```js
const nextConfig = { output: "standalone" };
```
This produces `.next/standalone/server.js` — the only file needed to run.

## Multi-Stage Dockerfile
1. **deps**: Install node_modules
2. **builder**: Copy source + build
3. **runner**: Copy standalone + static assets only

Result: ~150MB image (vs ~1GB with full node_modules).

## Monaco Editor
Use `@monaco-editor/react` with dynamic import to avoid SSR issues:
```tsx
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
```
Monaco loads from CDN at runtime — zero bundle size impact.

## Code Execution Sandbox (MVP)
API route spawns Python subprocess with limits:
```ts
execFile("python3", ["-c", code], { timeout: 5000, maxBuffer: 1024*1024 });
```
- 5s timeout via Node.js `execFile` option
- Hard kill after timeout + 1s grace period
- Production would use isolated containers

## K8s Resource Budget
| Component | Requests | Limits |
|-----------|----------|--------|
| Frontend pod | 128Mi | 256Mi |

## Internal Service Communication
Frontend API routes proxy to backend services via K8s DNS:
```
http://triage-agent.learnflow.svc.cluster.local/chat
```
Client-side code calls `/api/chat` which proxies server-side.

## Port Forwarding for Local Access
```bash
kubectl port-forward -n learnflow svc/learnflow-frontend 3000:80
```
Then open http://localhost:3000
