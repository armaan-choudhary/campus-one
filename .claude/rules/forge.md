# Forge Collaboration Guidelines for Claude

When working in this repository:
1. Always query `forge_context` via Forge MCP before starting work on a task.
2. Signal intent on files by calling `forge_claim_paths`.
3. Adhere to all decisions recorded in the Forge Context Ledger.
4. Record structured handoffs using `forge_create_handoff` after completing verification.
