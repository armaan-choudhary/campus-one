---
name: forge-checkpoint
description: Create verified Git checkpoint commits from live CRDT sessions with test gates, automated co-author attribution, and session branch management.
---

# Forge Checkpoint Skill

Create verified Git commits from live CRDT session state.

```bash
forge checkpoint "feat(auth): complete token rotation" --verify "npm test"
forge checkpoints list
forge checkpoints show <commitSha>
```
