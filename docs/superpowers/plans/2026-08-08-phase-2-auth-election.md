# Phase 2: Authentication & Election Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full-stack authentication (admin JWT + student Redis session) and election management (CRUD + status machine), including frontend login pages, landing page, and admin election UI.

**Architecture:** NestJS backend (`apps/api`) with modular monolith: `auth`, `election`, `redis` modules; guards/decorators/interceptor/filter in `src/`. Next.js frontend (`apps/web`) with route groups `(landing at /)`, `/student/*`, `/admin/*`; TanStack Query + typed API client. Admin panel is hidden — reachable only via direct URL `/admin/login`, never linked from the public landing page.

**Tech Stack:** NestJS 11, Prisma 6, @nestjs/jwt, bcrypt, cookie-parser, ioredis, class-validator; Next.js 16, TanStack Query, shadcn/ui, Tailwind v4.

## Global Constraints

- Documentation is the Single Source of Truth (`docs/07_AI_CONVENTION_CODING_STANDARD.md`). Update docs BEFORE code changes that affect them.
- New Admin table MUST be documented in `docs/03_DATABASE.md` before adding the Prisma model.
- Anonymous Ballot: never store student identity in Vote (not touched this phase).
- Response envelope: `{ success, message, data }`; errors `{ success: false, message, errorCode }` per `docs/04_API_SPECS.md`.
- Error codes from API spec: `INVALID_CREDENTIALS`, `INVALID_TOKEN`, `STUDENT_NOT_FOUND`, `ELECTION_NOT_ACTIVE`, `ELECTION_NOT_FOUND`, `MULTIPLE_ACTIVE_ELECTION`, `ALREADY_VOTED`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR`.
- Only one Active election (partial unique index `election_single_active` already in DB).
- Conventional commits; no comments in code unless asked.
- Student login validates: student exists → token matches + unused → election ACTIVE → has_voted false.
- Admin page NOT linked/visible from landing. No admin mention on public pages.

---

### Task 1: Docs Update (Admin Table), Prisma Model, Migration, Env, Seed

**Files:**
- Modify: `docs/03_DATABASE.md` (tables §5, ER §4, relationships §6, constraints §10)
- Modify: `apps/api/prisma/schema.prisma` (add `Admin` model)
- Create: `apps/api/prisma/migrations/<ts>_add_admin/migration.sql` (generated)
- Modify: `apps/api/package.json` (add `db:seed` script, `prisma.seed` config)
- Create: `apps/api/prisma/seed.ts`
- Modify: `apps/api/.env.example`, `apps/api/.env`
- Modify: `docs/04_API_SPECS.md` if endpoints differ (verify at end)

**Interfaces:**
- Produces: `Admin` table (id, username unique, password_hash, full_name?, created_at, updated_at); seed script creating admin from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env; env vars `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `STUDENT_SESSION_TTL`.

- [ ] **Step 1: Update `docs/03_DATABASE.md`**

Add to §4 Entity Relationship: `Admin` standalone entity. Add to §5 Tables an `## Admin` subsection:

```markdown
## Admin

Menyimpan akun administrator.

Field:

* id
* username
* password_hash
* full_name
* created_at
* updated_at

Constraint: username harus unik.
```

Add to §10 Constraints: `Admin: username wajib unik.`

- [ ] **Step 2: Add `Admin` model to schema.prisma**

```prisma
model Admin {
  id            String   @id @default(uuid())
  username      String   @unique
  password_hash String
  full_name     String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
}
```

- [ ] **Step 3: Create migration**

Run (workdir `apps/api`): `pnpm.cmd --filter @e-voting/api exec prisma migrate dev --name add_admin`
Expected: migration applied, client regenerated.

- [ ] **Step 4: Add env vars to `.env.example` and `.env`**

```dotenv
# Auth
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
STUDENT_SESSION_TTL=1800
```

- [ ] **Step 5: Add `db:seed` script + prisma seed config to `apps/api/package.json`**

```json
"db:seed": "prisma db seed"
```
and at the end of package.json:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

- [ ] **Step 6: Install deps**

Run (root): `pnpm.cmd add --filter @e-voting/api bcrypt @nestjs/jwt cookie-parser ioredis`
`pnpm.cmd add -D --filter @e-voting/api @types/bcrypt`

- [ ] **Step 7: Create `apps/api/prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { username },
    update: {},
    create: { username, password_hash: passwordHash, full_name: 'Administrator' },
  });
  console.log(`Admin ready: ${admin.username}`);

  if (process.env.NODE_ENV !== 'production') {
    const devElection = await prisma.election.upsert({
      where: { id: 'dev-election' },
      update: {},
      create: {
        id: 'dev-election',
        title: 'Pemilihan Ketua OSIS 2026/2027',
        description: 'Pemilihan Ketua dan Wakil Ketua OSIS',
        academic_year: '2026/2027',
        status: 'DRAFT',
      },
    });
    console.log(`Dev election ready: ${devElection.title}`);

    for (let i = 1; i <= 2; i++) {
      const nis = String(231000 + i);
      await prisma.student.upsert({
        where: { nis },
        update: {},
        create: {
          nis,
          full_name: `Siswa Demo ${i}`,
          class_name: `XII-${i}`,
          major: 'IPA',
          grade: 'XII',
          election_id: devElection.id,
          token: {
            create: {
              election_id: devElection.id,
              token: `DEMO-${i}-${'ABCD'.slice(0, 4)}`,
            },
          },
        },
      });
      console.log(`Dev student ${nis} ready`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 8: Run seed**

Run (workdir `apps/api`): `pnpm.cmd --filter @e-voting/api db:seed`
Expected: admin + dev election + 2 students logged.

- [ ] **Step 9: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/api typecheck && lint`
Commit: `git add -A && git commit -m "feat: add admin table, seed, and auth env config"`

---

### Task 2: Redis Module + Backend Infrastructure

**Files:**
- Create: `apps/api/src/redis/redis.module.ts`
- Create: `apps/api/src/redis/redis.service.ts`
- Create: `apps/api/src/decorators/roles.decorator.ts`
- Create: `apps/api/src/decorators/current-user.decorator.ts`
- Create: `apps/api/src/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/guards/student-session.guard.ts`
- Create: `apps/api/src/guards/roles.guard.ts`
- Create: `apps/api/src/interceptors/response.interceptor.ts`
- Create: `apps/api/src/filters/http-exception.filter.ts`
- Modify: `apps/api/src/app.module.ts` (import RedisModule)
- Modify: `apps/api/src/main.ts` (cookieParser, ValidationPipe, CORS, prefix, interceptor, filter)
- Modify: `apps/api/.env.example` (REDIS_URL already present)

**Interfaces:**
- Produces: `RedisService` with `get(key): Promise<string|null>`, `setex(key, ttlSeconds, value): Promise<void>`, `del(key): Promise<void>`; `JwtAuthGuard` (attaches `req.user`), `StudentSessionGuard` (attaches `req.session`), `RolesGuard` (checks `req.user.role`), `@Roles(...)`, `@CurrentUser()`; global response interceptor + exception filter.

- [ ] **Step 1: Create `src/redis/redis.service.ts`**

```ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379');
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    await this.client.setex(key, ttlSeconds, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
```

- [ ] **Step 2: Create `src/redis/redis.module.ts`**

```ts
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

- [ ] **Step 3: Create decorators**

`src/decorators/roles.decorator.ts`:
```ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

`src/decorators/current-user.decorator.ts`:
```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

- [ ] **Step 4: Create `src/guards/jwt-auth.guard.ts`**

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['evoting_admin_token'];
    if (!token) throw new UnauthorizedException({ errorCode: 'UNAUTHORIZED' });
    try {
      request.user = await this.jwtService.verifyAsync(token);
      return true;
    } catch {
      throw new UnauthorizedException({ errorCode: 'UNAUTHORIZED' });
    }
  }
}
```

- [ ] **Step 5: Create `src/guards/student-session.guard.ts`**

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class StudentSessionGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.['evoting_student_session'];
    if (!sessionId) throw new UnauthorizedException({ errorCode: 'SESSION_EXPIRED' });
    const raw = await this.redis.get(`student:session:${sessionId}`);
    if (!raw) throw new UnauthorizedException({ errorCode: 'SESSION_EXPIRED' });
    request.session = JSON.parse(raw);
    return true;
  }
}
```

- [ ] **Step 6: Create `src/guards/roles.guard.ts`**

```ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;
    const user = context.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException({ errorCode: 'FORBIDDEN' });
    }
    return true;
  }
}
```

- [ ] **Step 7: Create `src/interceptors/response.interceptor.ts`**

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { success: true; message: string; data: T }> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ success: true; message: string; data: T }> {
    return next.handle().pipe(map((data) => ({ success: true, message: 'Success', data })));
  }
}
```

- [ ] **Step 8: Create `src/filters/http-exception.filter.ts`**

```ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const errorCode =
        typeof body === 'object' && body !== null && 'errorCode' in body
          ? String((body as { errorCode: string }).errorCode)
          : exception.name;
      response.status(exception.getStatus()).json({
        success: false,
        message: exception.message,
        errorCode,
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const code = exception.code === 'P2002' ? 'DUPLICATE_RECORD' : 'INTERNAL_SERVER_ERROR';
      response.status(HttpStatus.CONFLICT).json({
        success: false,
        message: 'Duplicate record violates unique constraint',
        errorCode: code,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_SERVER_ERROR',
    });
  }
}
```

- [ ] **Step 9: Update `src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, RedisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 10: Update `src/main.ts`**

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 11: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/api typecheck && lint && test`
Commit: `git add -A && git commit -m "feat: add redis module, guards, response interceptor, and exception filter"`

---

### Task 3: Auth Module — Admin

**Files:**
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/dto/admin-login.dto.ts`
- Modify: `apps/api/src/modules/auth/auth.module.ts`
- Modify: `apps/api/src/app.module.ts` (import AuthModule, APP_GUARD RolesGuard)

**Interfaces:**
- Consumes: `PrismaService`, `JwtModule` (registered in AuthModule with secret/expiry from env).
- Produces: `POST /api/v1/auth/admin/login` → sets cookie `evoting_admin_token`; `POST /auth/admin/logout`; `GET /auth/admin/profile` (JwtAuthGuard + Roles('ADMIN')).

- [ ] **Step 1: Create `dto/admin-login.dto.ts`**

```ts
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
```

- [ ] **Step 2: Create `auth.service.ts`**

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateAdmin(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { username: dto.username } });
    if (!admin) throw new UnauthorizedException({ errorCode: 'INVALID_CREDENTIALS' });
    const valid = await bcrypt.compare(dto.password, admin.password_hash);
    if (!valid) throw new UnauthorizedException({ errorCode: 'INVALID_CREDENTIALS' });
    return admin;
  }

  async signAdminToken(admin: { id: string; username: string }) {
    const payload = { sub: admin.id, username: admin.username, role: 'ADMIN' };
    return this.jwtService.signAsync(payload);
  }
}
```

- [ ] **Step 3: Create `auth.controller.ts`**

```ts
import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

const ADMIN_COOKIE = 'evoting_admin_token';

@Controller('auth/admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const admin = await this.authService.validateAdmin(dto);
    const token = await this.authService.signAdminToken(admin);
    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });
    return { id: admin.id, username: admin.username, full_name: admin.full_name };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ADMIN_COOKIE);
    return { message: 'Logged out' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async profile(@Req() req: Request) {
    const payload = req.user as { sub: string; username: string };
    const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
    return { id: admin?.id, username: admin?.username, full_name: admin?.full_name };
  }
}
```

(Note: inject `PrismaService` into the controller constructor as well.)

- [ ] **Step 4: Update `auth.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret',
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 5: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/api typecheck && lint && test`
Commit: `git add -A && git commit -m "feat: add admin login with jwt http-only cookie"`

---

### Task 4: Auth Module — Student (Redis Session)

**Files:**
- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/dto/student-login.dto.ts`

**Interfaces:**
- Consumes: `RedisService`, `PrismaService`.
- Produces: `POST /api/v1/auth/student/login` → session cookie; `GET /auth/student/session` (StudentSessionGuard); `POST /auth/student/logout`.

- [ ] **Step 1: Create `dto/student-login.dto.ts`**

```ts
import { IsNotEmpty, IsString } from 'class-validator';

export class StudentLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  token!: string;
}
```

- [ ] **Step 2: Add student methods to `auth.service.ts`**

```ts
import { randomUUID } from 'crypto';
// ...existing imports + RedisService, StudentLoginDto

async loginStudent(dto: StudentLoginDto) {
  const student = await this.prisma.student.findFirst({
    where: { OR: [{ nis: dto.identifier }, { nisn: dto.identifier }] },
    include: { token: true, election: true },
  });
  if (!student) throw new UnauthorizedException({ errorCode: 'STUDENT_NOT_FOUND' });
  if (!student.token || student.token.token !== dto.token || student.token.is_used) {
    throw new UnauthorizedException({ errorCode: 'INVALID_TOKEN' });
  }
  if (student.election.status !== 'ACTIVE') {
    throw new UnauthorizedException({ errorCode: 'ELECTION_NOT_ACTIVE' });
  }
  if (student.has_voted) throw new UnauthorizedException({ errorCode: 'ALREADY_VOTED' });

  const sessionId = randomUUID();
  const ttl = Number(this.config.get<string>('STUDENT_SESSION_TTL') ?? '1800');
  const session = {
    studentId: student.id,
    electionId: student.election_id,
    nis: student.nis,
  };
  await this.redis.setex(`student:session:${sessionId}`, ttl, JSON.stringify(session));
  return { sessionId, student: { full_name: student.full_name, class_name: student.class_name } };
}

async logoutStudent(sessionId: string | undefined) {
  if (sessionId) await this.redis.del(`student:session:${sessionId}`);
}
```

- [ ] **Step 3: Add student endpoints to `auth.controller.ts`**

```ts
@Controller('auth')
// existing /auth/admin routes remain on their own; add a second controller path:
```

Use a separate controller or extend: add to the same file a new controller `@Controller('auth/student')`:

```ts
@Controller('auth/student')
export class StudentAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: StudentLoginDto, @Res({ passthrough: true }) res: Response) {
    const { sessionId, student } = await this.authService.loginStudent(dto);
    res.cookie('evoting_student_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 60 * 1000,
    });
    return student;
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutStudent(req.cookies?.['evoting_student_session']);
    res.clearCookie('evoting_student_session');
    return { message: 'Logged out' };
  }

  @Get('session')
  @UseGuards(StudentSessionGuard)
  async session(@Req() req: Request) {
    return req.session;
  }
}
```

- [ ] **Step 4: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/api typecheck && lint && test`
Commit: `git add -A && git commit -m "feat: add student login with redis temporary session"`

---

### Task 5: Election Module (CRUD + Status Machine)

**Files:**
- Create: `apps/api/src/modules/election/dto/create-election.dto.ts`
- Create: `apps/api/src/modules/election/dto/update-election.dto.ts`
- Create: `apps/api/src/modules/election/election.service.ts`
- Create: `apps/api/src/modules/election/election.controller.ts`
- Modify: `apps/api/src/modules/election/election.module.ts`
- Modify: `apps/api/src/app.module.ts` (import ElectionModule, register RolesGuard globally)

**Interfaces:**
- Consumes: `PrismaService`, guards.
- Produces: `GET /elections` (public), `GET /elections/:id` (public), `POST /elections` (ADMIN), `PATCH /elections/:id` (ADMIN), `POST /elections/:id/start` (ADMIN), `POST /elections/:id/close` (ADMIN). Status machine: DRAFT|SCHEDULED → ACTIVE → CLOSED(terminal).

- [ ] **Step 1: Create DTOs**

`create-election.dto.ts`:
```ts
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ElectionStatus } from '@prisma/client';

export class CreateElectionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  academic_year!: string;

  @IsEnum(ElectionStatus)
  @IsOptional()
  status?: ElectionStatus;

  @IsDateString()
  @IsOptional()
  start_at?: string;

  @IsDateString()
  @IsOptional()
  end_at?: string;
}
```

`update-election.dto.ts`: all fields optional via `PartialType` (use `@nestjs/mapped-types` — included in Nest):
```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateElectionDto } from './create-election.dto';

export class UpdateElectionDto extends PartialType(CreateElectionDto) {}
```

- [ ] **Step 2: Create `election.service.ts`**

```ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ElectionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

@Injectable()
export class ElectionService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.election.findMany({ orderBy: { created_at: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.election.findUnique({
      where: { id },
      include: { candidates: true, students: { select: { id: true } } },
    });
  }

  create(dto: CreateElectionDto) {
    return this.prisma.election.create({ data: dto });
  }

  async update(id: string, dto: UpdateElectionDto) {
    await this.ensureExists(id);
    return this.prisma.election.update({ where: { id }, data: dto });
  }

  async start(id: string) {
    const election = await this.ensureExists(id);
    if (election.status === 'CLOSED') throw new BadRequestException({ errorCode: 'ELECTION_CLOSED' });
    if (election.status === 'ACTIVE') throw new BadRequestException({ errorCode: 'ELECTION_NOT_FOUND' });
    try {
      return await this.prisma.election.update({
        where: { id },
        data: { status: 'ACTIVE', start_at: election.start_at ?? new Date() },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException({ errorCode: 'MULTIPLE_ACTIVE_ELECTION' });
      }
      throw error;
    }
  }

  async close(id: string) {
    const election = await this.ensureExists(id);
    if (election.status !== 'ACTIVE') throw new BadRequestException({ errorCode: 'ELECTION_NOT_FOUND' });
    return this.prisma.election.update({
      where: { id },
      data: { status: 'CLOSED', end_at: new Date() },
    });
  }

  private async ensureExists(id: string) {
    const election = await this.prisma.election.findUnique({ where: { id } });
    if (!election) throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    return election;
  }
}
```

- [ ] **Step 3: Create `election.controller.ts`**

```ts
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ElectionService } from './election.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

@Controller('elections')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  @Get()
  findAll() {
    return this.electionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.electionService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateElectionDto) {
    return this.electionService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateElectionDto) {
    return this.electionService.update(id, dto);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  start(@Param('id') id: string) {
    return this.electionService.start(id);
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  close(@Param('id') id: string) {
    return this.electionService.close(id);
  }
}
```

- [ ] **Step 4: Update `election.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';

@Module({
  controllers: [ElectionController],
  providers: [ElectionService],
})
export class ElectionModule {}
```

- [ ] **Step 5: Update `app.module.ts` — register AuthModule, ElectionModule, global RolesGuard**

```ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ElectionModule } from './modules/election/election.module';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, RedisModule, AuthModule, ElectionModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: RolesGuard }],
})
export class AppModule {}
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/api typecheck && lint && test`
Commit: `git add -A && git commit -m "feat: add election crud and status management"`

---

### Task 6: Frontend Infrastructure

**Files:**
- Modify: `apps/web/package.json` (add deps)
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/services/auth.ts`
- Create: `apps/web/services/elections.ts`
- Create: `apps/web/hooks/use-auth.tsx`
- Modify: `apps/web/app/layout.tsx` (QueryClientProvider)
- Create: `apps/web/middleware.ts`
- Modify: `apps/web/.env.example` (unchanged — NEXT_PUBLIC_API_URL exists)

**Interfaces:**
- Produces: `apiFetch<T>(path, options)` with credentials; `useAuth()` context; middleware protecting `/admin/*` and `/student/*`.

- [ ] **Step 1: Add deps**

Run (workdir `apps/web`): `pnpm.cmd add @tanstack/react-query`
`pnpm.cmd add @e-voting/types@workspace:*`
shadcn components: `pnpm.cmd dlx shadcn@latest add input card dialog table badge label alert-dialog select skeleton separator sonner --yes`

- [ ] **Step 2: Create `lib/api.ts`**

```ts
import type { ApiErrorResponse } from '@e-voting/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = (body ?? {}) as Partial<ApiErrorResponse>;
    throw new ApiError(response.status, err.errorCode ?? 'UNKNOWN_ERROR', err.message ?? 'Request failed');
  }

  return (body as { data: T }).data;
}
```

- [ ] **Step 3: Create `services/auth.ts`**

```ts
import { apiFetch } from '@/lib/api';

export interface AdminProfile {
  id: string;
  username: string;
  full_name: string | null;
}

export interface StudentSession {
  studentId: string;
  electionId: string;
  nis: string;
}

export function adminLogin(username: string, password: string) {
  return apiFetch<AdminProfile>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function adminLogout() {
  return apiFetch<{ message: string }>('/auth/admin/logout', { method: 'POST' });
}

export function adminProfile() {
  return apiFetch<AdminProfile>('/auth/admin/profile');
}

export function studentLogin(identifier: string, token: string) {
  return apiFetch<{ full_name: string; class_name: string }>('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, token }),
  });
}

export function studentLogout() {
  return apiFetch<{ message: string }>('/auth/student/logout', { method: 'POST' });
}

export function studentSession() {
  return apiFetch<StudentSession>('/auth/student/session');
}
```

- [ ] **Step 4: Create `services/elections.ts`**

```ts
import { apiFetch } from '@/lib/api';
import type { Election } from '@e-voting/types';

export type ElectionStatus = Election['status'];

export function listElections() {
  return apiFetch<Election[]>('/elections');
}

export function getElection(id: string) {
  return apiFetch<Election>(`/elections/${id}`);
}

export function createElection(data: Partial<Election>) {
  return apiFetch<Election>('/elections', { method: 'POST', body: JSON.stringify(data) });
}

export function updateElection(id: string, data: Partial<Election>) {
  return apiFetch<Election>(`/elections/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function startElection(id: string) {
  return apiFetch<Election>(`/elections/${id}/start`, { method: 'POST' });
}

export function closeElection(id: string) {
  return apiFetch<Election>(`/elections/${id}/close`, { method: 'POST' });
}
```

- [ ] **Step 5: Create `hooks/use-auth.tsx`**

```tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminLogout, adminProfile, type AdminProfile } from '@/services/auth';

interface AuthContextValue {
  admin: AdminProfile | null;
  isLoading: boolean;
  login: (admin: AdminProfile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    adminProfile()
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = (profile: AdminProfile) => setAdmin(profile);

  const logout = async () => {
    await adminLogout();
    setAdmin(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 6: Update `app/layout.tsx` (add providers)**

```tsx
'use client';

import type { LayoutProps } from 'next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const queryClient = new QueryClient();

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create `middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('evoting_admin_token');
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (pathname.startsWith('/student')) {
    const session = request.cookies.get('evoting_student_session');
    if (!session && pathname !== '/student/login') {
      return NextResponse.redirect(new URL('/student/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*'],
};
```

- [ ] **Step 8: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/web typecheck && lint && build`
Commit: `git add -A && git commit -m "feat: add frontend api client, auth context, and route middleware"`

---

### Task 7: Landing Page + Student Pages

**Files:**
- Modify: `apps/web/app/page.tsx` (landing)
- Create: `apps/web/app/student/login/page.tsx`
- Create: `apps/web/app/student/page.tsx`

**Interfaces:**
- Consumes: `listElections`, `studentLogin`.
- Produces: public landing with CTA → `/student/login`; student login form; post-login page.

- [ ] **Step 1: Landing page `app/page.tsx`**

Server component fetching elections directly (no auth):
```tsx
import Link from 'next/link';
import { listElections } from '@/services/elections';
import { formatPeriod } from '@/lib/format';

export default async function HomePage() {
  const elections = await listElections().catch(() => []);
  const election = elections.find((e) => e.status === 'ACTIVE') ?? elections[0];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-sm">
        {election ? (
          <>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              {election.status === 'ACTIVE' ? 'Sedang Berlangsung' : election.status}
            </span>
            <h1 className="mt-4 text-2xl font-bold">{election.title}</h1>
            <p className="mt-2 text-muted-foreground">{election.description}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Tahun Ajaran {election.academic_year} · {formatPeriod(election)}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Pemilihan Ketua OSIS</h1>
            <p className="mt-2 text-muted-foreground">Belum ada pemilihan yang dijadwalkan.</p>
          </>
        )}
        <div className="mt-8 border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Siap memilih? Gunakan NIS/NISN dan Token Voting yang diberikan panitia untuk memilih pemimpinmu.
          </p>
          <Link
            href="/student/login"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Siap Memilih — Klik di Sini
          </Link>
        </div>
      </div>
    </main>
  );
}
```

Create `lib/format.ts`:
```ts
import type { Election } from '@e-voting/types';

export function formatPeriod(election: Election): string {
  if (!election.start_at && !election.end_at) return 'Waktu akan diumumkan';
  const start = election.start_at ? new Date(election.start_at).toLocaleDateString('id-ID') : 'TBA';
  const end = election.end_at ? new Date(election.end_at).toLocaleDateString('id-ID') : 'TBA';
  return `${start} — ${end}`;
}
```

- [ ] **Step 2: Student login `app/student/login/page.tsx`**

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { studentLogin } from '@/services/auth';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await studentLogin(identifier, token);
      router.push('/student');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.errorCode === 'INVALID_TOKEN'
            ? 'Token voting tidak valid.'
            : err.errorCode === 'ALREADY_VOTED'
              ? 'Anda sudah menggunakan hak pilih.'
              : err.errorCode === 'ELECTION_NOT_ACTIVE'
                ? 'Pemilihan belum dimulai.'
                : 'Login gagal. Periksa kembali data Anda.',
        );
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Siswa</CardTitle>
          <CardDescription>Masukkan NIS/NISN dan Token Voting Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">NIS / NISN</Label>
              <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token Voting</Label>
              <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3: Post-login page `app/student/page.tsx`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { studentLogout, studentSession } from '@/services/auth';

export default function StudentPortalPage() {
  const router = useRouter();
  const { data: session, isLoading } = useQuery({
    queryKey: ['student-session'],
    queryFn: studentSession,
    retry: false,
  });

  if (isLoading) return <main className="flex min-h-screen items-center justify-center">Memuat...</main>;
  if (!session) return <main className="flex min-h-screen items-center justify-center">Sesi berakhir.</main>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">Selamat Datang, {session.nis}</h1>
        <p className="mt-2 text-muted-foreground">
          Pemilihan akan segera dibuka. Nantikan informasi berikutnya.
        </p>
        <button
          onClick={async () => {
            await studentLogout();
            router.push('/');
          }}
          className="mt-6 text-sm text-blue-600 underline"
        >
          Keluar
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/web typecheck && lint && build`
Commit: `git add -A && git commit -m "feat: add landing page and student login flow"`

---

### Task 8: Admin Pages (Login, Layout, Elections)

**Files:**
- Create: `apps/web/app/admin/login/page.tsx`
- Create: `apps/web/app/admin/layout.tsx`
- Create: `apps/web/app/admin/page.tsx`
- Create: `apps/web/app/admin/elections/page.tsx`
- Create: `apps/web/components/admin/sidebar.tsx`
- Create: `apps/web/components/admin/election-table.tsx` (if split needed)

**Interfaces:**
- Consumes: `useAuth`, `listElections`, `createElection`, `updateElection`, `startElection`, `closeElection`.
- Produces: hidden admin panel at `/admin/*`.

- [ ] **Step 1: Admin login `app/admin/login/page.tsx`**

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/services/auth';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const profile = await adminLogin(username, password);
      login(profile);
      router.push('/admin');
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'INVALID_CREDENTIALS') {
        setError('Username atau password salah.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Admin</CardTitle>
          <CardDescription>Masuk sebagai panitia pemilihan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Sidebar `components/admin/sidebar.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/elections', label: 'Election' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuth();

  return (
    <aside className="flex w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-6 font-semibold">E-Voting OSIS</div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-4 py-2 text-sm font-medium ${
              pathname === item.href ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <p className="text-sm font-medium">{admin?.username}</p>
        <button
          onClick={async () => {
            await logout();
            router.push('/admin/login');
          }}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Admin layout `app/admin/layout.tsx`**

```tsx
import type { LayoutProps } from 'next';
import { Sidebar } from '@/components/admin/sidebar';

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Dashboard `app/admin/page.tsx`**

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { listElections } from '@/services/elections';

export default function AdminDashboardPage() {
  const { data: elections, isLoading } = useQuery({ queryKey: ['elections'], queryFn: listElections });
  const active = elections?.find((e) => e.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Total Election</p>
          <p className="mt-2 text-3xl font-bold">{isLoading ? '...' : elections?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Election Aktif</p>
          <p className="mt-2 text-3xl font-bold">{active ? active.title : 'Tidak ada'}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-2 text-3xl font-bold">{active ? 'ACTIVE' : '—'}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Election management `app/admin/elections/page.tsx`**

Client component with TanStack Query mutations:
- Table: title, academic_year, status badge, start/end, actions (Start/Close, Edit)
- Dialog form for create/edit (title, description, academic_year, start_at, end_at)
- AlertDialog confirm for Start/Close
- Empty state when no elections
- Toast/sonner for success/failure

(Full code ~150 lines; use `useMutation` + `queryClient.invalidateQueries({ queryKey: ['elections'] })` after each mutation.)

- [ ] **Step 6: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/web typecheck && lint && build`
Commit: `git add -A && git commit -m "feat: add admin panel with election management"`

---

### Task 9: Verification & Docs Closeout

**Files:**
- Modify: `docs/04_API_SPECS.md` (verify endpoints; adjust if response shapes differ)
- Modify: `docs/PROGRESS.md`
- Modify: `docs/superpowers/plans/2026-08-08-phase-2-auth-election.md` (this plan, if needed)

- [ ] **Step 1: Full root verification**

Run: `pnpm.cmd install && format && format:check && lint && typecheck && build` — all must pass.

- [ ] **Step 2: API smoke tests (manual)**

Start Docker (`pnpm db:up`), start API dev server:
1. `POST /api/v1/auth/admin/login` with seed admin → 200, cookie set
2. `POST /api/v1/elections` (with cookie) → 201
3. `POST /api/v1/elections/{id}/start` → ACTIVE
4. `POST /api/v1/elections/{id}/start` (second election) → `MULTIPLE_ACTIVE_ELECTION`
5. `POST /api/v1/auth/student/login` with seeded student + token → 200, cookie set
6. Second student login → `ALREADY_VOTED` after voting (skip — Phase 4)
7. Unauthenticated `/api/v1/elections` POST → 401

- [ ] **Step 3: Update `docs/PROGRESS.md`**

Add Phase 2 row: Authentication & Election — Done (admin JWT login, student Redis session, election CRUD + status).

- [ ] **Step 4: Update `docs/04_API_SPECS.md` if needed**

Verify every implemented endpoint matches the spec's path/method/roles; adjust the doc only where implementation deviates (e.g., election list is public).

- [ ] **Step 5: Final commit**

`git add -A && git commit -m "docs: update progress and api spec for phase 2"`
