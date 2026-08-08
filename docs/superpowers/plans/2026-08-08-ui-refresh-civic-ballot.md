# UI Refresh Implementation Plan: "Civic Ballot" Identity

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the entire frontend with a "Civic Ballot" visual identity — blue primary tokenized, serif display headings, ballot-card motif in the student flow, dark mode (default light), and consistent admin polish. UI only, zero backend changes.

**Architecture:** Design tokens in `globals.css`; `next-themes` provider (already installed); shared components; per-page restyles. Hardcoded `blue-*` classes migrated to `bg-primary`/`text-primary` tokens.

**Tech Stack:** Tailwind v4 (oklch tokens), next-themes, next/font (Source Serif 4 + Geist), shadcn/ui, lucide.

## Global Constraints

- UI only — no backend/API changes.
- Blue = `--primary` token; 0 hardcoded blue classes remaining.
- Dark mode via next-themes, `defaultTheme="light"`, `attribute="class"`.
- Animations ≤200ms.
- No admin mention on student-facing pages.
- Docs updated first (`docs/05_UI_UX_SPECS.md`) before code.
- Conventional commits; no code comments unless asked.

---

### Task 1: Design Tokens + Fonts + Theme Provider
- `globals.css`: light `--primary: oklch(0.546 0.216 260.4)`, `--primary-foreground`, `--ring`, `--sidebar-primary`; dark variants `oklch(0.623 0.17 260.4)`; add `--hero-tint` for landing gradient
- `layout.tsx`: add `Source_Serif_4` (`--font-heading`), wrap with `<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>`
- Verify `next typegen && typecheck && lint && build`; commit `style: add blue primary tokens, display serif font, and theme provider`

### Task 2: Shared Components
Create: `components/ui/ballot-stamp.tsx` (status pill, dashed border), `countdown-pill.tsx` (mono interval, no sync setState), `stat-card.tsx` (label/value/accent), `page-header.tsx` (serif title + eyebrow + description), `theme-toggle.tsx` (sun/moon via useTheme)
Commit `feat: add civic ballot shared ui components`

### Task 3: Landing Hero + Student Login
- `app/page.tsx`: hero with serif headline "Pilih Pemimpin OSIS-mu", mono eyebrow, BallotStamp status, info row, primary CTA; blue radial tint + dot grid bg; no admin mention
- `app/student/login/page.tsx`: card family, serif heading, mono token input, red error alert, back link
Commit `feat: redesign landing hero and student login with ballot identity`

### Task 4: Student Voting Portal (Ballot Cards)
- `app/student/page.tsx`: serif header + CountdownPill + logout; ballot cards (blue number plaque, serif chairman, dashed divider, Detail/Pilih); hover lift; ballot-styled confirm dialog; animated CSS check success; migrate hardcoded blues
Commit `feat: redesign student voting portal with ballot cards`

### Task 5: Admin Login + Sidebar + Theme Toggle
- `app/admin/login/page.tsx`: card family, serif heading
- `components/admin/sidebar.tsx`: `bg-primary` active, section labels, mono username, ThemeToggle, red logout
Commit `feat: polish admin login and sidebar with theme toggle`

### Task 6: Admin Pages Polish
- Dashboard (`app/admin/page.tsx`): PageHeader, StatCards (default/green/orange/blue), blue progress, CountdownPill, class/major rows
- Tables: token badges, hover rows, consistent buttons
- Results (`app/admin/results/page.tsx`): winner card + serif name + "Pemenang" badge, `bg-primary` bars, winner green
Commit `feat: polish admin dashboard, tables, and results pages`

### Task 7: Blue Migration Sweep + Verification + Docs
- grep `blue-` in apps/web → replace all with tokens
- Update `docs/05_UI_UX_SPECS.md` (Visual Identity: Civic Ballot section)
- Full root verify: `format && format:check && lint && typecheck && build && api test`
- Live check via `pnpm dev` (hero renders, toggle flips .dark)
- Update `docs/PROGRESS.md`; commit `docs: document ui refresh and update progress`
