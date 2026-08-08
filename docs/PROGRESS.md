# PROGRESS

## 2026-08-08

| Milestone | Feature | Status | Notes |
| --------- | ------- | ------ | ----- |
| Phase 1 | Monorepo setup (Turborepo + pnpm) | Done | apps/web + apps/api |
| Phase 1 | Shared packages (types, eslint-config, tsconfig) | Done | @e-voting/* |
| Phase 1 | Docker infrastructure | Done | PostgreSQL 16 + Redis 7 (Postgres di port 5433) |
| Phase 1 | Prisma schema | Done | 7 tables, anonymous ballot enforced |
| Phase 1 | Git hooks | Done | Husky + lint-staged + commitlint |
| Phase 1 | CI | Done | Build + lint + typecheck |
| Phase 2 | Admin Login | Done | JWT HttpOnly cookie |
| Phase 2 | Student Login | Done | NIS/NISN + Token, Redis session |
| Phase 2 | Election CRUD | Done | List public, mutasi admin-only |
| Phase 2 | Election Status Management | Done | Draft → Active → Closed, single active |
| Phase 2 | Route Guard & Authorization | Done | JwtAuthGuard, StudentSessionGuard, RolesGuard |
| Phase 2 | Landing page | Done | Info election + CTA siswa, tanpa admin |
| Phase 2 | Admin panel | Done | /admin hidden, dashboard + election management |
| Phase 2 | Admin table + seed | Done | docs/03_DATABASE.md diperbarui |
