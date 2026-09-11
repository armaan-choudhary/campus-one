# Forge Multi-Agent Collaboration Rules

This workspace uses **Forge** (local-first CRDT collaboration for human + AI pairing).

## Rules for AI Coding Agents:
1. **Check Context First**: Call `forge_context` or run `forge context` to inspect active tasks, claims, and architectural decisions.
2. **Claim Paths**: Call `forge_claim_paths` before modifying files in a module (e.g. `src/auth/*`) to notify teammates and prevent collisions.
3. **Record Decisions**: When making significant design decisions, record them with `forge_record_decision`.
4. **Verify & Handoff**: Run tests/verification and record a handoff with `forge_create_handoff`.
5. **Release Claims**: Release your path claim with `forge_release_claim` when work is finished.
