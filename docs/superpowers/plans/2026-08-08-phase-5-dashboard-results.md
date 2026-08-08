# Phase 5: Dashboard & Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build admin dashboard (participation statistics, per-class/major progress, countdown) and results (ranking, PDF/Excel export) with closed-election enforcement.

**Architecture:** NestJS `dashboard` module (summary/classes/majors) + `report` module (results + exports); vote counts always from `Vote` table; pdfkit for PDF; Next.js dashboard upgrade + new `/admin/results` page.

**Tech Stack:** NestJS 11, Prisma 6, pdfkit, xlsx; Next.js 16, TanStack Query, shadcn/ui (progress).

## Global Constraints

- Vote counts from `Vote` table, never cache (`docs/03_DATABASE.md` §15).
- Results only when election `CLOSED` → `ELECTION_NOT_CLOSED` (new documented error code).
- Dashboard never shows candidate results while ACTIVE.
- All endpoints admin-guarded, `?electionId=` param.
- Exports via `@Res()` + `headersSent` interceptor skip (existing pattern).
- Conventional commits; no code comments unless asked.

---

### Task 1: Backend — Dashboard Module
- `dashboard.service.ts`: `summary(electionId)` (total_students, already_voted, not_voted, total_votes, participation_rate %, status), `byClass`, `byMajor` (groupBy class_name/major with has_voted counts)
- `dashboard.controller.ts`: `GET /dashboard/summary|classes|majors` (admin-guarded, `@Query('electionId')`)
- module + app.module registration; `dashboard.service.spec.ts`
- Verify `typecheck && lint && test`; commit `feat: add dashboard summary and participation statistics`

### Task 2: Backend — Report/Result Module
- Deps: `pdfkit`, `@types/pdfkit`
- `report.service.ts`: `getResults` (ensureClosed → candidate ranking with votes/percentage sorted desc + total), `exportExcel` (xlsx via buildExcelBuffer), `exportPdf` (PDFKit buffer)
- `report.controller.ts`: `GET /results`, `GET /results/export/excel`, `GET /results/export/pdf`
- module + app.module registration; `report.service.spec.ts` (not-closed rejection, ranking, zero votes)
- Verify + commit `feat: add result ranking with pdf and excel export`

### Task 3: Frontend — Services + Progress
- `services/dashboard.ts`, `services/results.ts` (apiFetchBlob + download helper)
- `pnpm.cmd dlx shadcn@latest add progress --yes`
- Commit `feat: add dashboard and results api services`

### Task 4: Frontend — Dashboard Upgrade (`app/admin/page.tsx`)
- ElectionSelect, summary/classes/majors queries, stat cards, participation Progress bar, live countdown to end_at (interval, ACTIVE only), per-class/major progress lists, empty/loading states
- Commit `feat: upgrade admin dashboard with participation stats and countdown`

### Task 5: Frontend — Results Page (`app/admin/results/page.tsx` + sidebar)
- Lock screen when `ELECTION_NOT_CLOSED`; ranking table (Peringkat, No Urut, Kandidat, Suara, Persentase); CSS bar chart; Export PDF/Excel buttons; empty state
- Commit `feat: add admin results page with ranking and exports`

### Task 6: Verification & Docs Closeout
- Full root verification
- Live smoke: start election → vote → summary/classes/majors; results blocked while ACTIVE; close → results ranked; exports download; web pages render
- Update `docs/04_API_SPECS.md` (electionId params, ELECTION_NOT_CLOSED, result shape) + `docs/PROGRESS.md`
- Commit `docs: update api spec and progress for phase 5`
