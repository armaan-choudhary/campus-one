# CampusOne Frontend

The official conversational web application and multi-persona operational suite for **CampusOne — One Front Door for Everything**.

## 🚀 Overview

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Inter**, CampusOne delivers an enterprise university interface tailored to four core campus constituencies.

### 🎭 Persona Dashboards & Views
1. **Student View (Alex Rivera — Primary Audience)**:
   - Minimalist, friendly conversational interface with zero administrative clutter.
   - Action Checklists, grounded institutional citations with slide-out drawer, and dynamic clarification options.
   - Floating pill message composer with voice toggle simulation and file attachment.
   - Smooth auto-scroll with comfortable vertical breathing room.
2. **Campus Support Specialist Queue (Sarah Jenkins)**:
   - Departmental triage queue for pre-packaged escalations dispatched by CampusOne.
   - Urgency indicators (Urgent 15-min SLA window), search filter, and 1-click resolution templates.
3. **Knowledge Administration Console (Dr. Patricia Cole)**:
   - University policy catalog, pgvector corpus status, chunk inspection, and document publishing modal.
4. **Executive Telemetry & Observability (Dr. Marcus Vance)**:
   - High-level KPIs: 88.4% macro routing accuracy, 76.2% autonomous resolution, and margin guard monitoring ($\Delta \ge 0.15$).
   - Interactive 5×5 cross-departmental confusion matrix heatmap and live edge audit streaming.

---

## 🎨 Theme & Typography System

- **Primary Font:** **Inter** loaded via `next/font/google` (`--font-inter`) with root font scale calibrated to `16px` and message text at `15px/16px` for enhanced reading comfort.
- **Monospace Font:** **JetBrains Mono** (`--font-mono`) for telemetry data, latencies, and transaction hashes.
- **Dual Themes:** Google Material Design 3 Dark Mode (obsidian `#09090b` / `#121215`) and Light Mode (`#ffffff` / `#fafafa`) with seamless theme toggling via TopNav.
- **Branding Assets:** Transparent antialiased mark in `public/logo.png` (white for dark mode) and `public/logo-dark.png` (deep slate for light mode).

---

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Start local dev server (Turbopack)
npm run dev

# Production build verification
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📂 Project Structure

```text
frontend/
├── public/
│   ├── logo.png              # Transparent white archway mark (Dark Mode)
│   ├── logo-dark.png         # Transparent deep slate archway mark (Light Mode)
│   └── wordmark.png          # High-resolution branding assets
├── src/
│   ├── app/
│   │   ├── globals.css       # Tailwind v4 theme tokens, DM Sans font, dark variant
│   │   ├── layout.tsx        # Google DM Sans & JetBrains Mono root configuration
│   │   └── page.tsx          # Main orchestrator view switching across all 4 personas
│   ├── components/
│   │   ├── TopNav.tsx             # Header with persona selector & theme switcher
│   │   ├── Sidebar.tsx            # Collapsible navigation drawer & inquiry history
│   │   ├── MessageBubble.tsx      # Conversation turns, checklists, citations & TTS
│   │   ├── MessageComposer.tsx    # Floating pill input with voice & attachment
│   │   ├── CitationDrawer.tsx     # Slide-out verified institutional policy viewer
│   │   ├── AgentQueueView.tsx     # Support specialist escalation triage dashboard
│   │   ├── KnowledgeAdminView.tsx # Policy registry & pgvector corpus manager
│   │   └── AnalyticsView.tsx      # Executive telemetry & 5x5 confusion matrix
│   ├── lib/
│   │   ├── demoFixtures.ts   # Complete realistic runbook fixtures & persona data
│   │   └── utils.ts          # Common utility functions, cn helper & safe ID generator
│   └── types/
│       └── index.ts          # Centralized TypeScript domain & UI entity contracts
```

