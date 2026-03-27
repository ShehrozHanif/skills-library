---
name: agents-md-gen
description: Generate AGENTS.md files for repositories. Use when setting up a new repo or when asked to create an AGENTS.md.
---
# Generate AGENTS.md
## Instructions
1. Analyze repo: `bash scripts/analyze_repo.sh`
2. Generate file: `bash scripts/analyze_repo.sh | python scripts/generate_agents_md.py`
   - Use `--output path/to/AGENTS.md` to write to a custom location
   - Use `--force` to overwrite an existing AGENTS.md
3. Confirm AGENTS.md exists at the target path.
