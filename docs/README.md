# E-Voting OSIS

Sistem E-Voting Ketua OSIS — dokumentasi: lihat folder `docs/`.

## Stack

- Monorepo: Turborepo + pnpm
- Frontend: Next.js (App Router), Tailwind CSS, shadcn/ui (`apps/web`)
- Backend: NestJS, Prisma ORM (`apps/api`)
- Infra: PostgreSQL 16, Redis 7 (Docker Compose di `docker/`)

## Prasyarat

- Node.js >= 20
- pnpm >= 9
- Docker Desktop

## Menjalankan

```bash
# 1. Infrastruktur database
pnpm db:up

# 2. Setup env (pertama kali)
# salin docker/.env.example -> docker/.env
# salin apps/api/.env.example -> apps/api/.env
# salin apps/web/.env.example -> apps/web/.env

# 3. Install
pnpm install

# 4. Migrasi database
pnpm --filter @e-voting/api db:migrate

# 5. Jalankan semua app
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Perintah

| Perintah | Fungsi |
| -------- | ------ |
| `pnpm dev` | Jalankan semua app (watch) |
| `pnpm build` | Build semua app |
| `pnpm lint` | Lint semua app |
| `pnpm typecheck` | Typecheck semua app |
| `pnpm format` | Format semua file |
| `pnpm db:up` / `pnpm db:down` | Start / stop Docker services |
