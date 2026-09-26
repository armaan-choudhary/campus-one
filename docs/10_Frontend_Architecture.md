# CampusOne — Frontend Architecture

## 1. Technology and Principles

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Inter**. The frontend delivers a strictly segregated dual-role web architecture where the student conversational experience and administrative ticket management load on **different dedicated pages**.

- **Primary Typography:** **Inter** (`--font-inter`) with root font scale calibrated to `16px` and conversational prose scaled to `15px/16px` for natural reading comfort.
- **Monospace Typography:** **JetBrains Mono** (`--font-mono`) reserved strictly for ticket identifiers, citations, and status tags.
- **Minimalist Aesthetic:** High-contrast surfaces without decorative rainbow gradients or blur mesh blobs. High-contrast buttons with 6px/8px radii (`rounded-md` / `rounded-xl`), 1px hairlines (`border-[var(--border-subtle)]`), and tactile active scales (`active:scale-[0.98]`).
- **Theme Engine:** Instant switching between **Dark Mode** (`#09090b` / `#121215`) and **Light Mode** (`#ffffff` / `#fafafa`) with synchronized theme tokens.
- **Single Window Isolation:** Student operations and administrative operations exist on separate routes (`/workspace` vs `/admin`), preventing accidental cross-talk and UI clutter.

---

## 2. Dual-Role Architecture & Dedicated Pages

The application strictly models two roles, each mapped to a dedicated page:

| Role Key | Primary Account | Dedicated Page | Key Capabilities |
|---|---|---|---|
| `student` | **Alex Rivera** (`student@example.edu`) | [`/workspace`](../frontend/src/app/workspace/page.tsx) | Clean conversational stream, vector knowledge mesh empty state, inline verifiable citations, clarification chips, and a personal **My Tickets** manager (Ongoing & Resolved tabs). |
| `admin` | **System Administrator** (`admin@example.edu`) | [`/admin`](../frontend/src/app/admin/page.tsx) | Centralized ticket triage console, live status indicators (Pending vs Claimed), search & status filtering (`pending`, `in_progress`, `resolved`), ticket claiming, and resolution note submission. Protected by HTTP 403 barrier. |

### Central Authentication Gateway: `/login`

A unified authentication page ([`/login`](../frontend/src/app/login/page.tsx)) provides:
1. **Student Portal Card:** 1-click exploration routing directly to `/workspace`.
2. **Administrative Console Card:** 1-click exploration routing directly to `/admin`.
3. **Credentials Form:** Email/password input that dynamically resolves role and routes to the appropriate portal.

---

## 3. Repository Structure

```text
frontend/
├── public/
│   ├── logo.png               # Transparent white archway mark (Dark Mode)
│   ├── logo-dark.png          # Transparent deep slate archway mark (Light Mode)
│   └── wordmark.png           # High-resolution branding lockups
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Inter font configuration and layout wrapper
│   │   ├── globals.css        # Tailwind v4 theme tokens and color variables
│   │   ├── page.tsx           # Campus wayfinding landing page
│   │   ├── login/
│   │   │   └── page.tsx       # Unified dual-role authentication gateway
│   │   ├── workspace/
│   │   │   └── page.tsx       # Dedicated Student Portal (Assistant Chat & My Tickets)
│   │   └── admin/
│   │       └── page.tsx       # Dedicated Administrator Ticket Console
│   ├── components/
│   │   ├── home/              # Landing page wayfinding sections
│   │   ├── ui/                # Core UI components (CampusLoader, Toast)
│   │   ├── StudentTicketsView.tsx # Student ticket manager (Ongoing / Resolved tabs)
│   │   ├── AdminTicketPanel.tsx   # Consolidated admin ticket triage & resolution console
│   │   ├── TopNav.tsx         # Student navigation bar (Assistant vs My Tickets tabs)
│   │   ├── Sidebar.tsx        # Inquiry history drawer
│   │   ├── MessageBubble.tsx  # Message turns, checklists, and citations
│   │   ├── MessageComposer.tsx # Floating pill message composer
│   │   ├── CitationDrawer.tsx # Slide-out verified institutional policy reader
│   │   └── auth/
│   │       └── LoginModal.tsx # Role-switching and login modal
│   ├── context/
│   │   ├── AuthContext.tsx    # Session management, JWT tokens, active role state
│   │   └── TicketContext.tsx  # Reactive ticket store backed by localStorage
│   ├── hooks/
│   │   ├── useChat.ts         # Conversational state machine & backend API bridge
│   │   └── useToast.ts        # Global notification system
│   ├── lib/
│   │   ├── api.ts             # FastAPI client (auth, current user, chat)
│   │   ├── demoFixtures.ts    # Personas and starter suggestions
│   │   └── utils.ts           # Utility functions and classname merger
│   └── types/
│       └── index.ts           # Centralized TypeScript entity contracts
```

---

## 4. State Management Architecture

### 1. `AuthContext.tsx`
- Manages user authentication state, access tokens, and user role (`'student' | 'admin'`).
- Handles automatic session initialization and JWT persistence in `localStorage` (`campusone_access_token`, `campusone_active_role`).
- Enforces role checks (`hasRole('admin')`).

### 2. `TicketContext.tsx`
- Provides reactive shared state for handoff tickets across student and administrator views.
- Synchronizes with `localStorage` so tickets created by assistant handoffs in `/workspace` instantly appear in `/admin`.
- Exposes mutations:
  - `addTicket(ticket)`: Registers new escalated handoff tickets.
  - `claimTicket(ticketId, adminName)`: Transitions ticket from `pending` to `in_progress`.
  - `resolveTicket(ticketId, note)`: Transitions ticket to `resolved` and timestamps resolution.

### 3. `useChat.ts`
- Drives the conversational turn state machine.
- Communicates directly with FastAPI backend via `POST /api/v1/chat`.
- Manages multi-stage thinking indicator (`Detecting intent` &rarr; `Querying pgvector MMR` &rarr; `Synthesizing verified response`).
- Parses grounded citations, checklist items, and handoff tickets.

---

## 5. Security & Role Boundaries

- **HTTP 403 Role Clearance Barrier:** When `/admin` is accessed by an unauthenticated visitor or student role, an authorization screen prevents access and requires administrator credentials.
- **TopNav Segregation:** The single-window role switcher has been eliminated. `/workspace` displays student tabs (**Assistant** and **My Tickets**), while `/admin` renders an administrator operational header with live queue counts and sign-out controls.
- **Overlay Portals:** All modals and drawers (`LoginModal`, `CitationDrawer`) render through `createPortal(..., document.body)` to avoid clipping and CSS stacking context issues.
