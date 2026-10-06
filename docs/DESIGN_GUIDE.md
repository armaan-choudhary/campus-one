# CampusOne Design System & Style Guide

> **Version:** 2.0  
> **Aesthetic Philosophy:** Editorial Journal meets *Diary of a Wimpy Kid* notebook doodle, balanced with high-contrast modern web execution.  
> **Scope:** Standard design rules derived from the landing page, governing the **Chatbot UI (`/workspace`)**, **Admin Console (`/admin`)**, **Authentication (`/login`)**, and all future pages.

---

## 1. Aesthetic Identity & Core Principles

CampusOne replaces institutional bureaucratic chaos with clarity, warmth, and relatable student humanity. The design system bridges two complementary aesthetics:

1. **Editorial Journal & Modern Precision**:
   - High-contrast typography combining elegant serif headlines with clean geometric sans-serif UI elements.
   - Alternating rhythmic sections: pure crisp white (`#FFFFFF`) and deep pitch black (`#0E0E0E`).
   - Tactile interactive elements: subtle hairline borders, micro-interactions (`active:scale-[0.98]`), and precise spacing.

2. **Diary of a Wimpy Kid / Notebook Doodle Aesthetic**:
   - Authentic Jeff Kinney-inspired black & white ink stick-figure character art capturing relatable student struggles (sweating over rescheduled exams, scratching head over fees, exasperated shouting at dead Wi-Fi).
   - Hand-drawn curved doodle arrows pointing directly to interactive interface elements.
   - Organic handwritten cursive annotations (`Caveat` font) delivering conversational commentary (*"Try a real question."*, *"Clear answers with sources."*, *"One place for every campus question."*).
   - Signature vibrant orange triple slashes (`///`) anchoring section headings and key metrics.

---

## 2. Color Palette & Token System

### 2.1 Surfaces & Backgrounds

| Token / Value | Role | Usage |
|---|---|---|
| `#FFFFFF` (`bg-white`) | **Light Canvas** | Hero section, How It Works, Final CTA, Light Chat Stream canvas. Must be pure white to ensure seamless illustration blending without parchment boxes. |
| `#0E0E0E` (`bg-[#0E0E0E]`) | **Deep Dark Canvas** | Sticky navbar, Problem section, Features & Metrics, Footer, Dark Mode workspace background. |
| `#121316` (`bg-[#121316]`) | **Elevated Dark Surface** | Floating question bar container, Chat message input pill, elevated card containers. |
| `#18191E` (`bg-[#18191E]`) | **Card / Bubble Surface** | Speech bubbles, student scenario cards, chat message assistant bubbles. |
| `#1A1C22` (`bg-[#1A1C22]`) | **Input Well** | Input field background within dark widgets and message composer. |
| `#16171D` (`bg-[#16171D]`) | **Inactive Pill** | Inactive domain filter chips (`border-[#252730]`). |
| `#1C1E26` (`bg-[#1C1E26]`) | **Active Pill** | Selected domain filter chips (`border-[#3F4350]`). |
| `#272932` (`bg-[#272932]`) | **Interactive Control** | Send button, icon buttons (hover: `#343743`). |

### 2.2 Borders & Dividers

| Token / Value | Role | Usage |
|---|---|---|
| `#E4E4E7` / `#D4D2CD` | **Light Border** | 1px border for cards, buttons, and badges on white canvases. |
| `#282A33` / `#23242A` | **Dark Hairline** | 1px border for dark card surfaces, speech bubbles, and dialog containers. |
| `#3F4350` | **Active Border** | Highlighted boundary for active chips, focused inputs, and selected items. |

### 2.3 Accents & Signatures

| Token / Value | Role | Usage |
|---|---|---|
| `#F97316` (Orange) | **Signature Accent** | Eyebrow dash markers (`—`), signature triple slashes (`///`), stat indicators. |
| `#38BDF8` (Cyan / Sky) | **Domain Indicator** | Vertical indicator bar in category tags (`\| Academic`, `\| Finance`, etc.). |
| `#10B981` (Emerald) | **Verified Status** | Sourced citation links, verified policy badges, online connection dots. |
| `#EF4444` (Rose / Red) | **Alert Accent** | Critical IT / deadline escalation alerts, offline status. |

### 2.4 Typography Colors

| Token / Value | Role | Usage |
|---|---|---|
| `#111111` | **Primary Dark Text** | High-contrast headings and body copy on white canvases. |
| `#52525B` / `#71717A` | **Muted Dark Text** | Subtitles, descriptions, step numbers, and social proof on light backgrounds. |
| `#FFFFFF` | **Primary Light Text** | Headings, active pill labels, and emphasized text on dark canvases. |
| `#D4D4D8` / `#A1A1AA` | **Muted Light Text** | Secondary descriptions, inactive pill text, handwritten notes on dark surfaces. |
| `#8E8F94` | **Subtle Micro-copy** | Eyebrows, mono section tags, and assistant metadata labels. |

---

## 3. Typography Hierarchy

```text
Type Hierarchy Matrix:
┌────────────────────┬──────────────────┬───────────────┬───────────────────────────────┐
│ Tier               │ Font Family      │ Weight / Style│ Tracking / Leading            │
├────────────────────┼──────────────────┼───────────────┼───────────────────────────────┤
│ Editorial Headline │ Serif (Playfair) │ Bold + Italic │ tracking-tight leading-[1.08] │
│ Section Heading    │ Sans (Inter)     │ Bold          │ tracking-tight leading-[1.12] │
│ Eyebrow / Tag      │ Mono (JetBrains) │ Semibold/Bold │ tracking-widest uppercase     │
│ Body Copy          │ Sans (Inter)     │ Regular       │ leading-relaxed               │
│ Handwritten Note   │ Cursive (Caveat) │ Regular       │ leading-snug rotate-[-2deg]   │
└────────────────────┴──────────────────┴───────────────┴───────────────────────────────┘
```

### 3.1 Editorial Headline (Serif + Italicized Accent)
The signature brand headline combines bold serif typography with italicized lower-weight accents for punchlines:
```tsx
<h1 className="font-serif font-bold text-4xl sm:text-5xl lg:text-[58px] text-[#111111] leading-[1.08] tracking-tight">
  The campus assistant <br />
  that <span className="italic font-normal">actually</span> helps.
</h1>
```
*Rule:* Always emphasize the key emotional or conversational payoff word in `italic font-normal`.

### 3.2 Eyebrow Label (Mono + Orange Dash)
Every section and major component starts with an uppercase monospace eyebrow:
```tsx
<div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold tracking-widest text-[#71717A] uppercase">
  <span className="text-[#F97316] font-bold text-sm">—</span>
  <span>ONE CAMPUS • EVERY QUESTION</span>
</div>
```

### 3.3 Handwritten Annotations (Caveat Script)
Handwritten notes add conversational commentary, human reassurance, and visual charm:
```tsx
<div className="flex items-center gap-1.5 font-handwritten text-sm text-[#D4D4D8] -rotate-2">
  <span>Try a real question.</span>
  <svg className="w-4 h-6 text-[#D4D4D8]" viewBox="0 0 24 32">...</svg>
</div>
```

---

## 4. Illustration Guidelines (*Diary of a Wimpy Kid* Style)

All graphic art across the application must strictly follow the **Jeff Kinney notebook doodle aesthetic**:

### 4.1 Visual Rules
1. **Bold Ink Linework**: Thick, expressive, hand-drawn black ink contours. No gradient shading, no 3D bevels, no blur effects.
2. **Character Anatomy**:
   - Round head with simple circular eyes and pupil dots.
   - Distinctive round nose and expressive mouth (frown, panic squiggly mouth, yelling mouth).
   - Minimalist hair (Greg's 3 strands, Rodrick's spiky hair, headband with wavy tufts).
   - Noodle arms, stick legs, simple shorts/skirts, and round cartoon shoes.
3. **Background Rule (CRITICAL)**:
   - **Light Sections**: Background MUST be pure solid white (`#FFFFFF`) or transparent RGBA. **NEVER** use off-white, parchment, or beige textured paper backgrounds that create visible rectangular card bounds.
   - **Dark Sections**: Background MUST be pure pitch black (`#0E0E0E` / `#000000`) or transparent RGBA with clean white ink lines.
4. **Visual Scale & Baseline Alignment**:
   - When displaying multiple character portraits horizontally, **all characters must share the same head diameter, eye-level, and baseline grounding**.
   - Do **NOT** burn large multi-line text into the illustration raster image itself. Dialog belongs in HTML speech bubbles so character scale is preserved.

### 4.2 Asset Inventory

| Asset Path | Description | Placement |
|---|---|---|
| `/illustrations/wimpy/hero-wimpy-white.webp` | Greg sitting on steps with laptop, coffee, headphones, and 5 routed department boxes | Hero Section |
| `/illustrations/wimpy/academic-trans.webp` | Stressed girl sweating with backpack | Problem Section / Academic Tickets |
| `/illustrations/wimpy/finance-trans.webp` | Confused student scratching head with cracked piggy bank | Problem Section / Finance Tickets |
| `/illustrations/wimpy/it-trans-v2.webp` | Exasperated student yelling at phone with broken Wi-Fi symbol | Problem Section / IT Helpdesk |
| `/illustrations/wimpy/laptop-wimpy.webp` | Student pointing at laptop showing sourced answer | How It Works / Chatbot Demo |
| `/illustrations/wimpy/campus-wimpy-panorama.webp` | Wide 16:9 quad panorama with students walking towards buildings | Final CTA / Empty State |
| `/illustrations/wimpy/avatar-[1-4].png` | Circular Wimpy Kid character face headshots | Social proof row, Chat avatars |

---

## 5. Signature Micro-Elements

### 5.1 Orange Ticks (`///`)
The signature visual anchor consists of three diagonal slashes in brand orange (`#F97316`):
```tsx
export const OrangeTicks: React.FC<{ count?: number; direction?: 'left' | 'right' }> = ({
  count = 3,
  direction = 'right',
}) => {
  const rotation = direction === 'right' ? '-rotate-12' : 'rotate-12';
  return (
    <div className={`inline-flex items-center gap-1 ${rotation} select-none pointer-events-none`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="w-[3px] h-3.5 bg-[#F97316] rounded-full inline-block" />
      ))}
    </div>
  );
};
```

### 5.2 Domain Indicator Category Pills
Category chips used in search, routing, chat filters, and ticket triage:
```tsx
<button className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono border bg-[#1C1E26] text-white border-[#3F4350]">
  <span className="w-0.5 h-2.5 bg-[#38BDF8] rounded-full inline-block" />
  <span>Academic</span>
</button>
```

---

## 6. Application Rules: Chatbot UI (`/workspace`)

The Chatbot interface is the core utility of CampusOne. It is typeset as a **physical, beautifully typeset university service desk** rather than a generic SaaS dashboard:

### 6.1 Strict 3-Tier Typographic Hierarchy
1. **Level 1 (Dominant Headlines):** **Playfair Display** (`font-serif`, 58–62px, leading 1.04) for primary page headlines (*"What can we help you figure out?"*).
2. **Level 2 (Inquiry Focus):** **Playfair Display** (`font-serif`, 18–20px) for suggested student questions and active message headlines.
3. **Level 3 (Metadata & System Eyebrows):** **Geist Mono** (`font-mono`, 10–12px) for department telemetry, routing badges, timestamps, citation tags, and status markers.

### 6.2 Hero Composition (Asymmetric 58/42)
- **Left Column (58%, `lg:col-span-7`):**
  - Dominated by 62px Playfair Display headline: *"What can we help you figure out?"*
  - Supporting editorial subtitle: *"Your question doesn't need to belong to a department. It just needs to be a problem."*
  - Restrained department metadata line: `Academic · Finance · IT · Facilities · Administration` in clean Geist Mono with hairline separators.
- **Right Column (42%, `lg:col-span-5`):**
  - Character illustration breathing directly against pure `#0B0B0B` dark background without containers, cards, or borders.
  - Integrated editorial annotation: `ROUTES AUTOMATICALLY →` in signature `#FF7A00` pointing toward the routing diagram.
- **Vertical Rhythm:** Tightened 60–80px vertical spacing (`mt-14 sm:mt-16`) between hero and questions section.

### 6.3 Suggested Inquiries (Clean Editorial Rows)
- **Structure:** 4 full-width horizontal rows separated by hairline `#24221F` rules (NO cards, NO backgrounds, NO pills).
- **Typography:** 18–20px Playfair Display serif.
- **Scenarios:**
  - *"I missed my midterm after being hospitalized. What can I do?"* &rarr; `ACADEMIC REGISTRAR →`
  - *"Can I get a refund for my hostel fee?"* &rarr; `STUDENT ACCOUNTS →`
  - *"Wi-Fi isn't working in my hostel."* &rarr; `IT HELPDESK →`
  - *"I lost my ID card, how do I get a new one?"* &rarr; `ADMINISTRATION →`
- **Subtle Micro-Interaction Hover:**
  - Question text shifts 2–4px horizontally (`group-hover:translate-x-1.5`).
  - Arrow turns orange (`#FF7A00`).
  - Row border brightens slightly (`border-[#3D3A35]`).
  - Zero card transformations, zero glows.

### 6.4 Substantial Writing Desk Composer
- **Physical Feel:** Designed like a solid dark oak writing desk on the page.
- **Dimensions & Surface:**
  - Width: **760px** (`max-w-[760px]`), visually aligning with the question list.
  - Height & Padding: `p-4 sm:p-5`, `min-h-[64px]` textarea.
  - Styling: Dark matte `#111111` surface, hairline `#24221F` border, minimal radius (`rounded-lg`), simple `ArrowRight` dispatch button. No glow, no shadows, no gradients, no glass effects.
- **Dual Placement Flow:**
  - **Empty State:** Sits in natural document flow (`mt-12 sm:mt-14`) following the questions (`Hero ↓ Questions ↓ Large Confident Composer`).
  - **Active Conversation:** Docks cleanly to viewport bottom with sticky backdrop blur.

### 6.5 Quiet Catalog Sidebar
- Fixed width at **215px** (`w-[215px]`).
- Softened empty state contrast (`text-[#8D8A83]/40` and `/25`) so it recedes into the perimeter when no inquiries are cataloged.

### 6.6 Message Stream & Conversational Turns
- **Student Inquiry:** Editorial quotation block with `— INQUIRY //` header and orange `YOU` tag.
- **Assistant Response:** Editorial layout with `— CAMPUSONE RESPONSE //` header, telemetry box (`ROUTED TO: [domain] · [confidence]%`), numbered action steps (`01`, `02`, `03`), grounded source citations, and understated actions (`copy`, `listen`, `report issue`).

---

## 7. Application Rules: Admin Console (`/admin`)

The administrative ticket triage console handles escalations that require human staff intervention:

1. **Header & Navigation**:
   - Minimalist dark navbar with CampusOne logo, "Admin Triage Console" monospace eyebrow, and status indicator dot (Green = Live Relay Active).
2. **Ticket Cards**:
   - Top row: Ticket ID in monospace (`TICK-1042`), domain pill with cyan indicator bar (`| IT Helpdesk`), and time elapsed.
   - Student inquiry quote in handwritten style or clean serif quotation:
     `"Wi-Fi isn't working in my hostel."`
   - Routing telemetry: Showing auto-detected department, confidence score (`98%`), and assigned triage queue.
3. **Action Triggers**:
   - `Claim Ticket`: Transitions status to `in_progress`.
   - `Resolve & Notify Student`: Markdown resolution notes field with quick-reply templates.

---

## 8. Do's and Don'ts Checklist

| Do | Don't |
|---|---|
| Use pure `#FFFFFF` background for all light illustration sections. | Don't use off-white, parchment, or cream cards behind illustrations. |
| Use italicized `font-serif` for headline punchlines. | Don't use plain sans-serif everywhere or italicize the entire headline. |
| Use Jeff Kinney stick-figure line art with thick black/white ink. | Don't use generic corporate SaaS vector clip art or colorful 3D clay characters. |
| Align character head scales and feet baselines across columns. | Don't let one character be 50% smaller due to uncropped floating text. |
| Put speech bubbles and dialog into semantic HTML/CSS cards. | Don't burn uneditable raster text directly into illustration images. |
| Add signature orange ticks (`///`) and curved doodle arrows to anchor UI. | Don't use random decorative shapes, drop shadows, or heavy blur gradients. |
| Include verifiable source citation links (`Source: ... ↗`) in AI answers. | Don't output raw unsourced conversational AI text blocks. |

---

*This design guide is the single source of truth for all frontend engineering across CampusOne.*
