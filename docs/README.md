# E-Voting OSIS

Sistem E-Voting Ketua OSIS — dokumentasi lengkap: lihat folder `docs/`.

## Stack

- Monorepo: Turborepo + pnpm
- Frontend: Next.js (App Router), Tailwind CSS, shadcn/ui, motion (`apps/web`)
- Backend: NestJS, Prisma ORM (`apps/api`)
- Infra: PostgreSQL 16 + Redis 7 (Docker Compose di `docker/`)

## Prasyarat

- Node.js >= 20
- pnpm >= 9
- Docker Desktop (harus sudah berjalan)

## Penting: Dua Instans PostgreSQL

Mesin Anda memiliki **dua** PostgreSQL:

| | Native PostgreSQL 17 | Docker (proyek ini) |
|---|---|---|
| Port | **5432** | **5433** |
| Database `evoting` | Tidak ada | Ada |
| Digunakan oleh | Proyek lain | Proyek ini |

Semua data proyek (tabel + seed) ada di **port 5433**. Saat membuka pgAdmin/DBeaver/TablePlus, pastikan koneksi:

```
Host: localhost
Port: 5433
User: evoting
Password: evoting
Database: evoting
```

## Menjalankan (Langkah Lengkap)

```bash
# 0. Pastikan Docker Desktop berjalan (tunggu engine ready)

# 1. Infrastruktur database (Postgres :5433 + Redis :6379)
pnpm db:up

# 2. Setup env (pertama kali saja)
#    salin docker/.env.example     -> docker/.env
#    salin apps/api/.env.example   -> apps/api/.env
#    salin apps/web/.env.example   -> apps/web/.env

# 3. Install dependencies
pnpm install

# 4. Migrasi database (buat tabel)
pnpm --filter @e-voting/api db:migrate

# 5. Seed data demo (admin, 30 siswa, 3 kandidat + galeri)
pnpm --filter @e-voting/api db:seed

# 6. Jalankan semua app
pnpm dev
```

## Akses

| Akses | URL / Kredensial |
| ----- | ---------------- |
| Landing page | http://localhost:3000 |
| Admin panel | http://localhost:3000/admin/login |
| Admin login | `admin` / `admin123` (sesuai env `ADMIN_USERNAME`/`ADMIN_PASSWORD`) |
| Portal siswa | http://localhost:3000/student/login |
| Siswa demo | NIS `231001` – `231030`, token lihat di halaman admin Students |
| API base | http://localhost:3001/api/v1 |
| Foto upload | http://localhost:3001/uploads/... |

## Reset ke Keadaan Demo Bersih

```bash
pnpm --filter @e-voting/api db:seed
```

Seed bersifat idempotent — aman dijalankan berulang (upsert, bukan duplikasi).

## Troubleshooting

### Login gagal dengan error 500
Biasanya penyebabnya Docker Desktop berhenti/restart saat API sedang berjalan sehingga koneksi database/cache mati.

```bash
# 1. Cek status infrastruktur (satu URL):
curl http://localhost:3001/api/v1/health
#    {"database":"up","cache":"up"}  <- sehat
#    {"database":"down",...}         <- Docker/Postgres bermasalah

# 2. Pastikan Docker Desktop berjalan, lalu:
pnpm db:up

# 3. Restart API (Ctrl+C lalu jalankan ulang):
pnpm dev
```

Sejak perbaikan terakhir, kegagalan infrastruktur mengembalikan error 503 yang jelas (`DATABASE_UNAVAILABLE` / `CACHE_UNAVAILABLE`) beserta log error di terminal API, bukan lagi 500 misterius.

API juga bersifat **self-healing**: jika Docker/Postgres belum hidup saat API dijalankan, API tetap menyala (lazy connect) dan otomatis pulih begitu database tersedia — tanpa perlu restart. Cek `GET /api/v1/health` kapan saja untuk memastikan statusnya.

### Font (di-self-host)
Font Geist, Geist Mono, dan Source Serif 4 disimpan lokal di `apps/web/app/fonts/` dan dimuat via `next/font/local`. Tidak ada dependensi jaringan ke Google Fonts saat dev/build — aman untuk jaringan sekolah/LAN.

### "Tidak ada tabel di database"
Anda membuka port 5432 (native PostgreSQL). Gunakan **port 5433** — lihat bagian "Dua Instans PostgreSQL".

### API tidak bisa terhubung ke database (P1001)
```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env ps
```
Pastikan `evoting-postgres` berstatus `healthy`. Jika tidak: `pnpm db:up`.

### Port 5433 sudah terpakai
Ubah `POSTGRES_PORT` di `docker/.env` dan `DATABASE_URL` di `apps/api/.env` ke port lain, lalu `pnpm db:up` lagi.

### Lupa token siswa
Buka admin → Students → tombol **Reset Token** (hanya bisa sebelum election Active).

## Perintah

| Perintah | Fungsi |
| -------- | ------ |
| `pnpm dev` | Jalankan semua app (watch) |
| `pnpm build` | Build semua app |
| `pnpm lint` | Lint semua app |
| `pnpm typecheck` | Typecheck semua app |
| `pnpm format` | Format semua file |
| `pnpm db:up` / `pnpm db:down` | Start / stop Docker services |
| `pnpm --filter @e-voting/api db:migrate` | Jalankan migrasi Prisma |
| `pnpm --filter @e-voting/api db:seed` | Seed data demo (idempotent) |
| `pnpm --filter @e-voting/api db:generate` | Regenerasi Prisma Client |
