#!/usr/bin/env bash
# analyze_repo.sh — Scans repo structure, detects languages and frameworks
# Output: structured text to stdout for generate_agents_md.py to consume

set -euo pipefail

REPO_ROOT="${1:-.}"

# --- Project Name ---
PROJECT_NAME=$(basename "$(cd "$REPO_ROOT" && pwd)")
echo "PROJECT_NAME=$PROJECT_NAME"

# --- Directory Structure (max depth 3, exclude hidden/node_modules/venv) ---
echo "---STRUCTURE_START---"
find "$REPO_ROOT" -maxdepth 3 \
  -not -path '*/\.*' \
  -not -path '*/node_modules/*' \
  -not -path '*/venv/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -type d 2>/dev/null | sort
echo "---STRUCTURE_END---"

# --- Language Detection (by file extension) ---
echo "---LANGUAGES_START---"
declare -A lang_count=()
while IFS= read -r ext; do
  case "$ext" in
    py)   lang_count[Python]=$(( ${lang_count[Python]:-0} + 1 )) ;;
    js)   lang_count[JavaScript]=$(( ${lang_count[JavaScript]:-0} + 1 )) ;;
    ts)   lang_count[TypeScript]=$(( ${lang_count[TypeScript]:-0} + 1 )) ;;
    tsx)  lang_count[TypeScript]=$(( ${lang_count[TypeScript]:-0} + 1 )) ;;
    jsx)  lang_count[JavaScript]=$(( ${lang_count[JavaScript]:-0} + 1 )) ;;
    go)   lang_count[Go]=$(( ${lang_count[Go]:-0} + 1 )) ;;
    rs)   lang_count[Rust]=$(( ${lang_count[Rust]:-0} + 1 )) ;;
    java) lang_count[Java]=$(( ${lang_count[Java]:-0} + 1 )) ;;
    rb)   lang_count[Ruby]=$(( ${lang_count[Ruby]:-0} + 1 )) ;;
    sh)   lang_count[Bash]=$(( ${lang_count[Bash]:-0} + 1 )) ;;
    md)   lang_count[Markdown]=$(( ${lang_count[Markdown]:-0} + 1 )) ;;
    yaml|yml) lang_count[YAML]=$(( ${lang_count[YAML]:-0} + 1 )) ;;
    json) lang_count[JSON]=$(( ${lang_count[JSON]:-0} + 1 )) ;;
    css)  lang_count[CSS]=$(( ${lang_count[CSS]:-0} + 1 )) ;;
    html) lang_count[HTML]=$(( ${lang_count[HTML]:-0} + 1 )) ;;
    cs)   lang_count[CSharp]=$(( ${lang_count[CSharp]:-0} + 1 )) ;;
    cpp|cc|cxx) lang_count[CPP]=$(( ${lang_count[CPP]:-0} + 1 )) ;;
    c)    lang_count[C]=$(( ${lang_count[C]:-0} + 1 )) ;;
    php)  lang_count[PHP]=$(( ${lang_count[PHP]:-0} + 1 )) ;;
    swift) lang_count[Swift]=$(( ${lang_count[Swift]:-0} + 1 )) ;;
    kt)   lang_count[Kotlin]=$(( ${lang_count[Kotlin]:-0} + 1 )) ;;
  esac
done < <(find "$REPO_ROOT" -maxdepth 5 -type f -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/venv/*' -not -path '*/__pycache__/*' 2>/dev/null | sed 's/.*\.//' | sort)

for lang in "${!lang_count[@]}"; do
  echo "$lang=${lang_count[$lang]}"
done
echo "---LANGUAGES_END---"

# --- Framework Detection (by config files) ---
echo "---FRAMEWORKS_START---"
[ -f "$REPO_ROOT/package.json" ] && echo "Node.js (package.json)"
[ -f "$REPO_ROOT/requirements.txt" ] && echo "Python pip (requirements.txt)"
[ -f "$REPO_ROOT/Pipfile" ] && echo "Python Pipenv (Pipfile)"
[ -f "$REPO_ROOT/pyproject.toml" ] && echo "Python (pyproject.toml)"
[ -f "$REPO_ROOT/go.mod" ] && echo "Go modules (go.mod)"
[ -f "$REPO_ROOT/Cargo.toml" ] && echo "Rust Cargo (Cargo.toml)"
[ -f "$REPO_ROOT/Gemfile" ] && echo "Ruby Bundler (Gemfile)"
[ -f "$REPO_ROOT/composer.json" ] && echo "PHP Composer (composer.json)"
[ -f "$REPO_ROOT/pom.xml" ] && echo "Java Maven (pom.xml)"
[ -f "$REPO_ROOT/build.gradle" ] && echo "Java/Kotlin Gradle (build.gradle)"
[ -f "$REPO_ROOT/Dockerfile" ] && echo "Docker (Dockerfile)"
[ -f "$REPO_ROOT/docker-compose.yml" ] || [ -f "$REPO_ROOT/docker-compose.yaml" ] && echo "Docker Compose"
[ -f "$REPO_ROOT/next.config.js" ] || [ -f "$REPO_ROOT/next.config.mjs" ] || [ -f "$REPO_ROOT/next.config.ts" ] && echo "Next.js"
[ -f "$REPO_ROOT/tsconfig.json" ] && echo "TypeScript (tsconfig.json)"
[ -f "$REPO_ROOT/Makefile" ] && echo "Make (Makefile)"
[ -d "$REPO_ROOT/.github" ] && echo "GitHub Actions (.github/)"
[ -f "$REPO_ROOT/.gitlab-ci.yml" ] && echo "GitLab CI (.gitlab-ci.yml)"
echo "---FRAMEWORKS_END---"

# --- Conventions Detection ---
echo "---CONVENTIONS_START---"
[ -f "$REPO_ROOT/.editorconfig" ] && echo "EditorConfig (.editorconfig)"
[ -f "$REPO_ROOT/.eslintrc.json" ] || [ -f "$REPO_ROOT/.eslintrc.js" ] || [ -f "$REPO_ROOT/.eslintrc.yml" ] && echo "ESLint"
[ -f "$REPO_ROOT/.prettierrc" ] || [ -f "$REPO_ROOT/.prettierrc.json" ] && echo "Prettier"
[ -f "$REPO_ROOT/AGENTS.md" ] && echo "AGENTS.md exists"
[ -f "$REPO_ROOT/CLAUDE.md" ] || [ -f "$REPO_ROOT/CLAUDE.MD" ] && echo "CLAUDE.md exists"
[ -f "$REPO_ROOT/.gitignore" ] && echo "gitignore configured"
echo "---CONVENTIONS_END---"

# --- Summary Line (this is what enters AI context) ---
TOTAL_FILES=$(find "$REPO_ROOT" -maxdepth 5 -type f -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/venv/*' 2>/dev/null | wc -l)
LANG_COUNT=${#lang_count[@]}
echo "Analyzed: $TOTAL_FILES files, $LANG_COUNT languages detected"
