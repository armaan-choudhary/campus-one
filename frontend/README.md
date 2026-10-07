# CampusOne Frontend

The official conversational web application and operational suite for **CampusOne — One Front Door for Everything**.

## 🚀 Overview

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Inter**, CampusOne provides a clean, dual-role architecture that separates the student conversational experience from administrative ticket management into distinct dedicated pages.

---

## 🎭 Dual-Role Architecture & Dedicated Pages

CampusOne strictly distinguishes between two core roles:

### 1. Student Portal (`/workspace`)
- **Primary Audience:** Alex Rivera (`s24cseu1866@bennett.edu.in`) or 1-Click Fast-Track Clearance
- **Conversational Assistant (`Assistant` tab):**
  - Distraction-free conversational stream with zero administrative clutter.
  - Interactive Action Checklists, grounded institutional citations with slide-out `CitationDrawer`, and dynamic clarification options.
  - Floating pill message composer.
  - Pure SVG vector knowledge mesh empty state.
- **Personal Ticket Manager (`My Tickets` tab):**
  - Shows inquiries submitted by the student, split into **All Cases**, **Open Cases**, and **Resolved** tabs.
  - Automatically captures escalated handoff tickets produced during assistant chat sessions and persists them to PostgreSQL.
  - Displays resolution notes from administrators when an issue is resolved, with human-readable timestamps and empty-state guidance.

### 2. Administrator Console (`/admin`)
- **Primary Audience:** System Administrator (`admin@campusone.internal` / `admin1234`) or 1-Click Fast-Track Clearance
- **Consolidated Ticket Management Console (`AdminTicketPanel`):**
  - Centralized triage board with live operational counters (Pending, Claimed, Resolved).
  - Quick filters (`all`, `pending`, `in_progress`, `resolved`) and search by ticket ID, student name, department, or reason.
  - Ticket details drawer with full context preview, timestamp, and urgency.
  - One-click ticket claiming, department reassignment, and resolution submission with administrator notes.
- **Institutional Analytics (`AdminAnalyticsPanel`):**
  - Live charts and metrics reflecting routing confidence, department loads, and SLA resolution times.
- **RBAC Security Guard:**
  - Protected with an **HTTP 403 Role Clearance Barrier**. Students or unauthenticated users cannot access administrative controls without entering admin credentials.

### 3. Unified Authentication Gateway (`/login`)
- **3-Mode Switcher:** Student Access, Staff & Admin, and Student Registration.
- **1-Click Fast-Track Clearance:** Instant exploration credentials for Alex Rivera (Student) and System Administrator.
- **Automated Role Routing:** Seamlessly redirects staff and administrators to `/admin` and students to `/workspace`.

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
- **Ticket Escalations & Lifecycle Sync:** When domain agents flag `human_required = true` or `ticket_id`, tickets are persisted in PostgreSQL via `/api/v1/tickets` and managed via reactive `TicketContext`. Inquiries are immediately reflected across both the student's **My Tickets** view (`/workspace`) and the triage board on the **Admin Console** (`/admin`).

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
│   │   │   └── page.tsx      # Unified 3-way authentication gateway (Student/Admin/Signup)
│   │   ├── workspace/
│   │   │   └── page.tsx      # Dedicated Student Workspace (Assistant & My Tickets)
│   │   └── admin/
│   │       └── page.tsx      # Dedicated Administrator Ticket Console
│   ├── components/
│   │   ├── home/             # Editorial campus wayfinding landing components
│   │   ├── ui/               # Core UI components (CampusLoader, Toast)
│   │   ├── StudentTicketsView.tsx # Student ticket manager (All Cases / Open Cases / Resolved tabs)
│   │   ├── AdminTicketPanel.tsx   # Admin triage, status filters, and resolution console
│   │   ├── AdminAnalyticsPanel.tsx # Administrative operations, SLA, and analytics console
│   │   ├── TopNav.tsx             # Student navigation bar (Assistant / My Tickets tabs)
│   │   ├── Sidebar.tsx            # Inquiry history drawer
│   │   ├── MessageBubble.tsx      # Conversational turns, checklists, citations
│   │   ├── MessageComposer.tsx    # Floating pill input
│   │   ├── CitationDrawer.tsx     # Slide-out verified institutional policy viewer
│   │   └── auth/
│   │       └── LoginModal.tsx     # Role-switching and login modal
│   ├── context/
│   │   ├── AuthContext.tsx   # Session management, JWT storage, role state
│   │   └── TicketContext.tsx # Shared reactive ticket state (PostgreSQL + localStorage cache)
│   ├── hooks/
│   │   ├── useChat.ts        # Conversational state machine & backend API bridge
│   │   └── useToast.ts       # Global notification system
│   ├── lib/
│   │   ├── api.ts            # FastAPI integration client (login, me, chat, tickets)
│   │   ├── demoFixtures.ts   # Personas and starter suggestions
│   │   └── utils.ts          # Common utility functions & cn helper
│   └── types/
│       └── index.ts          # Centralized TypeScript entity contracts
```
