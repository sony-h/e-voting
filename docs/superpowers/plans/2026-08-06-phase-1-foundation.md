# Phase 1: Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the E-Voting OSIS monorepo foundation — Turborepo workspace, Next.js + NestJS apps, Prisma schema, Docker infra, git hooks, and CI — such that everything runs locally and builds successfully.

**Architecture:** Modular Monolith per `docs/02_SYSTEM_ARCHITECTURE.md`. Single repo with pnpm workspaces + Turborepo. `apps/web` (Next.js App Router) and `apps/api` (NestJS) consume shared packages `@e-voting/types`, `@e-voting/eslint-config`, `@e-voting/tsconfig`. PostgreSQL + Redis run via Docker Compose. No business features in this phase — scaffolding only.

**Tech Stack:** pnpm 11, Turborepo, Next.js (latest), NestJS (latest), Prisma ORM, PostgreSQL 16, Redis 7, ESLint flat config, Prettier, Husky, lint-staged, commitlint (conventional commits), GitHub Actions.

## Global Constraints

- Documentation is the Single Source of Truth (`docs/07_AI_CONVENTION_CODING_STANDARD.md`). No code that contradicts the docs.
- Anonymous Ballot principle: the `Vote` table MUST NOT have `student_id`, `nis`, or `nisn` columns (`docs/03_DATABASE.md` §7).
- The `Student` table MUST NOT store the chosen candidate (`docs/03_DATABASE.md` §5).
- Node.js ≥ 20, pnpm ≥ 9 installed. On this Windows machine `pnpm` resolves to `pnpm.cmd` (PowerShell execution policy blocks the `.ps1` shim).
- Conventional Commits only (`feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `build:`, `ci:`, `chore:`).
- No comments in code unless asked.
- Backend module folders per `docs/02_SYSTEM_ARCHITECTURE.md` §5: `modules/{auth,election,student,candidate,voting,dashboard,report,settings}`, `common`, `config`, `middleware`, `guards`, `interceptors`, `filters`.
- Frontend folders per `docs/02_SYSTEM_ARCHITECTURE.md` §6: `app`, `components`, `hooks`, `lib`, `services`, `types`, `styles`.
- Ports: PostgreSQL 5432, Redis 6379 (both configurable via `.env`).

---

### Task 1: Root Monorepo Workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `.prettierrc`
- Create: `.prettierignore`

**Interfaces:**
- Consumes: nothing (greenfield).
- Produces: workspace with scripts `dev`, `build`, `lint`, `typecheck`, `format`, `format:check`, `db:up`, `db:down`. Later tasks add packages under `apps/*` and `packages/*` which the workspace auto-detects.

- [ ] **Step 1: Initialize git repo**

Run:
```powershell
git init -b main
```
Expected: `Initialized empty Git repository in ...`

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "e-voting",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@11.8.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:up": "docker compose -f docker/docker-compose.yml up -d",
    "db:down": "docker compose -f docker/docker-compose.yml down"
  },
  "devDependencies": {
    "prettier": "^3.3.0",
    "turbo": "^2.3.0"
  }
}
```

- [ ] **Step 3: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 5: Create `.gitignore`**

```gitignore
node_modules/
dist/
.next/
.turbo/
coverage/

# env
.env
.env.*
!.env.example

# uploads
uploads/

# logs
*.log
npm-debug.log*
pnpm-debug.log*

# misc
.DS_Store
*.tsbuildinfo
```

- [ ] **Step 6: Create `.npmrc`**

```ini
strict-peer-dependencies=false
```

- [ ] **Step 7: Create `.prettierrc`**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 8: Create `.prettierignore`**

```gitignore
node_modules
dist
.next
.turbo
coverage
pnpm-lock.yaml
```

- [ ] **Step 9: Install and verify workspace**

Run:
```powershell
pnpm.cmd install
```
Expected: lockfile `pnpm-lock.yaml` created, no errors.

Run:
```powershell
pnpm.cmd exec turbo --version
```
Expected: prints a `2.x.x` version.

- [ ] **Step 10: Commit**

```powershell
git add package.json pnpm-workspace.yaml turbo.json .gitignore .npmrc .prettierrc .prettierignore pnpm-lock.yaml
git commit -m "chore: initialize turborepo workspace"
```

---

### Task 2: Shared Packages (`@e-voting/tsconfig`, `@e-voting/eslint-config`, `@e-voting/types`)

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nextjs.json`
- Create: `packages/tsconfig/nestjs.json`
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/base.js`
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `@e-voting/eslint-config/base.js` (flat config array, default export) consumed by both apps' `eslint.config.mjs`. `@e-voting/tsconfig/*.json` consumed by both apps' `tsconfig.json` via `"extends": "@e-voting/tsconfig/nextjs.json"` / `nestjs.json`. `@e-voting/types` exports `ElectionStatus` enum and domain interfaces consumed by Prisma schema notes and future phases.

- [ ] **Step 1: Create `packages/tsconfig/package.json`**

```json
{
  "name": "@e-voting/tsconfig",
  "version": "0.1.0",
  "private": true,
  "files": ["base.json", "nextjs.json", "nestjs.json"]
}
```

- [ ] **Step 2: Create `packages/tsconfig/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "Bundler",
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

- [ ] **Step 3: Create `packages/tsconfig/nextjs.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  }
}
```

- [ ] **Step 4: Create `packages/tsconfig/nestjs.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": true
  }
}
```

- [ ] **Step 5: Create `packages/eslint-config/package.json`**

```json
{
  "name": "@e-voting/eslint-config",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./base.js",
    "./base": "./base.js"
  },
  "dependencies": {
    "@eslint/js": "^9.9.0",
    "eslint-config-prettier": "^9.1.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

- [ ] **Step 6: Create `packages/eslint-config/base.js`**

```js
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
```

- [ ] **Step 7: Create `packages/types/package.json`**

```json
{
  "name": "@e-voting/types",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 8: Create `packages/types/tsconfig.json`**

```json
{
  "extends": "@e-voting/tsconfig/base.json",
  "compilerOptions": {
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 9: Create `packages/types/src/index.ts`**

```ts
export enum ElectionStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface Election {
  id: string;
  title: string;
  description: string | null;
  academic_year: string;
  status: ElectionStatus;
  start_at: Date | null;
  end_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Student {
  id: string;
  election_id: string;
  nis: string;
  nisn: string | null;
  full_name: string;
  class_name: string;
  major: string | null;
  grade: string | null;
  has_voted: boolean;
  voted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Candidate {
  id: string;
  election_id: string;
  candidate_number: number;
  chairman_name: string;
  vice_chairman_name: string | null;
  photo_url: string | null;
  vision: string;
  mission: string;
  created_at: Date;
  updated_at: Date;
}

export interface VotingToken {
  id: string;
  election_id: string;
  student_id: string;
  token: string;
  is_used: boolean;
  expires_at: Date | null;
  created_at: Date;
}

export interface Vote {
  id: string;
  election_id: string;
  candidate_id: string;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  entity: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface Settings {
  id: number;
  school_name: string | null;
  school_logo: string | null;
  principal_name: string | null;
  current_academic_year: string | null;
  updated_at: Date;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
}
```

- [ ] **Step 10: Install workspace deps and build types package**

Run:
```powershell
pnpm.cmd install
```
Expected: workspace resolves `packages/*`; no errors.

Run:
```powershell
pnpm.cmd --filter @e-voting/types build
```
Expected: `dist/index.js` + `dist/index.d.ts` created, exit code 0.

- [ ] **Step 11: Commit**

```powershell
git add packages pnpm-lock.yaml
git commit -m "chore: add shared tsconfig, eslint-config, and types packages"
```

---

### Task 3: Docker Infrastructure (PostgreSQL + Redis) and Env Templates

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/.env.example`
- Create: `apps/api/.env.example`
- Create: `apps/web/.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: `db:up` / `db:down` targets. Database `evoting` on port 5432 (user/password `evoting`) and Redis on 6379. `DATABASE_URL` consumed by Task 4's Prisma setup.

- [ ] **Step 1: Create `docker/docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: evoting-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-evoting}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-evoting}
      POSTGRES_DB: ${POSTGRES_DB:-evoting}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-evoting}"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: evoting-redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Create `docker/.env.example`**

```dotenv
POSTGRES_USER=evoting
POSTGRES_PASSWORD=evoting
POSTGRES_DB=evoting
POSTGRES_PORT=5432
REDIS_PORT=6379
```

- [ ] **Step 3: Create `apps/api/.env.example`**

```dotenv
# Database
DATABASE_URL=postgresql://evoting:evoting@localhost:5432/evoting?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# App
PORT=3001
```

- [ ] **Step 4: Create `apps/web/.env.example`**

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

- [ ] **Step 5: Validate compose file and start services**

Run:
```powershell
docker compose -f docker/docker-compose.yml --env-file docker/.env.example config --quiet
```
Expected: no output, exit code 0.

Run:
```powershell
docker compose -f docker/docker-compose.yml --env-file docker/.env.example up -d
```
Expected: containers `evoting-postgres` and `evoting-redis` created.

Run:
```powershell
docker compose -f docker/docker-compose.yml --env-file docker/.env.example ps
```
Expected: both containers show `healthy` (wait up to 30s if needed).

- [ ] **Step 6: Copy env examples to real env files**

Run:
```powershell
Copy-Item docker/.env.example docker/.env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

- [ ] **Step 7: Commit**

```powershell
git add docker apps/api/.env.example apps/web/.env.example
git commit -m "chore: add docker compose for postgres and redis"
```

---

### Task 4: NestJS API Scaffold + Prisma Schema

**Files:**
- Create: `apps/api/**` (NestJS scaffold)
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0001_init/migration.sql`
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/src/modules/election/election.module.ts`
- Create: `apps/api/src/modules/student/student.module.ts`
- Create: `apps/api/src/modules/candidate/candidate.module.ts`
- Create: `apps/api/src/modules/voting/voting.module.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.module.ts`
- Create: `apps/api/src/modules/report/report.module.ts`
- Create: `apps/api/src/modules/settings/settings.module.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Modify: `apps/api/src/app.module.ts` (import `PrismaModule`)

**Interfaces:**
- Consumes: `DATABASE_URL` from Task 3 env; shared `@e-voting/eslint-config` + `@e-voting/tsconfig` from Task 2.
- Produces: `PrismaService` (extends `PrismaClient`, `onModuleInit` calls `$connect()`), exported from `PrismaModule` as global. All 7 tables in schema per `docs/03_DATABASE.md`. Partial unique index `election_single_active` on `Election(status)` where `ACTIVE`.

- [ ] **Step 1: Scaffold NestJS app**

Run (workdir `apps`):
```powershell
pnpm.cmd dlx @nestjs/cli@latest new api --package-manager pnpm --strict --skip-git --skip-install
```
Expected: `apps/api/` generated with `src/`, `test/`, `tsconfig.json`, `nest-cli.json`, `package.json`.

- [ ] **Step 2: Replace `apps/api/package.json` with workspace-aware version**

```json
{
  "name": "@e-voting/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@prisma/client": "^6.0.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@e-voting/eslint-config": "workspace:*",
    "@e-voting/tsconfig": "workspace:*",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^22.0.0",
    "prisma": "^6.0.0",
    "source-map-support": "^0.5.21",
    "ts-jest": "^29.2.0",
    "ts-loader": "^9.5.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.5.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 3: Replace `apps/api/tsconfig.json`**

```json
{
  "extends": "@e-voting/tsconfig/nestjs.json",
  "compilerOptions": {
    "baseUrl": "./",
    "incremental": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 4: Create `apps/api/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 5: Replace `apps/api/eslint.config.mjs`**

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import baseConfig from '@e-voting/eslint-config';

export default defineConfig(
  ...baseConfig,
  globalIgnores(['dist/**', 'node_modules/**', 'prisma/generated/**']),
);
```

- [ ] **Step 6: Create `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ElectionStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  CLOSED
}

model Election {
  id            String         @id @default(uuid())
  title         String
  description   String?
  academic_year String
  status        ElectionStatus @default(DRAFT)
  start_at      DateTime?
  end_at        DateTime?
  created_at    DateTime       @default(now())
  updated_at    DateTime       @updatedAt

  candidates Candidate[]
  students   Student[]
  tokens     VotingToken[]
  votes      Vote[]

  @@index([status])
}

model Student {
  id         String    @id @default(uuid())
  election_id String
  nis        String
  nisn       String?
  full_name  String
  class_name String
  major      String?
  grade      String?
  has_voted  Boolean   @default(false)
  voted_at   DateTime?
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt

  election Election     @relation(fields: [election_id], references: [id])
  token    VotingToken?

  @@unique([nis])
  @@unique([nisn])
  @@index([class_name])
  @@index([major])
}

model Candidate {
  id                  String   @id @default(uuid())
  election_id         String
  candidate_number    Int
  chairman_name       String
  vice_chairman_name  String?
  photo_url           String?
  vision              String
  mission             String
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  election Election @relation(fields: [election_id], references: [id])
  votes    Vote[]

  @@unique([election_id, candidate_number])
}

model VotingToken {
  id          String    @id @default(uuid())
  election_id String
  student_id  String    @unique
  token       String    @unique
  is_used     Boolean   @default(false)
  expires_at  DateTime?
  created_at  DateTime  @default(now())

  election Election @relation(fields: [election_id], references: [id])
  student  Student  @relation(fields: [student_id], references: [id])
}

model Vote {
  id           String   @id @default(uuid())
  election_id  String
  candidate_id String
  created_at   DateTime @default(now())

  election  Election  @relation(fields: [election_id], references: [id])
  candidate Candidate @relation(fields: [candidate_id], references: [id])

  @@index([candidate_id])
}

model AuditLog {
  id         String   @id @default(uuid())
  actor_type String
  actor_id   String?
  action     String
  entity     String?
  ip_address String?
  user_agent String?
  created_at DateTime @default(now())
}

model Settings {
  id                    Int      @id @default(1)
  school_name           String?
  school_logo           String?
  principal_name        String?
  current_academic_year String?
  updated_at            DateTime @updatedAt
}
```

Note: `Student.nisn` has `@@unique([nisn])` — PostgreSQL treats NULLs as distinct in unique indexes, so multiple students without NISN are allowed. `Vote` intentionally has no `student_id`/`nis`/`nisn` — Anonymous Ballot enforced at schema level.

- [ ] **Step 7: Validate schema and create migration (create-only)**

Run (workdir `apps/api`):
```powershell
pnpm.cmd exec prisma validate
```
Expected: `The schema at prisma/schema.prisma is valid`.

Run:
```powershell
pnpm.cmd exec prisma migrate dev --create-only --name init
```
Expected: `migrations/YYYYMMDDHHMMSS_init/migration.sql` generated.

- [ ] **Step 8: Add partial unique index to migration SQL**

Open `apps/api/prisma/migrations/<timestamp>_init/migration.sql` and append:

```sql
CREATE UNIQUE INDEX "election_single_active" ON "Election" ("status") WHERE "status" = 'ACTIVE';
```

- [ ] **Step 9: Apply migration and generate client**

Run (workdir `apps/api`):
```powershell
pnpm.cmd exec prisma migrate dev
```
Expected: migration applied to `evoting` DB, `@prisma/client` regenerated.

- [ ] **Step 10: Create `apps/api/src/prisma/prisma.service.ts`**

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
```

- [ ] **Step 11: Create `apps/api/src/prisma/prisma.module.ts`**

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 12: Wire PrismaModule into `apps/api/src/app.module.ts`**

Replace the scaffold content:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 13: Create the 8 module skeletons**

Create one file per module, e.g. `apps/api/src/modules/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';

@Module({})
export class AuthModule {}
```

Repeat for: `election`, `student`, `candidate`, `voting`, `dashboard`, `report`, `settings` (same content, class name = PascalCase module name).

- [ ] **Step 14: Create empty common folders**

Run:
```powershell
New-Item -ItemType Directory -Force -Path apps/api/src/common, apps/api/src/config, apps/api/src/middleware, apps/api/src/guards, apps/api/src/interceptors, apps/api/src/filters
```

- [ ] **Step 15: Install, typecheck, lint, test**

Run (root):
```powershell
pnpm.cmd install
```
Expected: workspace install succeeds; postinstall runs `prisma generate` in api.

Run (workdir `apps/api`):
```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test
```
Expected: typecheck exit 0; lint exit 0; jest reports 2 passing specs (scaffold `app.controller.spec.ts` + `app.service.spec.ts`).

- [ ] **Step 16: Verify server boots**

Run (workdir `apps/api`):
```powershell
pnpm.cmd start
```
Wait for `Nest application successfully started` (Ctrl+C after). Expected: port 3001 listening.

- [ ] **Step 17: Commit**

```powershell
git add apps/api pnpm-lock.yaml
git commit -m "feat: scaffold nestjs api with prisma schema"
```

---

### Task 5: Next.js Web Scaffold + shadcn/ui + Folder Structure

**Files:**
- Create: `apps/web/**` (Next.js scaffold)
- Modify: `apps/web/eslint.config.mjs`
- Modify: `apps/web/package.json`
- Modify: `apps/web/tsconfig.json`
- Create: `apps/web/hooks/.gitkeep`
- Create: `apps/web/services/.gitkeep`
- Create: `apps/web/types/.gitkeep`
- Create: `apps/web/styles/.gitkeep`
- Create: `apps/web/components.json` (from shadcn init)

**Interfaces:**
- Consumes: shared `@e-voting/eslint-config` + `@e-voting/tsconfig` from Task 2.
- Produces: Next.js app serving on port 3000 with `components/ui` shadcn primitives. Folder skeleton per architecture doc §6.

- [ ] **Step 1: Scaffold Next.js app**

Run (workdir `apps`):
```powershell
pnpm.cmd dlx create-next-app@latest web --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm --skip-install --yes
```
Expected: `apps/web/` generated (App Router, TS, Tailwind, ESLint, no `src/` dir).

- [ ] **Step 2: Update `apps/web/package.json`**

Set `"name": "@e-voting/web"`, keep scripts from scaffold, and add workspace deps:

```json
{
  "name": "@e-voting/web",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@e-voting/eslint-config": "workspace:*",
    "@e-voting/tsconfig": "workspace:*"
  }
}
```

(Merge with the scaffold's existing dependency block — do not drop react/next/tailwind deps.)

- [ ] **Step 3: Update `apps/web/tsconfig.json`**

Replace scaffold content:

```json
{
  "extends": "@e-voting/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Replace `apps/web/eslint.config.mjs`**

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import baseConfig from '@e-voting/eslint-config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig(
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts']),
);
```

- [ ] **Step 5: Create folder skeleton**

Run:
```powershell
New-Item -ItemType Directory -Force -Path apps/web/hooks, apps/web/services, apps/web/types, apps/web/styles
Set-Content -Path apps/web/hooks/.gitkeep -Value ""
Set-Content -Path apps/web/services/.gitkeep -Value ""
Set-Content -Path apps/web/types/.gitkeep -Value ""
Set-Content -Path apps/web/styles/.gitkeep -Value ""
```

- [ ] **Step 6: Install and init shadcn/ui**

Run (root):
```powershell
pnpm.cmd install
```

Run (workdir `apps/web`):
```powershell
pnpm.cmd dlx shadcn@latest init --yes --base-color neutral
```
Expected: `components.json`, `src/`-less `components/ui/` setup, `app/globals.css` updated with theme tokens.

- [ ] **Step 7: Add a first shadcn component to verify pipeline**

Run (workdir `apps/web`):
```powershell
pnpm.cmd dlx shadcn@latest add button --yes
```
Expected: `apps/web/components/ui/button.tsx` created.

- [ ] **Step 8: Replace `apps/web/app/page.tsx` with a minimal placeholder**

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">E-Voting OSIS</h1>
    </main>
  );
}
```

- [ ] **Step 9: Typecheck, lint, build**

Run (workdir `apps/web`):
```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd build
```
Expected: typecheck exit 0; lint exit 0; build succeeds and prints route table.

- [ ] **Step 10: Commit**

```powershell
git add apps/web pnpm-lock.yaml
git commit -m "feat: scaffold nextjs web app with shadcn ui"
```

---

### Task 6: Git Hooks — Husky, lint-staged, commitlint

**Files:**
- Modify: `package.json` (root — add devDeps + `lint-staged` block)
- Create: `.husky/pre-commit`
- Create: `.husky/commit-msg`
- Create: `commitlint.config.mjs`

**Interfaces:**
- Consumes: root workspace from Task 1.
- Produces: pre-commit runs Prettier on staged files; commit-msg validates Conventional Commits.

- [ ] **Step 1: Add root devDependencies**

Run:
```powershell
pnpm.cmd add -w -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

- [ ] **Step 2: Add `lint-staged` block to root `package.json`**

```json
"lint-staged": {
  "*.{ts,tsx,js,mjs,json,md,css,html,prisma}": "prettier --write"
}
```

- [ ] **Step 3: Initialize husky**

Run:
```powershell
pnpm.cmd exec husky init
```
Expected: `.husky/` directory with `pre-commit` hook created.

- [ ] **Step 4: Replace `.husky/pre-commit`**

```bash
pnpm lint-staged
```

- [ ] **Step 5: Create `.husky/commit-msg`**

```bash
pnpm commitlint --edit "$1"
```

- [ ] **Step 6: Create `commitlint.config.mjs`**

```js
export default {
  extends: ['@commitlint/config-conventional'],
};
```

- [ ] **Step 7: Verify hooks work**

Make a trivial staged change (e.g. touch `apps/web/hooks/.gitkeep`), then:
```powershell
git add apps/web/hooks/.gitkeep
git commit -m "chore: test commit hook"
```
Expected: pre-commit runs prettier; commit-msg passes.
Then try an invalid message on a second commit; expect commit-msg to REJECT it.

- [ ] **Step 8: Commit**

```powershell
git add .husky commitlint.config.mjs package.json pnpm-lock.yaml
git commit -m "chore: add husky, lint-staged, and commitlint"
```

---

### Task 7: CI Pipeline (GitHub Actions)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: root scripts `lint`, `typecheck`, `build` from Task 1.
- Produces: workflow running on push/PR that installs, lints, typechecks, and builds the whole workspace.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  quality:
    name: Lint, Typecheck & Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 11

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Build
        run: pnpm build
```

- [ ] **Step 2: Validate YAML syntax**

Run:
```powershell
node -e "const yaml=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); const lines=yaml.split(/\r?\n/); if(lines.some(l=>l.trim().startsWith('\t'))) throw new Error('tabs found'); console.log('YAML looks OK (no tabs, ' + lines.length + ' lines)')"
```
Expected: prints `YAML looks OK`.

- [ ] **Step 3: Commit**

```powershell
git add .github/workflows/ci.yml
git commit -m "ci: add build and lint pipeline"
```

---

### Task 8: Full Verification, PROGRESS.md, and Final Commit

**Files:**
- Create: `docs/PROGRESS.md`
- Create: `docs/README.md` (project overview + dev commands)

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: verified foundation and project status log per `docs/07_AI_CONVENTION_CODING_STANDARD.md` §7.

- [ ] **Step 1: Full clean verification**

Run from root, in order; all must pass:
```powershell
pnpm.cmd install
pnpm.cmd format:check
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd build
```
Expected: format:check may report files needing formatting — if so run `pnpm format` then re-run `format:check` until clean. lint/typecheck/build exit 0.

- [ ] **Step 2: Verify databases and Prisma against running services**

Run:
```powershell
docker compose -f docker/docker-compose.yml --env-file docker/.env ps
pnpm.cmd --filter @e-voting/api exec prisma migrate status
```
Expected: both containers healthy; `Database schema is up to date`.

- [ ] **Step 3: Create `docs/PROGRESS.md`**

```markdown
# PROGRESS

## 2026-08-06

| Milestone | Feature | Status | Notes |
| --------- | ------- | ------ | ----- |
| Phase 1 | Monorepo setup (Turborepo + pnpm) | Done | apps/web + apps/api |
| Phase 1 | Shared packages (types, eslint-config, tsconfig) | Done | @e-voting/* |
| Phase 1 | Docker infrastructure | Done | PostgreSQL 16 + Redis 7 |
| Phase 1 | Prisma schema | Done | 7 tables, anonymous ballot enforced |
| Phase 1 | Git hooks | Done | Husky + lint-staged + commitlint |
| Phase 1 | CI | Done | Build + lint + typecheck |
```

- [ ] **Step 4: Create `docs/README.md`**

```markdown
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
```

- [ ] **Step 5: Final commits**

```powershell
git add docs/PROGRESS.md docs/README.md
git commit -m "docs: add progress log and project readme"
```

- [ ] **Step 6: Confirm Definition of Done (Phase 1)**

Checklist:
- [ ] `pnpm install` works from root
- [ ] `pnpm dev` starts both apps (spot-check manually)
- [ ] `pnpm build` builds both apps
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] Docker Compose runs PostgreSQL + Redis healthy
- [ ] `prisma validate` + `prisma migrate status` clean
- [ ] Husky pre-commit + commit-msg hooks functional
- [ ] `docs/PROGRESS.md` reflects Phase 1
