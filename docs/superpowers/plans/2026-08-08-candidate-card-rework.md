# Candidate Card Rework (Landing) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing page candidate cards info-only (remove per-card CTA button), responsive on mobile (horizontal snap carousel with dot indicators), and simplify program images to a static thumbnail row (no nested scrolling).

**Architecture:** Single-file change in `apps/web/app/page.tsx` — rework `CandidateCard` component and the candidates section container. Desktop keeps 2-col (sm) / 3-col (lg) grid with 3D tilt; mobile (base) becomes a swipeable snap carousel.

**Tech Stack:** Next.js 16, Tailwind v4, motion (existing).

## Global Constraints

- Landing stays info-only — no vote CTAs inside candidate cards (hero + final CTA drive `/student/login`).
- No nested horizontal scroll (remove inner program strip arrows/scroll) — static thumbnail row, up to 3, "+N" overlay if more.
- Mobile-first: carousel cards ~85% viewport width with snap + peek, dot indicators synced to scroll.
- Preserve: 3D tilt, hover lift, staggered `whileInView`, `useReducedMotion`.
- Conventional commits; no code comments unless asked.

---

### Task 1: Rework `CandidateCard`

**Files:** Modify `apps/web/app/page.tsx`

- [ ] **Step 1: Remove the CTA** — delete the `border-t border-dashed` block containing the `Pilih Nomor {n}` Link; card content ends after program thumbnails
- [ ] **Step 2: Static thumbnails** — replace the scroll strip (scrollRef, ‹ › buttons, snap-x inner container) with a static flex row: up to 3 `Image`s (`h-16 w-24 rounded-lg object-cover`), and if `images.length > 3`, show a `+{n-3}` badge overlay on the 3rd thumbnail; keep the "Program" mono label (no arrows)
- [ ] **Step 3: Slightly tighter portrait** — `h-40` (was `h-44`)
- [ ] **Step 4: Verify typecheck/lint/build**

Commit: `refactor: make landing candidate cards info-only with static thumbnails`

---

### Task 2: Mobile Carousel + Responsive Grid

**Files:** Modify `apps/web/app/page.tsx` (candidates section container)

- [ ] **Step 1: Carousel on mobile** — replace `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` with:
  - base: `flex snap-x snap-mandatory overflow-x-auto gap-4 px-1 pb-2` with hidden scrollbar; each card wrapped in `w-[85%] shrink-0 snap-start sm:w-auto`
  - `sm:` -> `grid grid-cols-2`, `lg:` -> `grid grid-cols-3` (keep existing classes for desktop grid)
  - Card wrapper keeps `h-full`
- [ ] **Step 2: Dot indicators (mobile only)** — track scroll index via `onScroll` on the container (`Math.round(scrollLeft / clientWidth)`); render dots row `sm:hidden` under the carousel; click-to-scroll (`scrollTo({ left: i * clientWidth, behavior: 'smooth' })`)
- [ ] **Step 3: Verify typecheck/lint/build**

Commit: `feat: make landing candidate cards a mobile snap carousel with dots`

---

### Task 3: Verification

- [ ] **Step 1:** `pnpm format && format:check && lint && typecheck && build`
- [ ] **Step 2:** Live check via `pnpm dev` — mobile-width HTML check (carousel container present, no `Pilih Nomor` link in candidates section, no scroll arrows); desktop grid intact (sm:grid-cols-2 lg:grid-cols-3)
- [ ] **Step 3:** Update `docs/PROGRESS.md` (Landing candidate card rework row); commit `docs: update progress for landing candidate card rework`
