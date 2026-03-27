# Docusaurus on Kubernetes — Reference Guide

## Quick Reference

### Local Development
```bash
cd scripts/templates/app
npm install
npm start          # http://localhost:3000
npm run build      # Static output in build/
```

### Docker Build
```bash
docker build -t learnflow-docs:latest scripts/templates/app/
docker run -p 8080:80 learnflow-docs:latest
```

### Kubernetes Deployment
```bash
# Build in Minikube's Docker
eval $(minikube docker-env)
docker build -t learnflow-docs:latest scripts/templates/app/

# Deploy
kubectl apply -f scripts/templates/k8s/deployment.yaml

# Access
kubectl port-forward -n learnflow svc/learnflow-docs 8080:80
# → http://localhost:8080
```

## Architecture

- **Build stage**: Node 20 Alpine builds static HTML/CSS/JS
- **Serve stage**: Nginx Alpine serves static files (~30MB image)
- **Resources**: 64Mi request / 128Mi limit (smallest service)

## Docusaurus Configuration

### Adding Pages
Place `.md` files in `docs/` with frontmatter:
```markdown
---
sidebar_position: 1
---
# Page Title
Content here.
```

### Sidebar Structure
Auto-generated from directory structure. Override in `sidebars.js`.

### Custom Styling
Edit `src/css/custom.css` for theme colors and typography.

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Build fails OOM | Increase builder memory limit |
| Nginx 403 | Check `build/` dir was copied correctly |
| Hot reload not working | Only in dev mode (`npm start`) |
| Sidebar wrong order | Check `sidebar_position` in frontmatter |
