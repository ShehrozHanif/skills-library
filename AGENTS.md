# Skills Library — AGENTS.md

## Repository Purpose

This repository contains reusable AI Skills that teach Claude Code and Goose how to deploy and manage cloud-native infrastructure using the MCP Code Execution pattern.

## Directory Structure

```
skills-library/
├── .claude/skills/          # All skills live here
│   ├── agents-md-gen/       # Generate AGENTS.md for repos
│   ├── k8s-foundation/      # K8s health check + Helm install
│   ├── kafka-k8s-setup/     # Deploy Kafka on K8s
│   ├── postgres-k8s-setup/  # Deploy PostgreSQL on K8s
│   ├── fastapi-dapr-agent/  # FastAPI + Dapr microservices
│   ├── mcp-code-execution/  # MCP Code Execution scripts
│   ├── nextjs-k8s-deploy/   # Deploy Next.js frontend
│   └── docusaurus-deploy/   # Deploy Docusaurus docs
├── docs/
│   └── skill-development-guide.md
├── README.md
└── AGENTS.md                # This file
```

## Conventions

- Each skill follows: `SKILL.md` (~100 tokens) + `scripts/` (executed externally) + `references/` (on-demand)
- Scripts output minimal results (< 5 lines) to keep token usage low
- Skills are agent-agnostic — work on Claude Code, Goose, and Codex
- Commit messages: `"Claude: ..."` or `"Goose: ..."`

## How to Use

1. Copy `.claude/skills/` into your project root
2. Ask your AI agent to perform a task matching a skill's description
3. The agent loads SKILL.md, executes scripts, returns minimal output

## Prerequisites

- Docker + Kubernetes (Minikube or cloud)
- kubectl, Helm
- Python 3.x, Bash
