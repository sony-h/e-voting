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
| Phase 3 | Student CRUD | Done | Token auto-generate |
| Phase 3 | Import Excel | Done | SheetJS, summary imported/failed |
| Phase 3 | Export Excel | Done | Download xlsx |
| Phase 3 | Candidate CRUD | Done | Foto, nomor urut, visi misi |
| Phase 3 | Upload Photo | Done | /uploads/candidate-photo, max 2MB |
| Phase 3 | Token Generator | Done | Format XXXX-XXXX |
| Phase 3 | Reset Token / Reset Voting | Done | Hanya sebelum election Active |
| Phase 4 | Candidate List & Detail | Done | Portal siswa, hanya saat election Active |
| Phase 4 | Vote Confirmation & Submission | Done | Dialog konfirmasi, submit anonim |
| Phase 4 | Anonymous Vote + Transaction | Done | Vote tanpa identitas, rollback otomatis |
| Phase 4 | One Student One Vote | Done | has_voted + token is_used + session destroy |
| Phase 4 | Success Page | Done | Tidak menampilkan kandidat dipilih |
| Phase 4 | Election status via PATCH dikunci | Done | Status hanya via start/close |
| Phase 5 | Dashboard Summary | Done | Total siswa, voting, partisipasi |
| Phase 5 | Progress per Kelas & Jurusan | Done | Grouping + persentase |
| Phase 5 | Result Page | Done | Ranking, bar chart, hanya saat Closed |
| Phase 5 | Export PDF & Excel | Done | pdfkit + xlsx, verified |
| Phase 5 | Countdown Election | Done | Sisa waktu saat Active |
| UI | Civic Ballot identity | Done | Blue primary token, serif display |
| UI | Landing hero + student flow | Done | Ballot stamp, ballot cards |
| UI | Dark mode (default light) | Done | next-themes + toggle admin |
| UI | Admin polish | Done | Sidebar, dashboard, results, tables |
| Seed | Rich demo data | Done | 30 siswa, 3 kandidat, admin, election |
| Gallery | CandidateImage + upload | Done | Multi-upload, delete, carousel siswa |
| Landing | 3D immersive (motion) | Done | Floating ballot, tilt cards, scroll reveal |
| Landing | Public candidates | Done | GET /public/candidates, show_on_landing |
| Landing | Candidate card rework | Done | Info-only, mobile snap carousel + dots |
| Fonts | Self-hosted fonts | Done | next/font/local, offline-safe |
