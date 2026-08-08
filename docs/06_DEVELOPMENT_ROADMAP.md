# Development Roadmap

# E-Voting OSIS System

Version: 1.0

---

# 1. Overview

Dokumen ini menjelaskan tahapan pengembangan Sistem E-Voting OSIS mulai dari persiapan proyek hingga siap digunakan pada lingkungan produksi.

Roadmap dibagi menjadi beberapa milestone agar proses implementasi dapat dilakukan secara bertahap, terukur, dan mudah divalidasi.

---

# 2. Development Goals

Target utama pengembangan:

* Membangun sistem yang stabil dan mudah dipelihara.
* Menyelesaikan fitur inti (MVP) terlebih dahulu.
* Memastikan keamanan dan anonimitas suara sejak awal.
* Menghasilkan aplikasi yang siap digunakan pada pemilihan OSIS di satu sekolah.

---

# 3. Technology Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Query
* React Hook Form
* Zod

---

## Backend

* NestJS
* Prisma ORM
* PostgreSQL
* Redis
* JWT

---

## Infrastructure

* Nginx
* Docker (PostgreSQL & Redis)
* VPS Linux
* PM2 (atau systemd) untuk proses aplikasi

---

# 4. Development Phases

## Phase 1 — Project Foundation

### Objective

Membangun pondasi proyek.

### Deliverables

* Monorepo setup
* Frontend setup
* Backend setup
* Prisma setup
* PostgreSQL
* Redis
* Environment Configuration
* ESLint
* Prettier
* Husky
* Commitlint
* Docker Infrastructure
* CI (Build & Lint)

### Exit Criteria

Project dapat dijalankan secara lokal dan berhasil melakukan build.

---

## Phase 2 — Authentication & Election

### Objective

Membangun autentikasi dan pengelolaan Election.

### Deliverables

* Admin Login
* Student Login
* JWT
* Temporary Student Session
* Election CRUD
* Election Status Management
* Route Guard
* Authorization

### Exit Criteria

Admin dapat membuat Election dan siswa dapat login menggunakan NIS/NISN serta Token.

---

## Phase 3 — Student & Candidate Management

### Objective

Membangun seluruh data master.

### Deliverables

* Student CRUD
* Import Excel
* Export Excel
* Candidate CRUD
* Upload Photo
* Token Generator
* Reset Token

### Exit Criteria

Admin dapat mengelola seluruh data kandidat dan siswa.

---

## Phase 4 — Voting System (Core)

### Objective

Membangun fitur utama sistem.

### Deliverables

* Candidate List
* Candidate Detail
* Vote Confirmation
* Vote Submission
* Anonymous Vote
* Database Transaction
* Vote Validation
* One Student One Vote
* Session Destroy
* Success Page

### Exit Criteria

Siswa dapat melakukan voting satu kali dan suara tersimpan secara anonim.

---

## Phase 5 — Dashboard & Results

### Objective

Membangun monitoring dan pelaporan.

### Deliverables

* Dashboard Summary
* Participation Statistics
* Progress Per Class
* Progress Per Major
* Result Page
* PDF Export
* Excel Export

### Exit Criteria

Admin dapat memantau partisipasi dan melihat hasil setelah Election ditutup.

---

## Phase 6 — Security & Optimization

### Objective

Memastikan aplikasi siap digunakan.

### Deliverables

* Rate Limiter
* Audit Log
* Validation
* Error Handling
* Security Headers
* HTTPS
* Performance Optimization
* Database Index Optimization
* Caching

### Exit Criteria

Aplikasi memenuhi standar keamanan dasar dan memiliki performa yang baik.

---

## Phase 7 — Testing & Production

### Objective

Menyiapkan aplikasi untuk produksi.

### Deliverables

* Unit Test
* Integration Test
* Manual Testing
* Load Testing
* Backup Script
* Deployment
* Monitoring
* Production Checklist

### Exit Criteria

Aplikasi siap digunakan pada pemilihan OSIS.

---

# 5. Feature Checklist

## Authentication

* [ ] Admin Login
* [ ] Student Login
* [ ] Logout
* [ ] JWT
* [ ] Session

---

## Election

* [ ] Create
* [ ] Edit
* [ ] Start
* [ ] Close

---

## Candidate

* [ ] CRUD
* [ ] Upload Photo

---

## Student

* [ ] CRUD
* [ ] Import Excel
* [ ] Export Excel
* [ ] Reset Token

---

## Voting

* [ ] Candidate List
* [ ] Detail Candidate
* [ ] Vote Confirmation
* [ ] Submit Vote
* [ ] Anonymous Vote
* [ ] One Vote Validation

---

## Dashboard

* [ ] Summary
* [ ] Statistics
* [ ] Participation
* [ ] Countdown

---

## Result

* [ ] Vote Count
* [ ] Ranking
* [ ] PDF Export
* [ ] Excel Export

---

# 6. Testing Strategy

## Unit Testing

Menguji:

* Service
* Utility
* Validation

---

## Integration Testing

Menguji:

* API
* Database
* Authentication

---

## End-to-End Testing

Menguji alur utama:

* Login Admin
* Login Student
* Voting
* Dashboard
* Result

---

## User Acceptance Testing

Skenario:

* Admin berhasil mengelola Election.
* Admin berhasil mengelola siswa dan kandidat.
* Siswa berhasil login.
* Siswa berhasil memilih satu kali.
* Hasil hanya muncul setelah Election ditutup.

---

# 7. Deployment Strategy

Environment

* Local
* Staging
* Production

Deployment dilakukan menggunakan:

* GitHub
* VPS
* Nginx
* PM2/systemd
* Docker (PostgreSQL & Redis)

---

# 8. Production Checklist

Sebelum sistem digunakan:

* [ ] HTTPS aktif.
* [ ] Database backup.
* [ ] Semua Token telah dibuat.
* [ ] Election telah dijadwalkan.
* [ ] Kandidat telah diverifikasi.
* [ ] Data siswa telah diverifikasi.
* [ ] Admin berhasil login.
* [ ] Siswa uji berhasil login.
* [ ] Voting uji berhasil.
* [ ] Hasil tetap tersembunyi selama Election aktif.

---

# 9. Risk Assessment

## Risiko

Siswa lupa Token.

Mitigasi

Admin dapat menghasilkan Token baru sebelum siswa melakukan voting.

---

## Risiko

Koneksi internet sekolah tidak stabil.

Mitigasi

Server ditempatkan di jaringan lokal sekolah atau VPS dengan koneksi yang andal.

---

## Risiko

Admin menutup Election terlalu cepat.

Mitigasi

Tambahkan dialog konfirmasi dan validasi sebelum perubahan status.

---

## Risiko

Percobaan voting ganda.

Mitigasi

Validasi session, token, status partisipasi, dan transaksi database.

---

## Risiko

Akses tidak sah ke panel admin.

Mitigasi

JWT, HttpOnly Cookie, Rate Limiting, Audit Log, dan HTTPS.

---

# 10. Future Roadmap

Versi berikutnya dapat menambahkan:

* QR Code Login
* Multi Election
* Multi Organization
* Multi School
* Public Result Portal
* Real-time Dashboard
* Email Notification
* Digital Certificate
* Progressive Web App (PWA)

---

# 11. Definition of Done

Sistem dianggap selesai apabila:

* Seluruh fitur pada PRD telah diimplementasikan.
* Seluruh acceptance criteria terpenuhi.
* Tidak ditemukan bug kritis pada pengujian.
* Siswa dapat menyelesaikan proses voting tanpa bantuan.
* Admin dapat mengelola Election secara penuh.
* Seluruh suara tersimpan secara anonim.
* Hasil hanya dapat diakses setelah Election berstatus Closed.

---

# 12. Success Criteria

Proyek dinyatakan berhasil apabila:

* Sistem berhasil digunakan pada minimal satu proses pemilihan OSIS.
* Tidak terjadi kehilangan data.
* Tidak terjadi suara ganda.
* Tidak terdapat hubungan permanen antara identitas siswa dan suara.
* Penghitungan hasil berlangsung otomatis dan akurat.
* Aplikasi dapat digunakan dengan baik pada desktop maupun smartphone.

---

# 13. Long-Term Vision

Sistem dirancang sebagai fondasi platform e-voting internal sekolah yang dapat berkembang tanpa perubahan arsitektur besar.

Pengembangan di masa depan dapat mencakup berbagai jenis pemilihan, peningkatan keamanan, integrasi dengan sistem akademik sekolah, dan perluasan penggunaan ke lebih dari satu institusi apabila dibutuhkan.
