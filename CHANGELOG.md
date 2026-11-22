# Changelog

## 2026-10-07
- feat: user-scoped tickets, unified auth flow, persistent clarification rendering, and workspace sidebar sync
- added tracibility
- fixed the streamlit-nextjs issue also updated the relevent mds

## 2026-10-06
- feat(auth,chat): persist refresh tokens, rate limit auth endpoints, and add account-based student chat history
- chore: test commit from kvnishkdhiman
- fix(admin): resolve React hook order violation by lifting activeTab hook above early returns
- style: harmonize Ticket, Admin, Login, and Analytics pages with obsidian Chat UI
- feat: add LLM-based Quick-Reply Templates for ticket resolution and student chat
- feat: implement hybrid search, multi-domain parallel fanout, SSE chat streaming, and admin analytics dashboard
- feat: update architectural docs, clarification gating, ticket lifecycle, and clean working tree

## 2026-09-28
- docs: update documentation for conversation persistence, student auth, and LangSmith observability
- feat(observability): add LangSmith tracing and fix authentication
- feat(chat): persist and restore conversations across logins

## 2026-09-27
- fix: resolve cross-machine startup, IPv6 localhost fetch errors, and track frontend env files
- feat: simplify frontend to dual-role pages (/workspace and /admin), update docs and start scripts

## 2026-09-26
- feat(backend): add ticket escalation and retrieval inspection
- feat(backend): add authenticated graph API and debug console

## 2026-09-25
- Revert "feat: complete live campus orchestration stack, multi-intent router, and production polish"

## 2026-09-23
- feat: complete live campus orchestration stack, multi-intent router, and production polish

## 2026-09-21
- feat: landing page campus wayfinding redesign, visual storytelling pass, directory cleanup, and doc sync

## 2026-09-18
- feat: single front door student hero, subtle interactive canvas, portaled auth UI, and latency optimizations

## 2026-09-17
- refactor(scripts): move all run scripts into scripts/ folder
- feat(scripts): add cross-platform setup and launch system for Linux, macOS, and Windows
- docs: update readmes and architectural specifications for backend LangGraph & pgvector integration
- Merge branch 'origin/main' into main

## 2026-09-15
- feat(backend): add department-specific document retrieval

## 2026-09-14
- update notebook imports after graph module rename
- rename agents.py to graph_nodes.py
- add graph_state module for shared state schemas
- Added readme file

## 2026-09-13
- feat(frontend): add landing homepage, custom loader, and compact minimalist navigation
- add notebook for testing campus support routing graph
- implement router, domain agents, clarification, and response nodes
- update backend dependencies
- Refactor frontend UI: Inter typography, SVG vector suite, subtle indigo accent, and 1440px dashboard layout

## 2026-09-12
- feat(frontend): implement Next.js 16 multi-persona web application with Google DM Sans and updated docs

## 2026-09-11
- feat: initialize CampusOne architecture docs, brand identity, and runbook