# CampusOne — Frontend Architecture

## 1. Technology and principles

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Inter**. The browser client talks to the versioned FastAPI API or operates against verified runbook fixtures in demo mode. The UI presents **one unified conversational front door** for students while providing specialized operational workspaces for departmental staff, knowledge managers, and university evaluators.

- **Primary Typography:** **Inter** (`--font-inter`) with root font scale calibrated to `16px` and conversational prose scaled to `15px/16px` for natural reading comfort.
- **Editorial Display Typography:** **Playfair Display** (`--font-serif`) for authoritative, classical institutional headlines paired with bold sans-serif.
- **Monospace Typography:** **JetBrains Mono** (`--font-mono`) reserved strictly for operational telemetry, transaction IDs, latency benchmarks, and vector hashes.
- **Minimalist Aesthetic & Taste Directives:** Pure high-contrast surfaces without decorative gradient text, blur mesh blobs, or rainbow borders. High-contrast monochrome buttons with 6px/8px radii (`rounded-md` / `rounded-xl`), 1px hairlines (`border-[var(--border-subtle)]`), and tactile active scales (`active:scale-[0.98]`).
- **Interactive Geometric Canvas:** High-performance 2D canvas (`InteractiveSubtleBackground`) providing subtle 34px dot matrix springs, cursor proximity constellation hairlines, and tactile click ripples.
- **Theme Engine:** Instant switching between **Dark Mode** and **Light Mode** with automatic transparent logo adaptation.
- **Dashboard Layout:** Expansive `1440px` max-width architecture with synchronized gutters (`px-4 sm:px-8 lg:px-12`) and responsive single-row toolbars.

## 2. Multi-Persona Workspaces & Roles

The frontend provides dedicated, role-tailored workspaces toggled dynamically via the TopNav persona selector:

| Role Key | Persona Name | Audience & Purpose | Key UI Features |
|---|---|---|---|
| `student` | **Alex Rivera** (3rd Year CS) | Undergraduates & graduates resolving tuition dues, Wi-Fi certs, course registration, dorm repairs | Pure conversational stream, zero corporate stats, action checklists, inline citations, floating pill composer, vector knowledge mesh hero |
| `agent` | **Sarah Jenkins** (Support Specialist) | Departmental specialists receiving pre-packaged escalations | Live triage queue, urgency SLA indicators (15m window), conversational context, 1-click template replies |
| `knowledge_admin` | **Dr. Patricia Cole** (University Registrar) | Officers authoring and versioning approved university policy documents | Policy registry catalog, pgvector chunk inspection, document upload & embedding workflow, Grounding Authority badge |
| `executive` | **Dr. Marcus Vance** (VP Academic Evaluation) | Leadership monitoring institutional metrics & routing health | Executive Telemetry KPIs (88.4% accuracy, 76.2% auto-resolution), 5×5 confusion matrix, live edge audit log, 1440px grid |

## 3. Repository structure

```text
frontend/
  public/
    logo.png               # Transparent white archway mark (Dark Mode)
    logo-dark.png          # Transparent deep slate archway mark (Light Mode)
    wordmark.png           # High-resolution branding lockups
  src/
    app/
      layout.tsx           # Inter, JetBrains Mono & Playfair Display font configuration
      globals.css          # Tailwind v4 theme tokens, surface variables, font definitions
      page.tsx             # Public landing page orchestrator (Hero, Services, Centralized Auth Modal)
      workspace/
        page.tsx           # Master workspace orchestrator switching between the 4 persona dashboards
    components/
      home/
      home/
        HomeNavbar.tsx     # Wayfinding header with convergence mark, directory links, student ID
        HomeHero.tsx       # Single front door hero with compact cross-department visual routing demo
        InteractiveSubtleBackground.tsx # High-performance canvas dot matrix, constellation links & click ripples
        CampusOneMark.tsx  # Precision SVG convergence motif (multiple paths → one front door)
        CampusWayfindingSign.tsx # Authentic university architectural signage with room & floor markers
        CampusMapSection.tsx # "Students don't think in departments" statement + interactive central quad transit schematic
        HowItWorks.tsx     # Ultra-compact 4-step horizontal workflow (01 Ask → 02 Understand → 03 Connect → 04 Resolve)
        InstitutionalTrust.tsx # Official university document stationery citation (§7.2 Medical Appeals)
        FinalCta.tsx       # Confident closing call-to-action
        HomeFooter.tsx     # Minimal institutional footer
      auth/
        LoginModal.tsx     # Portaled campus identity dialog (Student Sign-In & All Roles picker)
      TopNav.tsx           # Workspace header with standalone logo, persona switcher & theme toggle
      Sidebar.tsx          # Collapsible navigation drawer with inquiry history & student profile
      MessageBubble.tsx    # Conversational turns, action checklists, citations, TTS audio & feedback
      MessageComposer.tsx  # Floating pill input with voice recording simulation & attachment trigger
      CitationDrawer.tsx   # Slide-out verified institutional handbook reader with radial grounding meter
      AgentQueueView.tsx   # Departmental escalation triage queue with SLA tracking & templates
      KnowledgeAdminView.tsx # Registrar policy management & pgvector embedding publishing console
      AnalyticsView.tsx    # Executive Telemetry dashboard & 5×5 cross-department confusion matrix
      vectors/
        KnowledgeMeshHero.tsx   # Architectural vector constellation illustration for empty state
        GroundingRadialGauge.tsx # Precision 260° circular SVG arc grounding score meter
        RoutingFlowVector.tsx    # Triage pipeline SVG showing query routing path
    lib/
      demoFixtures.ts      # Authoritative runbook test cases, persona profiles & telemetry mocks
      api.ts               # Authenticated API client with token injection & offline fixtures
```

## 3.1 Single Front Door Landing Experience & Campus Wayfinding Architecture

### Campus Wayfinding Design Philosophy
Rather than adhering to generic AI SaaS templates with gradients and excessive marketing paragraphs, the CampusOne landing page is built around authentic **campus wayfinding and directory systems**:
- **CampusOne Convergence Motif (`CampusOneMark.tsx`):** A recurring architectural symbol depicting multiple independent paths converging inward to a single front door.
- **Architectural Signage (`CampusWayfindingSign.tsx`):** Realistic campus wayfinding plaques with building identifiers (`BLDG 04`), floors, room numbers, and subtle department color coding (Registrar in Blue, Bursar in Amber, IT in Violet, Housing in Green).
- **Streamlined Hero (`HomeHero.tsx`):** Massive typography, wayfinding header (`CAMPUSONE → FRONT DOOR / BUILDING 01`), human copy (*"Wrong office? Not your problem."*), and a compact visual routing schematic ($$\text{Question} \to \text{Dispatch} \to \text{Registrar} + \text{Bursar} \to \text{One Answer}$$).
- **Central Quad Transit Schematic (`CampusMapSection.tsx`):** Demonstrates that *"Students don't think in departments. They think in problems."* with an interactive 4-card conceptual transit map connecting Registrar, Bursar, Housing, and IT to sample multi-office issues.
- **Micro Horizontal Sequence (`HowItWorks.tsx`):** Ultra-concise four-stage flow (`01 ASK` &rarr; `02 UNDERSTAND` &rarr; `03 CONNECT` &rarr; `04 RESOLVE`) with zero card fluff.
- **Document Stationery Grounding (`InstitutionalTrust.tsx`):** Official institutional letterhead displaying codified regulations (*Academic Regulations Handbook §7.2*) reinforcing that *"Every answer has receipts."*
- **Minimalist Closing & Footer (`FinalCta.tsx`, `HomeFooter.tsx`):** Confident closure (*"Your campus has dozens of offices. Students need one front door."*) and ultra-lightweight footer.

### Root-Level Overlay Portals
All overlay modals and drawers render via `createPortal(content, document.body)`. This guarantees immunity from CSS containing-block traps created by ancestor elements utilizing `backdrop-filter: blur(...)` or `transform`, ensuring all dialogs remain perfectly centered vertically and horizontally across any device viewport.

## 4. State management

- **TanStack Query:** conversations, messages, analytics, knowledge status, evaluation runs.
- **Local React state:** composer text, selected citation card, active filter, optimistic submit state, streaming token accumulator.
- **URL state:** conversation ID, date filters, domain filter, admin tab.
- **Session state:** secure, httpOnly cookie where possible; mock token storage is memory/session-only in demo mode and never localStorage for production.

Query keys:

```typescript
['conversations', { status, resolutionState }]
['conversation', conversationId]
['analytics-summary', { from, to, domain }]
['knowledge-documents', { status, domain }]
['evaluation-run', runId]
```

After a successful message, invalidate the conversation query and update the message list from the authoritative response. On 409 version conflict or `turn_in_progress`, queue the pending input and show a non-blocking retry indicator.

## 5. Chat behavior & Progressive Streaming

### Normal turn (Progressive SSE)

1. Disable submit while the current request is in flight, buffering subsequent keystrokes.
2. Connect to `POST /conversations/{id}/messages/stream` with `Accept: text/event-stream`.
3. **Progressive Stage Lifecycle:**
   - On `event: stage {"stage":"routing"}`: Render subtle stage chip: `Identifying support area...`.
   - On `event: routed {"domain":"it","confidence":0.95}`: Instantly mount the active domain badge (`IT Support`) with a gentle pulse animation (latency ~1.2s).
   - On `event: stage {"stage":"retrieving"}`: Update chip to `Searching verified 2026 handbook...`.
   - On `event: token`: Stream tokens word-by-word into the message bubble (Time-to-First-Token < 1.8s).
   - On `event: citations`: Mount clickable citation pill badges (`[1]`).
   - On `event: done`: Commit message to TanStack Query cache; re-enable composer.
4. Scroll smoothly to the bottom as tokens stream, pausing auto-scroll if the student manually scrolls up.

### Clarification

Render a highlighted assistant card with the question and optional candidate buttons. Buttons insert a natural-language reply into the composer; they do not bypass the API.

### Handoff

Render reason in plain language, suggested department, reference ID only when one exists, and a `Prepare handoff` action. Show a privacy reminder not to share passwords, OTPs, or card details.

### Multi-domain response

Use one assistant bubble with numbered issue sections. Each section can show domain label and its own citations. Do not render five avatars or imply separate active chats.

## 6. Component contracts

```typescript
type Message = {
  id: string; role: 'user' | 'assistant' | 'system'; content: string;
  outcome?: 'answered' | 'clarification' | 'fallback' | 'handoff' | 'error';
  citations: Citation[]; domains: DomainKey[]; createdAt: string;
};

function MessageBubble(props: {
  message: Message;
  onCitationOpen: (citation: Citation) => void;
})

function MessageComposer(props: {
  disabled: boolean;
  onSubmit: (text: string) => Promise<void>;
})
```

API types are generated manually from the contracts for the prototype and should move to OpenAPI-generated TypeScript types once the backend schema stabilises.

## 7. Visual hierarchy and responsive layout

### Desktop (≥ 1024px)

- **Header (64px / h-16):** CampusOne official standalone transparent logo mark (`public/logo.png` / `public/logo-dark.png`, 32px height) + "CampusOne" title with active operational beacon ("Single Front Door") left, persona switcher dropdown (`Alex Rivera`, `Sarah Jenkins`, `Dr. Patricia Cole`, `Dr. Marcus Vance`) center, Google Material theme toggle (Dark / Light) and `+ New Inquiry` button right.
- **Sidebar (280px, collapsible):** conversation history sorted by `updated_at desc`, status filters (open/resolved/handed_off), optional `What can I ask?` starter prompts from different domains.
- **Main (fluid):** message list with bottom-anchored composer. Max content width 720px centered within the main area for readability.
- **Message metadata:** timestamp, small domain pill only when useful, citation markers as inline badges.

### Tablet (768–1023px)

- Sidebar collapses to an overlay drawer triggered by a hamburger icon.
- Main fills the viewport. Message max-width remains 720px.

### Mobile (< 768px)

- Sidebar is a full-screen sheet on swipe or tap.
- Composer snaps to the bottom of the viewport with a safe-area inset for iOS notch/home indicator.
- Citation cards expand inline rather than opening a separate drawer (avoids modal-on-modal on small screens).
- Domain badges reduce to icon-only pills.
- Admin pages switch from card grid to a single-column stack with collapsible detail sections.

### Chat layout

- User messages align right with a subtle background tint.
- Assistant messages align left with a neutral background.
- System messages (status changes, handoff confirmations) render as centered, de-emphasised banners.
- Citation markers `[1]` render as tappable pill badges inline with the text. On tap/click, the citation card expands below the message or in a side drawer on desktop.

Loading, empty, error, and offline states are designed explicitly. Empty chat suggests three starter prompts from different domains without making domain selection mandatory.

## 8. SSE streaming stage animations

The progressive SSE protocol drives specific visual transitions to give the student immediate feedback:

| SSE Event | UI Transition | Timing Target |
|---|---|---|
| `event: stage {"stage":"routing"}` | Render a subtle stage chip below the user message: `Identifying support area…` with a gentle pulse animation. Composer is disabled. | Appears within 150ms of submit. |
| `event: routed {"domain":"it","confidence":0.95}` | Mount the active domain badge (e.g. `IT Support`) with a brief scale-in animation. Stage chip updates to show the domain name. | ~1.2s after submit. |
| `event: stage {"stage":"retrieving"}` | Stage chip text fades to `Searching verified sources…`. | ~1.5s after submit. |
| `event: stage {"stage":"generating"}` | Stage chip fades out. An empty assistant message bubble appears with a typing indicator (3 animated dots). | ~1.8s after submit. |
| `event: token {"delta":"..."}` | Tokens stream word-by-word into the assistant bubble. Typing indicator is removed on first token. Auto-scroll follows the growing message unless the student has manually scrolled up. | TTFT < 1.8s. |
| `event: citations [...]` | Citation pill badges `[1]`, `[2]` appear inline in the text. A subtle highlight animation draws attention to them. | After final token. |
| `event: done {...}` | Stage chip is fully removed. Composer re-enables. Resolution state updates in the sidebar. Feedback buttons (👍/👎) fade in below the message. | End of turn. |
| `event: error {...}` | Typing indicator/stage chip replaced with an error banner: "Something went wrong. You can try again or request human support." Retry and handoff action buttons. | On stream error. |

Transitions use CSS `transition` with 200ms ease-out for stage chips and 150ms for badge appearances. No layout shifts — stage chips and badges occupy reserved space.

## 9. Error, edge, and offline states

Every error state has a designed recovery path:

| State | Visual | Recovery |
|---|---|---|
| **Network disconnected** | Persistent amber banner at top: `You're offline. Messages will be sent when you reconnect.` Composer remains enabled but submit queues locally. | Auto-retry on reconnect; queued message is submitted with same idempotency key. |
| **Turn in progress (409)** | Toast notification: `Your previous message is still being processed.` Composer remains disabled with a spinner. | Auto-poll until the turn completes; then re-enable. |
| **Version conflict (409)** | Toast: `This conversation was updated. Refreshing…` Conversation auto-refetches. | Client replays the pending message with a new idempotency key after state sync. |
| **Rate limited (429)** | Toast: `Too many messages. Try again in {Retry-After} seconds.` Composer disabled with countdown timer. | Auto-re-enable after countdown. |
| **API unavailable (503)** | Full-width banner: `CampusOne is temporarily unavailable. Your conversations are saved.` | Retry button with exponential backoff. |
| **SSE stream interrupted** | If tokens were partially received, show them with an appended `⚠️ Response interrupted.` label and a `Retry` button. | Retry submits with same idempotency key; backend returns the completed response if it finished. |
| **Empty conversation** | Three starter prompt cards: "How do I reset my password?", "Where can I check my fees?", "Report a maintenance issue." Cards span different domains. | Tapping a card inserts the text into the composer. |
| **No conversations yet** | Illustration with `Start your first conversation` button. | Button creates a new conversation and focuses the composer. |

Never show raw error codes, JSON payloads, stack traces, or internal model outputs to the student. All error text is human-readable.

## 10. Accessibility

### Keyboard navigation

- `Tab` cycles through: sidebar conversations → composer → message actions → citation badges → feedback buttons.
- `Enter` submits in the composer; `Shift+Enter` inserts a newline.
- `Escape` closes any open citation drawer, modal, or overlay.
- Arrow keys navigate within conversation list and clarification options.
- Focus ring is always visible (2px solid, high-contrast colour) and never suppressed.

### Screen readers

- Messages use `role="log"` with `aria-live="polite"` so new messages are announced without interrupting.
- Stage chips and streaming tokens update an `aria-live="assertive"` region only at stage transitions (not per-token).
- Citation badges have `aria-label="Citation 1: IT Account Recovery Guide, Section 2.1"`.
- Clarification cards have `role="radiogroup"` with descriptive labels.
- Domain badges have `aria-label="Routed to IT Support"`.
- Handoff banners have `role="alert"`.

### Contrast and colour

- All text meets WCAG 2.1 AA contrast (4.5:1 for normal text, 3:1 for large text).
- Clarification, handoff, and error states use distinct icons and text labels in addition to colour.
- Domain pill colours have accessible contrast against their background and include a text label, not colour alone.

### Motion

- All animations respect `prefers-reduced-motion: reduce`. When active: stage chips appear instantly without pulse, tokens render in chunks rather than word-by-word, and badge scale-in is disabled.

## 11. Admin pages

### Analytics dashboard layout

```text
┌─────────────────────────────────────────────────────┐
│  Date Range Picker  │  Domain Filter  │  Refresh    │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│ Routing  │ Resolut- │ Clarif-  │ Handoff  │ Source  │
│ Accuracy │ ion Rate │ ication  │   Rate   │Coverage │
│  87.2%   │  76.4%   │  11.8%   │   9.1%   │ 98.6%  │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│              Average Response Time                   │
│              p50: 1.84s  │  p95: 4.21s              │
├─────────────────────┬───────────────────────────────┤
│  Confusion Matrix   │  Top Routing Errors           │
│  (5×5 heatmap)      │  (table: actual→predicted,    │
│                     │   count, example case IDs)    │
├─────────────────────┴───────────────────────────────┤
│  Recent Unresolved Conversations                     │
│  (table: conv ID, state, reason, domain, last turn) │
└─────────────────────────────────────────────────────┘
```

- Metric cards use large numeric display with trend arrows (↑/↓) comparing to the previous period.
- Confusion matrix renders as a colour-scaled heatmap where diagonal cells (correct classifications) are green-tinted and off-diagonal cells (errors) are red-tinted. Hovering a cell shows the count and example case IDs.
- All dashboard data is fetched from `/api/v1/analytics/summary`, `/api/v1/analytics/routing-errors`, and `/api/v1/analytics/unresolved`.
- Filters update all cards and tables simultaneously via TanStack Query key invalidation.

### Knowledge management

Upload form with domain, title, effective dates, audience, and version. Table shows status, chunk count, owner, published version, expiry warning, and publish/archive actions. Only authorised roles see action controls.

### Evaluation

Select dataset version and configuration, start a run, poll status, display accuracy/F1/calibration/resolution, and show confusion matrix. The page links to failed case keys and redacted inputs.

## 12. API client behavior

The client wrapper:

- adds bearer/session credentials;
- adds `X-Request-ID` generated per request;
- adds `Idempotency-Key` for message submission;
- parses the error envelope into typed `ApiError`;
- retries only GETs and safe health requests, with exponential backoff;
- does not retry message POSTs automatically unless the same idempotency key is reused;
- times out chat at 30 seconds and offers retry/handoff.

## 13. Acceptance criteria

- A student can create, reopen, and resolve a conversation from keyboard and mouse.
- Clear, clarification, no-answer, multi-domain, and handoff responses render distinctly.
- Citations are visible without leaving the conversation.
- A student cannot see another user's conversation via route manipulation.
- Admin pages are hidden and server-protected for student roles.
- All error and edge states from section 9 render their designed recovery path.
- The chat interface is usable on a 375px-wide mobile viewport.
- Screen reader announces new messages, stage transitions, and citations correctly.
- `prefers-reduced-motion: reduce` disables all animations.
- Admin dashboard loads and renders all metric cards within 2 seconds.
