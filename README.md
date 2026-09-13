# CampusOne

<div align="center">
  <img src="assets/branding/logo.png" alt="CampusOne Logo" width="140" />
  <h3>One Front Door for Everything</h3>
  <p><em>Ask once. Get routed right. Get it resolved.</em></p>
</div>

---

## 🏛️ About CampusOne

**CampusOne** is an enterprise-grade university orchestration platform and conversational single front door. Universities are notoriously fragmented into bureaucratic silos: IT Helpdesks, Student Accounts/Finance, Campus Facilities, Academic Registrars, and Administrative Directorates. 

CampusOne replaces disjointed chatbots, confusing portal links, and bouncing email threads with a single conversational entry point powered by:
- **Margin-Guarded Intent Routing** ($\Delta \ge 0.15$) with Negative Semantic Anchors
- **Isolated Domain Skills** backed by pgvector + PostgreSQL Full-Text Hybrid Retrieval (RRF)
- **Strict Grounding & Verifiable Citations** (zero hallucination, mandatory source attribution)
- **Deterministic Multi-Domain Synthesis** and turn-based Redis concurrency locks
- **Autonomous Zero-Downtime Replay Circuit Breaker** for bulletproof live demonstrations

---

## 💻 Frontend UI & Multi-Persona Architecture

The frontend (`frontend/`) is built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, and **Inter**:

- **Students (Alex Rivera — Primary Audience):** Clean, distraction-free conversational stream with zero corporate clutter. Features architectural SVG knowledge mesh hero, interactive action checklists, inline citation badges, clarification dialogs, and a floating pill composer.
- **Campus Support Agents (Sarah Jenkins):** Departmental escalation triage queue with SLA indicators (Urgent 15m window), full conversational context, and 1-click resolution templates.
- **Knowledge Administrators (Dr. Patricia Cole):** Institutional policy catalog, pgvector chunk inspection, and vector corpus publishing workflows with single-line Grounding Authority indicators.
- **University Leadership & Evaluators (Dr. Marcus Vance):** Executive telemetry dashboard monitoring 88.4% macro routing accuracy, autonomous resolution rates, and a 5×5 cross-department confusion matrix on an expansive 1440px dashboard grid.
- **Theme & Vector System:** Deep neutral black canvas with restrained electric sapphire/indigo accent (`#6366f1`), custom pure-SVG vector graphics, and accessible WCAG 2.1 AA contrast.

```bash
# Start Frontend Development Server
cd frontend
npm install
npm run dev # Launches on http://localhost:3000
```

---

## 📚 Architectural Specification Suite

The project includes an exhaustive, implementation-ready 19-document specification suite:

| Document | Description |
| :--- | :--- |
| [`docs/00_Project_Overview.md`](docs/00_Project_Overview.md) | Vision, scope, personas, and brand identity |
| [`docs/01_Product_Requirements.md`](docs/01_Product_Requirements.md) | Complete PRD and functional requirements (FR-AUTH through FR-KB) |
| [`docs/02_System_Architecture.md`](docs/02_System_Architecture.md) | Modular monolith architecture, interfaces, and system boundaries |
| [`docs/03_Routing_Engine.md`](docs/03_Routing_Engine.md) | Margin Guard, Negative Anchors, and two-stage classification |
| [`docs/04_Domain_Skills.md`](docs/04_Domain_Skills.md) | Pluggable skill interfaces and domain specifications |
| [`docs/05_RAG_and_Knowledge_Base.md`](docs/05_RAG_and_Knowledge_Base.md) | Hybrid RRF retrieval, chunking, and seed corpus strategy |
| [`docs/06_Conversation_Orchestration.md`](docs/06_Conversation_Orchestration.md) | Turn state machine and multi-domain resolution matrix |
| [`docs/07_Fallback_and_Handoff.md`](docs/07_Fallback_and_Handoff.md) | Clarification dialogs, handoff tickets, and queue routing |
| [`docs/08_Database_Design.md`](docs/08_Database_Design.md) | 14 relational tables, pgvector HNSW indexes, and migrations |
| [`docs/09_API_Reference.md`](docs/09_API_Reference.md) | Comprehensive REST and SSE streaming API contracts |
| [`docs/10_Frontend_Architecture.md`](docs/10_Frontend_Architecture.md) | Next.js architecture, responsive layouts, and accessibility specs |
| [`docs/11_Analytics_and_Evaluation.md`](docs/11_Analytics_and_Evaluation.md) | Metrics, evaluation dataset, and mathematical formulas |
| [`docs/12_Security.md`](docs/12_Security.md) | Auth abstractions, RBAC matrix, and prompt injection defense |
| [`docs/13_Testing_Strategy.md`](docs/13_Testing_Strategy.md) | Test hierarchy, automated suites, and CI verification gates |
| [`docs/14_Deployment.md`](docs/14_Deployment.md) | Docker Compose infrastructure and operations |
| [`docs/15_Demo_Runbook.md`](docs/15_Demo_Runbook.md) | 15-minute live hackathon presentation playbook and script |
| [`docs/16_Implementation_Plan.md`](docs/16_Implementation_Plan.md) | Sequential 14-phase, 18-task implementation roadmap |
| [`docs/17_Engineering_Decisions.md`](docs/17_Engineering_Decisions.md) | 15 Architecture Decision Records (ADRs) |
| [`docs/18_Engineering_Bible.md`](docs/18_Engineering_Bible.md) | Master reference and the 12 non-negotiable system invariants |

---

## 🎨 Brand Identity

- **Official Mark:** Minimalist monochrome university gateway arch framing an integrated numeral "1" (One Front Door for Everything).
- **Assets:** Transparent antialiased mark in `assets/branding/logo.png` (white for dark mode) and `assets/branding/logo-dark.png` (deep slate for light mode).
- **Typography:** **Inter** as primary interface typeface, paired with JetBrains Mono for telemetry, citations, and identifiers.
- **Design Tokens:** Deep neutral black canvas (`#09090b` / `#121215`) with restrained electric sapphire/indigo accent (`#6366f1` / `#4f46e5`) and accessible WCAG 2.1 AA contrast.
