# Skills Library — Reusable Intelligence with MCP Code Execution

> Hackathon III: Teaching AI agents to build cloud-native applications autonomously

## What Is This?

A library of **8 production-grade Skills** that teach Claude Code and Goose how to deploy and manage cloud-native infrastructure. Each skill follows the **MCP Code Execution pattern** — SKILL.md tells the agent *what* to do (~100 tokens), scripts do the heavy lifting (0 tokens in context), and only minimal results enter the conversation.

**Result: 80-98% token reduction** compared to direct MCP server integration.

## Skills Inventory

| Skill | Purpose | Pipeline |
|-------|---------|----------|
| **agents-md-gen** | Generate AGENTS.md for any repo | `bash scripts/analyze_repo.sh \| python scripts/generate_agents_md.py` |
| **k8s-foundation** | K8s health check + Helm install | `bash scripts/check_cluster.sh \| python scripts/verify_health.py` |
| **kafka-k8s-setup** | Deploy Kafka on K8s + topic management | `bash scripts/deploy_kafka.sh \| python scripts/verify_kafka.py` |
| **postgres-k8s-setup** | Deploy PostgreSQL + run migrations | `bash scripts/deploy_postgres.sh \| python scripts/verify_postgres.py` |
| **fastapi-dapr-agent** | FastAPI + Dapr microservices (6 AI agents) | `bash scripts/deploy_services.sh \| python scripts/verify_services.py` |
| **mcp-code-execution** | MCP Code Execution for real-time system context | `python scripts/system_status.py \| python scripts/verify_mcp.py` |
| **nextjs-k8s-deploy** | Deploy Next.js + Monaco editor frontend | `bash scripts/deploy_frontend.sh \| python scripts/verify_frontend.py` |
| **docusaurus-deploy** | Deploy Docusaurus docs site on K8s | `bash scripts/deploy_docs.sh \| python scripts/verify_docs.py` |

## The MCP Code Execution Pattern

```
.claude/skills/<skill-name>/
├── SKILL.md              # ~100 tokens — loaded into agent context
├── scripts/              # 0 tokens — executed externally
│   ├── deploy.sh         # Does the heavy lifting
│   └── verify.py         # Returns minimal result
└── references/           # 0 tokens — loaded only on demand
    └── guide.md
```

| Component | Tokens | Notes |
|-----------|--------|-------|
| SKILL.md | ~100 | Loaded when triggered |
| references/ | 0 | Loaded only if needed |
| scripts/ | 0 | Executed, never loaded |
| Final output | ~10 | e.g., "All 3 pods running" |

**Total: ~110 tokens vs 50,000+ with direct MCP**

## Quick Start

### With Claude Code
```bash
# Clone into your project
cp -r .claude/skills/* /your-project/.claude/skills/

# Use naturally in conversation:
# "Deploy Kafka on Kubernetes"
# "Set up PostgreSQL with migrations"
# "Deploy the Next.js frontend"
```

### With Goose
```bash
# Goose reads .claude/skills/ natively
# Same skills, same commands, no changes needed
goose session
# "Deploy Kafka using the kafka-k8s-setup skill"
```

## Cross-Agent Compatibility

These skills work on **both Claude Code and Goose** without modification:
- Claude Code reads `.claude/skills/*/SKILL.md` automatically
- Goose reads the same `.claude/skills/` directory natively
- Scripts use standard bash/python — no agent-specific APIs

## Token Efficiency Comparison

| Approach | Startup Cost | Per-Operation Cost | Total (5 ops) |
|----------|-------------|-------------------|----------------|
| Direct MCP (3 servers) | ~30,000 tokens | ~10,000 tokens | ~80,000 tokens |
| Skills + Code Execution | ~100 tokens | ~10 tokens | ~150 tokens |
| **Savings** | **99.7%** | **99.9%** | **99.8%** |

## Documentation

- [Skill Development Guide](docs/skill-development-guide.md) — How to create new skills using the MCP Code Execution pattern
- [MCP Code Execution (Anthropic)](https://www.anthropic.com/engineering/code-execution-with-mcp) — The pattern this library implements

## Related Repository

- **LearnFlow Application**: [ShehrozHanif/learnflow-ai](https://github.com/ShehrozHanif/learnflow-ai) — The complete AI tutoring platform built using these skills

## Built With

- [Claude Code](https://claude.ai) — Primary AI agent
- [Goose](https://block.github.io/goose/) — Cross-agent testing
- [Spec-Kit Plus](https://github.com/specify-plus) — Spec-driven development framework
- [AAIF Standards](https://aaif.io/) — Agentic AI Foundation
