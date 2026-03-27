# Live Demo Guide — Goose + Skills Testing

> Quick reference for demonstrating cross-agent compatibility with Goose

## Prerequisites

```powershell
# Verify Goose is installed
& "C:\Users\Shehroz Hanif\goose\goose.exe" --version

# Navigate to skills-library
cd "C:\Users\Shehroz Hanif\Desktop\hackathon3\skills-library"
```

## Demo Commands (PowerShell)

### 1. List all available skills
```powershell
& "C:\Users\Shehroz Hanif\goose\goose.exe" run --text "List all directories in .claude/skills/ and briefly describe what each skill does by reading their SKILL.md files" --no-session --quiet --max-turns 10 --with-builtin developer --no-profile
```

### 2. Verify a single skill (kafka-k8s-setup)
```powershell
& "C:\Users\Shehroz Hanif\goose\goose.exe" run --text "Read .claude/skills/kafka-k8s-setup/SKILL.md and explain what this skill does and what scripts it uses" --no-session --quiet --max-turns 5 --with-builtin developer --no-profile
```

### 3. Verify another skill (postgres-k8s-setup)
```powershell
& "C:\Users\Shehroz Hanif\goose\goose.exe" run --text "Read .claude/skills/postgres-k8s-setup/SKILL.md and list all scripts in .claude/skills/postgres-k8s-setup/scripts/. Explain how this skill follows the MCP Code Execution pattern" --no-session --quiet --max-turns 5 --with-builtin developer --no-profile
```

### 4. Use a skill — Generate AGENTS.md
```powershell
& "C:\Users\Shehroz Hanif\goose\goose.exe" run --text "Use the agents-md-gen skill in .claude/skills/agents-md-gen/SKILL.md to analyze this repository. Run the script: bash .claude/skills/agents-md-gen/scripts/analyze_repo.sh" --no-session --quiet --max-turns 5 --with-builtin developer --no-profile
```

### 5. Verify ALL skills at once
```powershell
& "C:\Users\Shehroz Hanif\goose\goose.exe" run --text "List all directories in .claude/skills/. For each one, read the SKILL.md and list the scripts. Create a summary table showing which skills are valid and follow the MCP Code Execution pattern." --no-session --quiet --max-turns 15 --with-builtin developer --no-profile
```

### 6. Interactive session (most impressive for live demo)
```powershell
& "C:\Users\Shehroz Hanif\goose\goose.exe" session
```
Then type naturally:
- "What skills are available in .claude/skills?"
- "Read the kafka-k8s-setup skill and tell me how to deploy Kafka"
- "Verify all skills follow the MCP Code Execution pattern"
- Type `exit` to end

## Deploy Skills (Requires Kubernetes Cluster)

If Minikube is running (`minikube start --cpus=4 --memory=8192`):

```powershell
# Deploy Kafka via Goose
& "C:\Users\Shehroz Hanif\goose\goose.exe" run --text "Follow the instructions in .claude/skills/kafka-k8s-setup/SKILL.md to deploy Kafka on Kubernetes. Run the deploy script and then verify." --no-session --quiet --max-turns 10 --with-builtin developer --no-profile

# Deploy PostgreSQL via Goose
& "C:\Users\Shehroz Hanif\goose\goose.exe" run --text "Follow the instructions in .claude/skills/postgres-k8s-setup/SKILL.md to deploy PostgreSQL and run migrations." --no-session --quiet --max-turns 10 --with-builtin developer --no-profile

# Deploy Frontend via Goose
& "C:\Users\Shehroz Hanif\goose\goose.exe" run --text "Follow the instructions in .claude/skills/nextjs-k8s-deploy/SKILL.md to deploy the Next.js frontend." --no-session --quiet --max-turns 10 --with-builtin developer --no-profile
```

## What Needs What

| Command | Needs K8s? | Works Right Now? |
|---------|-----------|-----------------|
| Read/verify SKILL.md files | No | Yes |
| Run `analyze_repo.sh` | No | Yes |
| Run `deploy_kafka.sh` | Yes (Minikube/GKE) | Only with cluster |
| Run `deploy_postgres.sh` | Yes | Only with cluster |
| Run `deploy_frontend.sh` | Yes | Only with cluster |
| Run `verify_*.py` scripts | Yes | Only with cluster |

## CLI Flags Explained

| Flag | Purpose |
|------|---------|
| `--text "..."` | The prompt/instruction for Goose |
| `--no-session` | Don't persist this as a saved session |
| `--quiet` | Clean output — only show Goose's response |
| `--max-turns N` | Limit actions Goose can take (prevents loops) |
| `--with-builtin developer` | Give Goose file read + shell execution |
| `--no-profile` | Don't load extra extensions, keep it minimal |

## Key Talking Points for Demo

1. **Same skills, different agent**: Claude Code (Claude model) built the app, Goose (OpenAI model) can use the exact same skills
2. **No modification needed**: `.claude/skills/` directory works on both agents natively
3. **MCP Code Execution pattern**: SKILL.md ~100 tokens, scripts execute externally, 80-98% token savings
4. **Agent-agnostic scripts**: All scripts use standard bash/python — no agent-specific APIs
5. **Cross-model proof**: Claude Code uses Claude, Goose uses OpenAI gpt-4o-mini — true portability
