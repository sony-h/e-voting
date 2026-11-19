# Multi-Tenant SaaS Transformation Plan

# E-Voting OSIS → Orivastra Vote (SaaS)

Version: 0.1 (Draft)

Status: **PLANNED — CODE FREEZE** (eksekusi dimulai setelah acara klien pertama selesai, minggu ini)

Dokumen terkait: `01_PRD.md`, `02_SYSTEM_ARCHITECTURE.md`, `03_DATABASE.md`, `04_API_SPECS.md`, `07_AI_CONVENTION_CODING_STANDARD.md`

---

# 1. Konteks & Tujuan

## Kondisi pemicu

- Sistem e-voting saat ini **live dan dipakai klien pertama** minggu ini (code freeze).
- Visi bisnis: naikkan level sistem menjadi **multi-tenant SaaS**, dengan konsep
  seperti platform wedding invitation — tiap tenant (sekolah) melakukan
  **self-service kustomisasi** (tema, background, pola, desain) secara mandiri.
- Orivastra adalah brand/studio resmi; e-voting menjadi salah satu lini produk
  di samping jasa klien (contoh: CitraNusa).

## Tujuan dokumen

Menjadi jangkar kerja (source of truth) untuk transformasi multi-tenant:
skema target, keputusan arsitektur, fase eksekusi, acceptance criteria,
risiko, dan urutan prioritas — **tanpa mengubah satu baris kode pun selama
masa freeze**.

---

# 2. Prinsip Non-Negosiable

1. **Pemisahan lapisan**: kustomisasi hanya boleh menyentuh *presentation layer*
   (design tokens → CSS variables). Logika pemilu (token, sesi vote, penghitungan,
   audit) tidak boleh terpengaruh tema apa pun.
2. **Ukuran sukses migrasi = pengguna现有 tidak sadar ada perubahan.**
   Sekolah yang sudah jalan harus tetap jalan tanpa ubah URL, akun, atau alur.
3. **Isolasi tenant mutlak.** Tidak boleh ada query lintas tenant, sekecil apa pun.
   Auto-scoping di level ORM (bukan disiplin developer).
4. **Validasi termurah dulu.** Template kurasi sebelum editor penuh;
   transfer manual sebelum payment gateway; path-based sebelum subdomain.
5. **Setiap fase menghasilkan sesuatu yang bisa di-deploy** (tidak ada big-bang).

---

# 3. Audit Kondisi Saat Ini (factual, hasil inspeksi Agustus 2026)

## Deployment

| Komponen | Nilai |
|---|---|
| Lokasi | `/opt/e-voting` |
| Backend | PM2 `evoting-backend`, NestJS, port 3100 |
| Frontend | PM2 `evoting-frontend`, Next.js, port 3101 |
| Database | PostgreSQL user `evoting` @ container `orivastra-postgres` :5432 |
| ORM | Prisma 6 (`apps/api/prisma/schema.prisma`) |
| Auth | JWT (@nestjs/jwt) + bcrypt |

## Model data saat ini (10 model)

`Election`, `Student`, `Candidate`, `CandidateImage`, `VotingToken`, `Vote`,
`AuditLog`, `Settings`, `Admin`, enum `ElectionStatus`.

**Temuan kunci (pembatas utama multi-tenant):**

- **Tidak ada `tenant_id` di tabel mana pun** — semua tabel global.
- `Settings` adalah **singleton** (`id Int @id @default(1)`): satu sekolah,
  satu logo, satu nama — selamanya.
- `Admin` tunggal tanpa konsep kepemilikan tenant.
- Modul backend sudah rapi: `auth, candidate, dashboard, election, health,
  report, settings, student, voting` → refactor bersifat *menambah dimensi*,
  bukan membongkar struktur.

---

# 4. Arsitektur Target

## Alur request

```
Request (e-voting.orivastra.id/sma1/...)
  → TenantResolver (ekstrak slug dari path; header fallback utk API admin)
  → TenantContext (request-scoped)
  → Prisma extension: auto-inject tenantId ke semua query
  → Response dirender dengan design tokens milik tenant
```

## Pengalamatan tenant (KEPUTUSAN)

| Fase | Skema | Alasan |
|---|---|---|
| Pilot (Fase 3) | **Path-based**: `/sma1`, `/sman2` | Nol perubahan DNS/cert, cepat, link ke siswa tetap bersih |
| Pasca-revenue | Subdomain `sma1.e-voting.orivastra.id` sebagai fitur premium ("domain sendiri"), wildcard DNS + cert DNS-challenge | Terasa eksklusif; didanai revenue |

## Design tokens (inti fitur "wedding invitation")

- Tiap tenant punya dokumen tokens (JSON): warna primer/sekunder, font,
  background, pattern, logo URL, layout varian.
- Frontend membaca tokens saat runtime → set CSS variables → render.
- **Template kurasi (5 desain profesional) = titik awal**; editor visual penuh
  adalah Fase 4, dibangun HANYA setelah pembuktian willingness-to-pay.

---

# 5. Skema Target (ringkas — final dituang di migrasi Prisma)

```prisma
model Tenant {
  id            String   @id @default(uuid())
  slug          String   @unique        // "sma1" → /sma1
  name          String                  // nama sekolah
  status        TenantStatus @default(ACTIVE)
  plan          TenantPlan   @default(PILOT)
  designTokens  Json?                   // tema/background/pattern/layout
  createdAt     DateTime @default(now())
}

model Settings {
  // berubah dari singleton → per tenant
  tenantId String  @id                 // 1:1 dengan Tenant
  // ...field lama tetap (school_name, logo, dst.)
}
```

Perubahan menyeluruh:

1. `tenant_id` ditambahkan ke SEMUA tabel domain: `Election`, `Student`,
   `Candidate`, `CandidateImage`, `VotingToken`, `Vote`, `AuditLog`.
2. Unique constraint menjadi **komposit per tenant**
   (contoh: NIS unik *dalam* satu sekolah, bukan global).
3. `Admin.role`: enum `SUPERADMIN` (operator Orivastra) | `ADMIN` (panitia sekolah);
   JWT payload + `tenantId`; `SUPERADMIN` bebas tenant, `ADMIN` terkunci tenant-nya.
4. Migrasi backfill: semua data现有 masuk ke tenant default (slug mis. `default`),
   sehingga sekolah现有 tidak merasakan apa pun.

---

# 6. Fase Eksekusi

> Mulai eksekusi hanya setelah acara klien pertama selesai & konfirmasi Mas Son.

## Fase 1 — Fondasi Multi-Tenant (tak terlihat, tersulit)

Deliverable:

- [ ] Model `Tenant` + kolom `tenantId` di semua tabel domain (migrasi Prisma + backfill)
- [ ] TenantResolver + TenantContext (path-based)
- [ ] Prisma extension auto-scoping (semua query ter-scope otomatis)
- [ ] JWT + tenantId, role SUPERADMIN/ADMIN, guard per modul
- [ ] Data现有 → tenant default

Acceptance criteria:

- [ ] Semua test lama hijau; alur sekolah现有 identik dengan sebelumnya (URL sama, akun sama)
- [ ] Test isolasi: query tenant A mustahil melihat data tenant B (ditulis sebagai automated test)
- [ ] Tag git `pre-multitenant` sebelum merge (rollback point)

Estimasi kasar: 1–2 minggu sambilan.

## Fase 2 — Branding & Kustomisasi (terlihat, seru)

Deliverable:

- [ ] Renderer design tokens → CSS variables (runtime)
- [ ] 5 template kurasi profesional (galeri)
- [ ] Upload logo/foto kandidat per tenant
- [ ] Halaman settings tenant di dashboard (pilih template + warna dasar + logo)

Acceptance criteria:

- [ ] Ganti tema tidak menyentuh logika voting (regression test voting tetap hijau)
- [ ] Preview tema sebelum simpan
- Estimasi kasar: ±1 minggu.

## Fase 3 — Pilot-Ready (boleh menagih)

Deliverable:

- [ ] Self-service provisioning: daftar → pilih template → isi nama sekolah → langsung pakai
- [ ] Backup harian otomatis + **restore drill terverifikasi** (wajib sebelum pegang data sekolah bayar)
- [ ] Load test hari-H (simulasi gelombang siswa jam istirahat; lihat §8)
- [ ] Monitoring dasar (uptime, error rate, resource)
- [ ] Halaman penawaran + template pitch (dari diskusi bisnis 24 Aug 2026)

Target pasar pilot: 3 sekolah dari jaringan guru Mas Son.
Billing: transfer manual (tanpa gateway untuk pilot).

Estimasi kasar: ±1 minggu.

## Fase 4 — Scale (didanai revenue)

- Editor tema visual penuh (drag-and-drop / form lengkap)
- Subdomain custom sebagai fitur premium
- Otomasi billing (gateway) bila volume sudah membenarkan
- White-label self-host untuk instansi besar (penjualan bernilai puluhan juta)

---

# 7. Keamanan & Kepatuhan

- **Isolasi lintas tenant** = risiko #1; diuji automated, bukan manual.
- **UU PDP**: proses data anak di bawah umur → simpan minimum
  (hindari NISN bila tak perlu), kebijakan privasi sederhana per halaman voting.
- Rate-limit pada endpoint token/login (brute force).
- AuditLog tetap per-tenant + dapat difilter SUPERADMIN.
- Secret handling tetap mengikuti aturan Mas Son (manual, via .env yang dia kelola).

---

# 8. Infrastruktur & Operasi

- **Karakter trafik**: meledak singkat (gelombang jam istirahat). Wajib load test
  sebelum melayani sekolah >500 pemilih; opsi naikkan ukuran instance sesaat di hari-H.
- **SPOF saat ini**: satu VPS menampung semuanya. Diterima untuk pilot;
  dicatat sebagai risiko bisnis (§10), bukan diselesaikan sekarang.
- Rollback: tag git per fase + migrasi Prisma reversible; latihan restore backup
  sebelum Fase 3 selesai.
- Staging: instance PM2 kedua + database skema terpisah di VPS yang sama
  untuk uji migrasi sebelum produksi.

---

# 9. Ringkasan Bisnis & Go-To-Market

- Pricing hipotesis: **Rp 300rb–750rb per acara** (validasi lewat 3 pilot;
  angka bukan kebenaran final).
- Naik ke langganan tahunan hanya bagi sekolah repeat-order.
- Freemium: tidak (saat ini). Self-host lisensi: tidak (membunuh recurring).
- White-label: ya, sebagai deal premium atas permintaan.
- Urutan nilai produk: fungsi inti stabil → identitas (template) → kenyamanan
  (editor) → prestise (domain sendiri).

---

# 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kebocoran data lintas tenant | Fatal (reputasi + hukum) | Auto-scope ORM + automated isolation test |
| Lonjakan trafik hari-H | Voting gagal di tengah acara | Load test + upgrade sesaat + antrean/queue bila perlu |
| Migrasi merusak data现有 | Klien pertama terganggu | Backfill ke tenant default + staging dry-run + tag rollback |
| Jebakan "editor dulu" | Bulan-bulan bangun tanpa revenue | Template kurasi dulu; editor hanya di Fase 4 |
| Satu VPS = SPOF | Semua tenant down serentak | Diterima utk pilot; rencana VPS kedua pasca-revenue |
| Code creep selama freeze | Mengganggu acara klien | Dokumen ini HANYA plan; nol perubahan kode |

---

# 11. Definition of Done (keseluruhan inisiatif)

- [ ] ≥3 sekolah berbayar aktif di satu deployment
- [ ] Isolation test hijau di CI
- [ ] Restore drill terdokumentasi & berhasil
- [ ] Load test lolos target pemilih terbesar + 50%
- [ ] Sekolah pertama (现有) tidak pernah merasakan downtime akibat transformasi ini

---

# Appendix A — Pertanyaan Terbuka

1. Nama komersial produk SaaS ("Orivastra Vote"? brand terpisah?)
2. Apakah kandidat boleh menampilkan foto (persetujuan wali) — aspek PDP lanjutan
3. Slug default utk data现有 (`default` vs nama sekolah aktual)
4. Kebutuhan multi-bahasa (ID saja untuk pilot)
