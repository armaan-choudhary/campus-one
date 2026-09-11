---
name: forge-agent
description: Run AI coding agents (OpenCode, Claude Code, Cursor, Aider, custom scripts) under Forge with pre-run snapshot blast-radius protection, non-destructive CRDT rollbacks, and structured handoff verification.
---

# Forge Agent Execution & Rollback Skill

This skill provides playbooks for running and supervising AI coding agents inside a Forge collaborative session.

## 🚀 Running Agents
```bash
# Interactive OpenCode with snapshot protection:
forge agent opencode

# Headless task prompt:
forge agent opencode --task <taskId> --prompt "Refactor user authentication in src/auth"

# Generic agent:
forge agent run generic -- claude --prompt "Fix TypeScript diagnostics"
```

## ⏪ Reverting Bad Agent Runs
```bash
forge agent list-runs
forge agent rollback <runId>
```
