# CampusOne — Frontend Architecture

## 1. Technology and Principles

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Inter**, **Playfair Display**, and **Geist Mono**. The frontend delivers a strictly segregated dual-role web architecture where the student conversational experience and administrative ticket management load on **different dedicated pages**.

- **Design System & Style Guide:** All visual aesthetics, tokens, typography, illustration rules, and component patterns are codified in [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) (or project root [`DESIGN_GUIDE.md`](../DESIGN_GUIDE.md)).
- **Strict 3-Tier Typographic Hierarchy:**
  - **Level 1 (Dominant Headlines):** **Playfair Display** (`font-serif`, 58–62px, leading 1.04) for editorial questions and headlines.
  - **Level 2 (Inquiry Focus):** **Playfair Display** (`font-serif`, 18–20px) for student scenarios and suggested inquiries.
  - **Level 3 (Metadata & System Eyebrows):** **Geist Mono** (`font-mono`, 10–12px) for department telemetry, timestamps, citation tags, and status markers.
  - **Body Copy:** **Inter** (`font-sans`) for crisp legibility across prose and checklist steps.
- **Aesthetic Identity:** Editorial Journal meets hand-drawn notebook illustration, executed as a physical, typeset university service desk. Pure `#0B0B0B` dark canvas, warm white `#F5F3ED` typography, hairline `#24221F` borders, and purposeful `#FF7A00` orange accents.
- **Single Window Isolation:** Student operations and administrative operations exist on separate routes (`/workspace` vs `/admin`), preventing accidental cross-talk and UI clutter.

---

## 2. Dual-Role Architecture & Dedicated Pages

The application strictly models two roles, each mapped to a dedicated page:

| Role Key | Primary Account | Dedicated Page | Key Capabilities |
|---|---|---|---|
| `student` | **Alex Rivera** (`student@example.edu`) | [`/workspace`](../frontend/src/app/workspace/page.tsx) | Sleek obsidian dark canvas (`#0A0A0D`), unified header with warm `#FF7A00` accents, common prompt suggestion cards above input, docked bottom composer with voice/attachment support, docked Official Record Inspector side panel, and personal **My Tickets** manager. |
| `admin` | **System Administrator** (`admin@example.edu`) | [`/admin`](../frontend/src/app/admin/page.tsx) | Centralized ticket triage console, live status indicators (Pending vs Claimed), search & status filtering (`pending`, `in_progress`, `resolved`), ticket claiming, and resolution note submission. Protected by HTTP 403 barrier. |

### Central Authentication Gateway: `/login`

A unified authentication page ([`/login`](../frontend/src/app/login/page.tsx)) provides:
1. **Student Portal Card:** 1-click exploration routing directly to `/workspace`.
2. **Administrative Console Card:** 1-click exploration routing directly to `/admin`.
3. **Credentials Form:** Email/password input that dynamically resolves role and routes to the appropriate portal.

---

## 3. Student Workspace Composition (`/workspace`)

The Student Workspace is engineered as a high-precision campus intelligence desk:

1. **Header & Ambient Backlight:**
   - Soft radial ambient glow (`radial-gradient(ellipse 80% 45% at 50% 0%, rgba(255,122,0,0.06), transparent 70%)`) providing subtle depth on the `#0A0A0D` canvas.
   - Clean institutional eyebrow: glowing `#FF7A00` status indicator dot with `Student Assistant` monospace tag.
   - Dominant title: Playfair serif *"Let’s figure it out."* with signature amber accent period.

2. **Common Student Inquiries (2x2 Grid):**
   - 4 card prompts positioned cleanly **above** the input section.
   - Card styling: Obsidian surface (`#121317/85`), `#22232B` border, subtle top-edge hover glow (`via-[#FF7A00]/40`), and animated `Ask →` prompt indicator.
   - Pure inquiry phrasing without pre-assigned department tags so students can ask naturally without classifying their problem.

3. **Docked Precision Message Composer:**
   - Consistently docked at the bottom of the viewport with a subtle gradient top-edge hairline (`via-[#FF7A00]/30`).
   - Integrated utilities: Document attachments (`.pdf`, `.png`, `.doc`), Web Speech API voice dictation (`Mic`), command dispatch (`⌘ + Enter`), and amber submit glow.
   - Auto-expands up to 140px and scrolls smoothly without shifting surrounding elements.

4. **Docked Official Record Inspector (`CitationDrawer.tsx`):**
   - Fixed docked right inspection panel (`w-[440px] xl:w-[480px]`) displaying verified university policy records.
   - 2x2 Authority Grid: Authority/Custodian, Effective Date, Record ID, and Grounding Match Score.
   - Verbatim excerpt highlighting with subclause badge, FERPA compliance tag, copy citation utility, and direct action dispatch.

5. **Quiet Catalog Sidebar (`Sidebar.tsx`):**
   - 215px collapsible drawer (`w-[215px]`) for conversation history navigation.
   - Automatically collapses or recedes into the perimeter to maximize workspace focus.

---

## 4. Repository Structure

```text
frontend/
├── public/
│   ├── illustrations/
│   │   └── wimpy/             # Hand-drawn editorial character and department illustrations
│   ├── logo.png               # Transparent white archway mark
│   └── wordmark.png           # High-resolution branding lockups
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Font configuration (Inter, Playfair Display, Geist Mono)
│   │   ├── globals.css        # Tailwind v4 theme tokens and color variables
│   │   ├── page.tsx           # Campus wayfinding editorial landing page
│   │   ├── login/
│   │   │   └── page.tsx       # Unified dual-role authentication gateway
│   │   ├── workspace/
│   │   │   └── page.tsx       # Dedicated Student Portal (Editorial Workspace & My Tickets)
│   │   └── admin/
│   │       └── page.tsx       # Dedicated Administrator Ticket Console
│   ├── components/
│   │   ├── home/              # Landing page editorial sections:
│   │   │   ├── EditorialNavbar.tsx     # Sticky dark header with logo and portal CTA
│   │   │   ├── EditorialHero.tsx       # Editorial serif hero with Wimpy character illustration
│   │   │   ├── ProblemSection.tsx      # Student scenarios with AssistantPreview
│   │   │   ├── AssistantPreview.tsx    # Interactive demo assistant card
│   │   │   ├── HowItWorksSection.tsx   # 3-step routing workflow
│   │   │   ├── FeaturesSection.tsx     # Built for real campuses & performance statistics
│   │   │   ├── FinalCtaSection.tsx     # Comprehensive office directory & final CTA
│   │   │   ├── EditorialFooter.tsx     # Minimalist dark editorial footer
│   │   │   ├── CampusOneMark.tsx       # Minimal geometric monogram
│   │   │   └── HandwrittenElements.tsx # Stylized annotations and doodle accents
│   │   ├── ui/                # Core UI primitives (CampusLoader, Toast)
│   │   ├── StudentTicketsView.tsx # Student ticket manager (Ongoing / Resolved tabs)
│   │   ├── AdminTicketPanel.tsx   # Consolidated admin ticket triage & resolution console
│   │   ├── TopNav.tsx         # Workspace navigation bar (Assistant vs My Tickets tabs)
│   │   ├── Sidebar.tsx        # Quiet 215px inquiry catalog drawer
│   │   ├── MessageBubble.tsx  # Message turns, checklists, citations, clarification cards (with deduplicated prompt display), and issue reporting
│   │   ├── MessageComposer.tsx # 760px writing desk composer
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
│   │   ├── demoFixtures.ts    # Personas, suggested questions, and mock fixtures
│   │   └── utils.ts           # Utility functions and classname merger
│   └── types/
│       └── index.ts           # Centralized TypeScript entity contracts
```

---

## 5. State Management Architecture

### 1. `AuthContext.tsx`
- Manages user authentication state, access tokens, and user role (`'student' | 'admin'`).
- Handles automatic session initialization and JWT persistence in `localStorage` (`campusone_access_token`, `campusone_active_role`).
- Supports both credential authentication (`/auth/login`) and self-service student registration (`/auth/register`).
- Enforces role checks (`hasRole('admin')`).

### 2. `TicketContext.tsx`
- Provides reactive shared state for handoff tickets across student and administrator views.
- Synchronizes with `localStorage` so tickets created by assistant handoffs in `/workspace` instantly appear in `/admin`.
- Exposes mutations:
  - `addTicket(ticket)`: Registers new escalated handoff tickets.
  - `claimTicket(ticketId, adminName)`: Transitions ticket from `pending` to `in_progress`.
  - `resolveTicket(ticketId, note)`: Transitions ticket to `resolved` and timestamps resolution.

### 3. `useChat.ts` & `lib/api.ts`
- Drives the conversational turn state machine.
- Communicates directly with FastAPI backend via `POST /api/v1/chat`.
- Supports conversational restoration on session initialization via `GET /api/v1/chat/history`, rehydrating previously saved message turns from LangGraph's PostgreSQL checkpoint store.
- Manages multi-stage thinking indicator (`Detecting intent` &rarr; `Querying pgvector MMR` &rarr; `Synthesizing verified response`).
- Parses grounded citations, checklist items, and handoff tickets.

---

## 6. Security & Role Boundaries

- **HTTP 403 Role Clearance Barrier:** When `/admin` is accessed by an unauthenticated visitor or student role, an authorization screen prevents access and requires administrator credentials.
- **TopNav Segregation:** The single-window role switcher has been eliminated. `/workspace` displays student tabs (**Assistant** and **My Tickets**), while `/admin` renders an administrator operational header with live queue counts and sign-out controls.
- **Overlay Portals:** All modals and drawers (`LoginModal`, `CitationDrawer`) render through `createPortal(..., document.body)` to avoid clipping and CSS stacking context issues.
