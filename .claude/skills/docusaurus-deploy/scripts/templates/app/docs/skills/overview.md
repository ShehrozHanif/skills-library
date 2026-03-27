---
sidebar_position: 1
---

# Skills Overview

## MCP Code Execution Pattern

Every skill follows the same pattern for maximum token efficiency:

1. **SKILL.md** (~100 tokens) — tells AI WHAT to do
2. **scripts/** (0 tokens) — does the heavy lifting outside context
3. **references/** (on-demand) — deep docs loaded only when needed
4. **Output** (< 5 lines) — minimal result enters AI context

**Result**: 80-98% token reduction vs direct MCP integration.

## Skill Directory Structure

```
.claude/skills/<skill-name>/
├── SKILL.md              # Instructions (~100 tokens)
├── scripts/
│   ├── deploy.sh         # Executes commands
│   ├── verify.py         # Returns minimal status
│   └── templates/        # Source code, manifests
└── references/
    └── guide.md          # Deep docs (loaded on-demand)
```

## Token Budget

| Component | Tokens | Notes |
|-----------|--------|-------|
| SKILL.md | ~60-80 | Loaded when triggered |
| scripts/ | 0 | Executed, never loaded |
| references/ | 0 | Loaded only if needed |
| Output | ~10-50 | Minimal result |

## Cross-Agent Compatibility

All skills use bash scripts + Python — they work identically on:
- **Claude Code**: Reads `.claude/skills/` directory
- **Goose**: Also reads `.claude/skills/` directory
- **Codex**: Same format supported
