# Phase 4: Voting System (Core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core voting flow — student candidate list, detail + confirmation, anonymous vote submission in a DB transaction, one-student-one-vote enforcement, session destroy, and success page.

**Architecture:** NestJS `voting` module guarded by `StudentSessionGuard`; anonymous Vote creation inside a Prisma transaction with `has_voted` + token `is_used` updates; Redis session destroyed after commit; Next.js `/student` portal rewritten as a client-side view state machine (list → detail dialog → confirm dialog → success).

**Tech Stack:** NestJS 11, Prisma 6, ioredis; Next.js 16, TanStack Query, shadcn/ui.

## Global Constraints

- Anonymous Ballot inviolable: `Vote` has no student identity; success page never shows the chosen candidate (`docs/03_DATABASE.md` §7, `docs/05_UI_UX_SPECS.md` §8).
- DB transaction per `docs/03_DATABASE.md` §8: validate election → validate token → validate student → create Vote → `has_voted=true`/`voted_at` → `VotingToken.is_used=true` → commit; rollback on any failure.
- Session destroy after commit (assumption documented: Redis can't join Postgres transaction; TTL backstop).
- Error codes: `ELECTION_NOT_ACTIVE`, `INVALID_CANDIDATE`, `ALREADY_VOTED`, `SESSION_EXPIRED`, `VALIDATION_ERROR`.
- Candidate must belong to the session's election → else `INVALID_CANDIDATE`.
- Rate limiting (voting 3/min) deferred to Phase 6.
- Response envelope `{success, message, data}`; conventional commits; no code comments unless asked.

---

### Task 1: Voting Module — Backend (Service + Controller + Tests)

**Files:**
- Create: `apps/api/src/modules/voting/dto/submit-vote.dto.ts`
- Create: `apps/api/src/modules/voting/voting.service.ts`
- Create: `apps/api/src/modules/voting/voting.controller.ts`
- Modify: `apps/api/src/modules/voting/voting.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/modules/voting/voting.service.spec.ts`

**Interfaces:**
- Consumes: `StudentSessionGuard` (`req.session = {studentId, electionId, nis}`), `RedisService`, `PrismaService`.
- Produces: `GET /voting/candidates`, `POST /voting/submit`, `GET /voting/status`.

- [ ] **Step 1: `dto/submit-vote.dto.ts`** — `candidateId: @IsString @IsNotEmpty`
- [ ] **Step 2: `voting.service.ts`** — `getCandidates(session)` (election ACTIVE → candidates), `getStatus(session)` (`{has_voted:false, electionId, election_status}`), `submit(session, candidateId)` (ACTIVE → candidate same-election → student not voted → `$transaction` create Vote + update student + mark token used → success message), `destroySession(sessionId)`
- [ ] **Step 3: `voting.controller.ts`** — 3 routes with `StudentSessionGuard`; submit clears cookie + destroys session
- [ ] **Step 4: module + app.module registration**
- [ ] **Step 5: `voting.service.spec.ts`** — 5 tests (success; not active; invalid candidate; already voted; candidates not active)
- [ ] **Step 6: verify** `typecheck && lint && test`; commit `feat: add voting module with anonymous vote submission`

---

### Task 2: Frontend — Voting Services

**Files:** Create `apps/web/services/voting.ts` — `getVotingCandidates()`, `getVotingStatus()`, `submitVote(candidateId)`.
Commit: `feat: add voting api services`

---

### Task 3: Frontend — Student Voting Portal (Rewrite `/student`)

**Files:** Modify `apps/web/app/student/page.tsx` (full rewrite).

Client view state machine: loading → already-voted (session expired) → election not active → candidate list (grid, cards with number/photo/names/vision snippet, Detail + Pilih buttons) → detail Dialog → confirm AlertDialog ("Apakah Anda yakin memilih kandidat ini?") → submit mutation → success view (check icon, thanks message, no candidate name) → "Kembali ke Beranda".

Commit: `feat: add student voting portal with candidate list and vote flow`

---

### Task 4: Verification & Docs Closeout

- Full root verification: `format && format:check && lint && typecheck && build && api test`
- Live smoke: student login → candidates → submit → session expired → re-login `ALREADY_VOTED` → verify `Vote` has no student ref → reset → vote again
- Update `docs/04_API_SPECS.md` §7 (token is_used note, session destroy after commit)
- Update `docs/PROGRESS.md` Phase 4 rows
- Commit: `docs: update api spec and progress for phase 4`
