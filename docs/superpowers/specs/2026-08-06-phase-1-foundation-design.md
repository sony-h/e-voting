# Phase 1 — Project Foundation Design

E-Voting OSIS System

Date: 2026-08-06

Status: Approved

---

## 1. Objective

Build the project foundation for the E-Voting OSIS monorepo: tooling, shared packages, Docker infrastructure, and scaffolding for frontend and backend apps. Everything must run locally and build successfully (Phase 1 exit criteria from `06_DEVELOPMENT_ROADMAP.md`).

## 2. Scope

Included:

- Turborepo monorepo setup with pnpm workspaces
- `apps/web` — Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- `apps/api` — NestJS + TypeScript + Prisma ORM
- `packages/types` — shared domain types and constants
- `packages/eslint-config` — shared ESLint config
- `packages/tsconfig` — shared TypeScript presets
- Prisma schema with all 7 tables (Election, Student, Candidate, VotingToken, Vote, AuditLog, Settings)
- Docker Compose for PostgreSQL 16 and Redis 7
- Environment configuration (`.env.example` for both apps)
- ESLint, Prettier, Husky, lint-staged, Commitlint
- GitHub Actions CI (build + lint)
- `PROGRESS.md` initialized

Excluded (later phases):

- All business features (auth, election CRUD, voting, dashboard, results)
- Test suites
- Deployment config

## 3. Repository Structure

```text
e-voting/
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # NestJS backend
├── packages/
│   ├── types/                # Shared domain types
│   ├── eslint-config/        # Shared ESLint config
│   └── tsconfig/             # Shared TS presets
├── docker/
│   └── docker-compose.yml    # PostgreSQL + Redis
├── .github/workflows/ci.yml  # Build + lint
├── .husky/                   # Git hooks
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── docs/                     # Existing docs (source of truth)
```

## 4. Key Decisions

| Item | Decision | Rationale |
|------|----------|-----------|
| Monorepo tool | Turborepo | Industry standard, caching, parallel builds |
| Package manager | pnpm | Fast, strict, works with Turborepo |
| Frontend | Next.js App Router + TS + Tailwind + shadcn/ui | Per `02_SYSTEM_ARCHITECTURE.md` |
| Backend | NestJS + Prisma | Per `02_SYSTEM_ARCHITECTURE.md` |
| Database | PostgreSQL 16 (Docker) | Per architecture doc |
| Cache | Redis 7 (Docker) | Per architecture doc |
| Lint/format | ESLint + Prettier (shared configs) | Per roadmap Phase 1 |
| Git hooks | Husky + lint-staged + commitlint | Per roadmap Phase 1 |
| CI | GitHub Actions (build + lint) | Per roadmap Phase 1 |

## 5. Prisma Schema (Initial)

All 7 tables per `03_DATABASE.md`, with no business logic yet:

- **Election**: id, title, description, academic_year, status (Draft/Scheduled/Active/Closed), start_at, end_at, timestamps
- **Student**: id, election_id, nis, nisn, full_name, class_name, major, grade, has_voted, voted_at, timestamps
  - **No candidate reference** — anonymity by design
- **Candidate**: id, election_id, candidate_number, chairman_name, vice_chairman_name, photo_url, vision, mission, timestamps
- **VotingToken**: id, election_id, student_id, token, is_used, expires_at, created_at
- **Vote**: id, election_id, candidate_id, created_at
  - **No student_id, nis, or nisn** — no permanent link between student identity and vote
- **AuditLog**: id, actor_type, actor_id, action, entity, ip_address, user_agent, created_at
- **Settings**: school_name, school_logo, principal_name, current_academic_year, updated_at

Constraints (from `03_DATABASE.md` §10):

- NIS unique, NISN unique-if-set
- Candidate number unique per election
- Token unique
- Only one Active election (partial unique index)

## 6. CI / Git

- Conventional Commits (commitlint)
- Branch convention: `feature/*`, `fix/*`, `refactor/*`, `docs/*`
- CI: build + lint on push/PR for both apps

## 7. Acceptance Criteria

- [ ] `pnpm install` works from root
- [ ] `pnpm dev` starts both apps
- [ ] `pnpm build` builds both apps
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] Docker Compose starts PostgreSQL and Redis
- [ ] Prisma schema validates (`prisma validate`)
- [ ] Commit hooks work (commitlint + lint-staged)
- [ ] `PROGRESS.md` reflects Phase 1 status

## 8. Assumptions

- Node.js ≥ 20 installed on dev machine
- pnpm ≥ 9 installed
- Docker Desktop installed for local Docker Compose
- PostgreSQL and Redis ports 5432/6379 configurable via `.env`
