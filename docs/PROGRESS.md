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
| Landing | Candidate detail page | Done | /candidate/[id], carousel, switcher, CTA |
| Landing | Bigger card previews | Done | Portrait h-52, thumbnails h-20 |
| Landing | Lihat Detail button | Done | Outline button, group-hover primary |
| Detail | Page animations | Done | Entrance, reveals, carousel transition, parallax |
| UI | Standalone admin login | Done | Route group (panel), login full-screen |
| UI | Screen-fit dialogs | Done | max-h dvh + internal scroll, candidate sm:max-w-lg |
| Foto | Rasio standar | Done | Portrait 4:3 (1200x900), program 16:9 (1280x720) |
| Foto | Validasi upload | Done | Min 800px (IMAGE_TOO_SMALL), maks 10MB |
| Voting | Pesan sudah memilih | Done | "Anda telah menggunakan hak pilih Anda." |
| Voting | Token mask input | Done | Auto-dash XXXX-XXXX, uppercase |
| Voting | Animasi halaman pilih | Done | Staggered cards, hover, press |
| Voting | Limit waktu 5 menit | Done | Sesi Redis 300s + countdown + redirect |
| Results | Festive + publish | Done | Confetti, podium, count-up; /results publik + toggle admin |
| Results | Sembunyi dari admin | Done | Admin tidak lihat hasil sebelum publish |
| Results | Reveal delay admin | Done | 6s delay, admin lebih lambat dari publik |
| Reset | db:reset + seed | Done | 0 suara, DRAFT, tersembunyi |
| Multi-Election | Dual election aktif bersamaan | Done | OSIS + MPK; hapus index single-active (migration `drop_single_active_election`) |
| Multi-Election | Per-election unik | Done | NIS/NISN unik per Election (`@@unique([election_id, nis])`) |
| Multi-Election | Seed dual election | Done | 2 election × 30 siswa × 3 kandidat + 9 galeri masing-masing |
| Multi-Election | Landing dual cards | Done | Kartu tiap election + CTA, stamp + hasil |
| Token | Expiry 24 jam | Done | `expires_at` di token, error `TOKEN_EXPIRED` |
| Token | Login token-first | Done | Login pakai token (unik global) + identifier; verifikasi NIS/NISN, expiry, is_used, status election |
| Token | Auto-refresh on start | Done | Token expiry refreshed to now+24h when election goes ACTIVE |
| Token | Reset during ACTIVE | Done | Admin can reset token during ACTIVE for unvoted students |
| Foto | Program gambar tidak ter-crop | Done | Carousel `object-contain` + bg muted |
| Order | Election order column | Done | order field, admin form, landing + results ordering |
| Results | Per-election results | Done | /results index + /results/[id] detail, fallback redirect |
| Landing | Per-election candidates | Done | Candidates grouped by election, ordered vertically |
| Copy | Generic landing copy | Done | No hardcoded "OSIS", uses election.title |
| Vote | Auto-redirect 5s | Done | Countdown + router.push after voting |
| Multi-Election | Sequential voting session | Done | Voting flow processes elections in `order`; submit returns `next` for next election |
| Multi-Election | Per-election vote tracking | Done | Session tracks `has_voted` per election, update after each submit |
| Multi-Election | Smart session lifecycle | Done | Session persists until all elections complete; deleted on final submit |
| Main | Hero school photo + cleared text | Done | Building exterior blur 3px 0.8, isolate -z-10, text-foreground crisp |
| Main | Program carousel in card | Done | Auto-play 3s, pause hover, dots+arrows, reduced-motion |
| Admin | Responsive shell | Done | Mobile drawer, sidebar icons, active fix, skip-to-content, max-w 1600 |
| Admin | Elections polish | Done | PageHeader, badge ACTIVE solid, search/filter/sort, pagination, skeleton |
| Admin | Students polish | Done | Toolbar, bulk select, ⋯ menu, token copy, sticky header, pagination |
| Admin | Candidates polish | Done | Fix Landing badge, toolbar, pagination, dialog rows, gallery toast |
| Voter | Guru & Staf voter support | Done | StaffVoter table, dual-role login (Siswa vs Guru/Staf with searchable dropdown), anonymous vote submit |
| Admin | Guru & Staf management | Done | /admin/staff with CRUD, import/export Excel, token reset, bulk actions |
| Dashboard | Student vs Staff metrics | Done | Dashboard summary and breakdowns for Siswa vs Guru & Staf |
