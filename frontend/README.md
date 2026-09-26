# CampusOne Frontend

The official conversational web application and operational suite for **CampusOne — One Front Door for Everything**.

## 🚀 Overview

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Inter**, CampusOne provides a clean, dual-role architecture that separates the student conversational experience from administrative ticket management into distinct dedicated pages.

---

## 🎭 Dual-Role Architecture & Dedicated Pages

CampusOne strictly distinguishes between two core roles:

### 1. Student Portal (`/workspace`)
- **Primary Audience:** Alex Rivera (`student@example.edu` / `demo-password`)
- **Conversational Assistant (`Assistant` tab):**
  - Distraction-free conversational stream with zero administrative clutter.
  - Interactive Action Checklists, grounded institutional citations with slide-out `CitationDrawer`, and dynamic clarification options.
  - Floating pill message composer.
  - Pure SVG vector knowledge mesh empty state.
- **Personal Ticket Manager (`My Tickets` tab):**
  - Shows inquiries submitted by the student, split into **Ongoing** and **Resolved** tabs.
  - Automatically captures escalated handoff tickets produced during assistant chat sessions.
  - Displays resolution notes from administrators when an issue is resolved.

### 2. Administrator Console (`/admin`)
- **Primary Audience:** System Administrator (`admin@example.edu` / `demo-password`)
- **Consolidated Ticket Management Console (`AdminTicketPanel`):**
  - Centralized triage board with live operational counters (Pending, Claimed, Resolved).
  - Quick filters (`all`, `pending`, `in_progress`, `resolved`) and search by ticket ID, student name, department, or reason.
  - Ticket details drawer with full context preview, timestamp, and urgency.
  - One-click ticket claiming and resolution submission with administrator notes.
- **RBAC Security Guard:**
  - Protected with an **HTTP 403 Role Clearance Barrier**. Students or unauthenticated users cannot access administrative controls without entering admin credentials.

### 3. Unified Authentication Gateway (`/login`)
- **Dual-Card 1-Click Access:** Direct entry points for "Enter as Student" (routes to `/workspace`) and "Enter as Admin" (routes to `/admin`).
- **Direct Credentials Sign-In:** Automatically inspects the resolved role and routes to the appropriate portal.

---

## 🎨 Theme & Typography System

- **Primary Font:** **Inter** loaded via `next/font/google` (`--font-inter`) with root font scale calibrated to `16px` and message text at `15px/16px` for enhanced reading comfort.
- **Monospace Font:** **JetBrains Mono** (`--font-mono`) for ticket IDs, telemetry, and citations.
- **Dual Themes:** Clean Dark Mode (`#09090b` / `#121215`) and Light Mode (`#ffffff` / `#fafafa`) with seamless theme toggling.
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

## 🔗 Integration with Backend Orchestration

The frontend directly connects to the FastAPI backend (`backend/`):

- **Live Chat Stream:** Messages sent from `MessageComposer` call `/api/v1/chat`, streaming through the LangGraph intent router, domain RAG nodes, and synthesis.
- **Verifiable Citations:** Responses with `retrieved_chunks` automatically render clickable citation badges opening the `CitationDrawer`, displaying verified PDF source documents and page numbers.
- **Clarification Dialogs:** When router confidence is ambiguous, the backend triggers clarification options rendered as interactive chips.
- **Ticket Escalations:** When domain agents flag `human_required = true` or `ticket_id`, the ticket is stored in reactive `TicketContext`, displayed in the student's **My Tickets** view, and made immediately available for triage on the **Admin Console** (`/admin`).

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
│   │   ├── globals.css       # Tailwind v4 theme tokens & dark styles
│   │   ├── layout.tsx        # Inter font configuration & layout shell
│   │   ├── loading.tsx       # Branded gateway archway loading screen
│   │   ├── page.tsx          # Campus wayfinding landing page
│   │   ├── login/
│   │   │   └── page.tsx      # Dual-role authentication gateway
│   │   ├── workspace/
│   │   │   └── page.tsx      # Dedicated Student Workspace (Assistant & My Tickets)
│   │   └── admin/
│   │       └── page.tsx      # Dedicated Administrator Ticket Console
│   ├── components/
│   │   ├── home/             # Editorial campus wayfinding landing components
│   │   ├── ui/               # Core UI components (CampusLoader, Toast)
│   │   ├── StudentTicketsView.tsx # Student ticket manager (Ongoing / Resolved tabs)
│   │   ├── AdminTicketPanel.tsx   # Admin triage, status filters, and resolution console
│   │   ├── TopNav.tsx             # Student navigation bar (Assistant / My Tickets tabs)
│   │   ├── Sidebar.tsx            # Inquiry history drawer
│   │   ├── MessageBubble.tsx      # Conversational turns, checklists, citations
│   │   ├── MessageComposer.tsx    # Floating pill input
│   │   ├── CitationDrawer.tsx     # Slide-out verified institutional policy viewer
│   │   └── auth/
│   │       └── LoginModal.tsx     # Role-switching and login modal
│   ├── context/
│   │   ├── AuthContext.tsx   # Session management, JWT storage, role state
│   │   └── TicketContext.tsx # Shared reactive ticket state (localStorage backed)
│   ├── hooks/
│   │   ├── useChat.ts        # Conversational state machine & backend API bridge
│   │   └── useToast.ts       # Global notification system
│   ├── lib/
│   │   ├── api.ts            # FastAPI integration client (login, me, chat)
│   │   ├── demoFixtures.ts   # Personas and starter suggestions
│   │   └── utils.ts          # Common utility functions & cn helper
│   └── types/
│       └── index.ts          # Centralized TypeScript entity contracts
```
