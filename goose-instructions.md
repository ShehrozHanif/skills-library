# Goose Compatibility Guide for Skills Library

## Overview

All skills in `.claude/skills/` are compatible with both **Claude Code** and **Goose**.
Goose reads `.claude/skills/*/SKILL.md` natively — no conversion or transpilation needed.

## How Goose Uses These Skills

1. Goose scans `.claude/skills/` for SKILL.md files
2. Each SKILL.md has YAML frontmatter with `name` and `description`
3. When a user request matches a skill's description, Goose loads the SKILL.md
4. Goose follows the `## Instructions` section to execute scripts
5. Scripts output minimal results — keeping Goose's context window efficient

## Running Skills with Goose

```bash
# Start a Goose session in this repo
goose session

# Example prompts:
# "Deploy Kafka on Kubernetes"          → triggers kafka-k8s-setup
# "Check cluster health"                → triggers k8s-foundation
# "Deploy PostgreSQL with migrations"   → triggers postgres-k8s-setup
# "Deploy the Next.js frontend"         → triggers nextjs-k8s-deploy
# "Generate AGENTS.md for this repo"    → triggers agents-md-gen
```

## Prerequisites for Goose

- Goose installed: `brew install --cask block-goose` (macOS) or download from GitHub
- Same prerequisites as Claude Code: Docker, kubectl, Helm, Minikube/K8s cluster
- Python 3.x and Bash available in PATH

## Why Cross-Agent Compatibility Matters

- Skills are the emerging industry standard (Claude, Codex, Goose all support them)
- Same SKILL.md format works everywhere — write once, run on any agent
- Scripts use standard bash/python — no agent-specific APIs
- Token efficiency benefits apply to all agents equally
