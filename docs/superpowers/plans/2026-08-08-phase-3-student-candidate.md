# Phase 3: Student & Candidate Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full-stack data master management — Student CRUD with Excel import/export and voting tokens, Candidate CRUD with photo upload — plus the admin UI pages.

**Architecture:** NestJS modules `student` and `candidate` with admin-guarded controllers; token generation util; multer photo upload to local `/uploads/candidate-photo`; SheetJS (xlsx) for Excel; Next.js admin pages with election selector, TanStack Query, shadcn/ui.

**Tech Stack:** NestJS 11, Prisma 6, xlsx, multer, class-validator; Next.js 16, TanStack Query, shadcn/ui.

## Global Constraints

- Docs are source of truth: `docs/04_API_SPECS.md` paths used verbatim. `/student-elections/:id/reset` and `/student-elections/:id/token/reset` where `:id` = student id (no StudentElection table exists — **assumption documented**).
- Delete/reset only when election status is DRAFT or SCHEDULED (before Active) → else `VOTING_NOT_ALLOWED` (`docs/03_DATABASE.md` §11).
- Token format: `XXXX-XXXX` uppercase, alphabet without ambiguous chars (0/O/1/I/L).
- Error codes: `DUPLICATE_NIS`, `DUPLICATE_NISN`, `DUPLICATE_CANDIDATE_NUMBER`, `CANDIDATE_NOT_FOUND`, `STUDENT_NOT_FOUND`, `ELECTION_NOT_FOUND`, `VOTING_NOT_ALLOWED`, `VALIDATION_ERROR`.
- Photos: local storage `/uploads/candidate-photo/`, images only (jpeg/png/webp), max 2MB.
- Rate limiting on import (2/min) deferred to Phase 6.
- Response envelope `{success, message, data}`; conventional commits; no code comments unless asked.

---

### Task 1: Backend Infra — Token Util, P2002 Mapping, Static Uploads

**Files:**
- Create: `apps/api/src/common/token.util.ts`
- Modify: `apps/api/src/filters/http-exception.filter.ts`
- Modify: `apps/api/src/interceptors/response.interceptor.ts`
- Modify: `apps/api/src/main.ts`

**Interfaces:**
- Produces: `generateVotingToken(): string`; P2002 error mapping by constraint field; `/uploads` static serving; interceptor skips already-sent responses.

- [ ] **Step 1: Add deps**

Run (root): `pnpm.cmd add --filter @e-voting/api xlsx` and `pnpm.cmd add -D --filter @e-voting/api @types/multer`

- [ ] **Step 2: Create `src/common/token.util.ts`**

```ts
import { randomBytes } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateVotingToken(): string {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}
```

- [ ] **Step 3: Extend P2002 branch in `http-exception.filter.ts`**

Replace the existing P2002 branch with field-aware mapping:

```ts
if (exception instanceof Prisma.PrismaClientKnownRequestError) {
  const target = (exception.meta?.target ?? []) as string[];
  const field = Array.isArray(target) ? target[0] : '';
  const code =
    field === 'nis'
      ? 'DUPLICATE_NIS'
      : field === 'nisn'
        ? 'DUPLICATE_NISN'
        : field === 'candidate_number'
          ? 'DUPLICATE_CANDIDATE_NUMBER'
          : field === 'token'
            ? 'DUPLICATE_TOKEN'
            : 'DUPLICATE_RECORD';
  response.status(HttpStatus.CONFLICT).json({
    success: false,
    message: 'Duplicate record violates unique constraint',
    errorCode: code,
  });
  return;
}
```

- [ ] **Step 4: Update `response.interceptor.ts`**

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, { success: true; message: string; data: T }>
{
  intercept(context: ExecutionContext, next: CallHandler<T>) {
    const res = context.switchToHttp().getResponse<Response>();
    if (res.headersSent) return next.handle();
    return next.handle().pipe(map((data) => ({ success: true, message: 'Success', data })));
  }
}
```

- [ ] **Step 5: Update `main.ts` — uploads dir + static serving**

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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

  const uploadsDir = join(process.cwd(), 'uploads');
  mkdirSync(join(uploadsDir, 'candidate-photo'), { recursive: true });
  app.use('/uploads', express.static(uploadsDir));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/api typecheck && lint && test`
Commit: `feat: add token util, upload static serving, and p2002 error mapping`

---

### Task 2: Student Module — CRUD, Token Generation, Reset Endpoints

**Files:**
- Create: `apps/api/src/modules/student/dto/create-student.dto.ts`
- Create: `apps/api/src/modules/student/dto/update-student.dto.ts`
- Create: `apps/api/src/modules/student/student.service.ts`
- Create: `apps/api/src/modules/student/student.controller.ts`
- Modify: `apps/api/src/modules/student/student.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/modules/student/student.service.spec.ts`

**Interfaces:**
- Consumes: `generateVotingToken`, `PrismaService`.
- Produces: student CRUD + `PATCH /student-elections/:id/reset`, `POST /student-elections/:id/token/reset` (id = student id). All admin-guarded.

- [ ] **Step 1: Create DTOs**

`create-student.dto.ts`:
```ts
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsString() @IsNotEmpty() nis!: string;
  @IsString() @IsOptional() nisn?: string;
  @IsString() @IsNotEmpty() full_name!: string;
  @IsString() @IsNotEmpty() class_name!: string;
  @IsString() @IsOptional() major?: string;
  @IsString() @IsOptional() grade?: string;
  @IsUUID() @IsNotEmpty() election_id!: string;
}
```

`update-student.dto.ts`:
```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
```

- [ ] **Step 2: Create `student.service.ts`**

```ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateVotingToken } from '../../common/token.util';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(electionId?: string) {
    return this.prisma.student.findMany({
      where: { election_id: electionId },
      include: { token: true },
      orderBy: { class_name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.student.findUnique({ where: { id }, include: { token: true } });
  }

  async create(dto: CreateStudentDto) {
    const token = generateVotingToken();
    return this.prisma.student.create({
      data: {
        ...dto,
        token: { create: { election_id: dto.election_id, token } },
      },
      include: { token: true },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.ensureExists(id);
    return this.prisma.student.update({ where: { id }, data: dto, include: { token: true } });
  }

  async remove(id: string) {
    const student = await this.ensureExists(id);
    await this.ensureEditable(student.election_id);
    return this.prisma.student.delete({ where: { id } });
  }

  async resetVote(id: string) {
    const student = await this.ensureExists(id);
    await this.ensureEditable(student.election_id);
    await this.prisma.votingToken.updateMany({
      where: { student_id: id },
      data: { is_used: false },
    });
    return this.prisma.student.update({
      where: { id },
      data: { has_voted: false, voted_at: null },
      include: { token: true },
    });
  }

  async resetToken(id: string) {
    const student = await this.ensureExists(id);
    await this.ensureEditable(student.election_id);
    const token = generateVotingToken();
    return this.prisma.votingToken.upsert({
      where: { student_id: id },
      update: { token, is_used: false },
      create: { student_id: id, election_id: student.election_id, token },
      include: { student: true },
    });
  }

  private async ensureExists(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException({ errorCode: 'STUDENT_NOT_FOUND' });
    return student;
  }

  private async ensureEditable(electionId: string) {
    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    if (election.status === 'ACTIVE' || election.status === 'CLOSED') {
      throw new BadRequestException({ errorCode: 'VOTING_NOT_ALLOWED' });
    }
  }
}
```

- [ ] **Step 3: Create `student.controller.ts`**

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('students')
  findAll(@Query('electionId') electionId?: string) {
    return this.studentService.findAll(electionId);
  }

  @Get('students/:id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Post('students')
  create(@Body() dto: CreateStudentDto) {
    return this.studentService.create(dto);
  }

  @Patch('students/:id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentService.update(id, dto);
  }

  @Delete('students/:id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Patch('student-elections/:id/reset')
  resetVote(@Param('id') id: string) {
    return this.studentService.resetVote(id);
  }

  @Post('student-elections/:id/token/reset')
  resetToken(@Param('id') id: string) {
    return this.studentService.resetToken(id);
  }
}
```

- [ ] **Step 4: Update `student.module.ts` and register in `app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
```

- [ ] **Step 5: Create `student.service.spec.ts` (mocked Prisma)**

```ts
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StudentService } from './student.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StudentService', () => {
  let service: StudentService;
  const prismaMock = {
    student: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    votingToken: { updateMany: jest.fn(), upsert: jest.fn() },
    election: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [StudentService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(StudentService);
    jest.clearAllMocks();
  });

  it('creates a student with a generated token', async () => {
    prismaMock.student.create.mockResolvedValue({ id: 's1' });
    await service.create({
      nis: '231001',
      full_name: 'A',
      class_name: 'XII-1',
      election_id: 'e1',
    });
    const data = prismaMock.student.create.mock.calls[0][0].data;
    expect(data.token.create.token).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it('rejects delete when election is active', async () => {
    prismaMock.student.findUnique.mockResolvedValue({ id: 's1', election_id: 'e1' });
    prismaMock.election.findUnique.mockResolvedValue({ id: 'e1', status: 'ACTIVE' });
    await expect(service.remove('s1')).rejects.toThrow(BadRequestException);
  });

  it('allows reset token before election starts', async () => {
    prismaMock.student.findUnique.mockResolvedValue({ id: 's1', election_id: 'e1' });
    prismaMock.election.findUnique.mockResolvedValue({ id: 'e1', status: 'DRAFT' });
    prismaMock.votingToken.upsert.mockResolvedValue({ id: 't1' });
    await service.resetToken('s1');
    const { token } = prismaMock.votingToken.upsert.mock.calls[0][1].update;
    expect(token).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/api typecheck && lint && test`
Commit: `feat: add student crud with token generation and reset endpoints`

---

### Task 3: Student Import/Export Excel

**Files:**
- Modify: `apps/api/src/modules/student/student.service.ts`
- Modify: `apps/api/src/modules/student/student.controller.ts`
- Create: `apps/api/src/common/excel.util.ts`

**Interfaces:**
- Produces: `POST /students/import` (multipart) → `{imported, failed, total}`; `POST /students/export?electionId=` → xlsx attachment.

- [ ] **Step 1: Create `src/common/excel.util.ts`**

```ts
import * as XLSX from 'xlsx';

export function parseExcelRows<T = Record<string, unknown>>(buffer: Buffer): T[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<T>(sheet);
}

export function buildExcelBuffer<T>(rows: T[], sheetName: string): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
```

- [ ] **Step 2: Add import/export to `student.service.ts`**

```ts
import { parseExcelRows, buildExcelBuffer } from '../../common/excel.util';

async importStudents(electionId: string, buffer: Buffer) {
  await this.ensureEditable(electionId);
  const rows = parseExcelRows(buffer);
  let imported = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const nis = String(row['nis'] ?? row['NIS'] ?? '').trim();
      const full_name = String(row['full_name'] ?? row['Nama'] ?? '').trim();
      if (!nis || !full_name) {
        failed++;
        continue;
      }
      const data = {
        nis,
        nisn: String(row['nisn'] ?? row['NISN'] ?? '').trim() || null,
        full_name,
        class_name: String(row['class_name'] ?? row['Kelas'] ?? '').trim(),
        major: String(row['major'] ?? row['Jurusan'] ?? '').trim() || null,
        grade: String(row['grade'] ?? row['Grade'] ?? '').trim() || null,
        election_id: electionId,
      };
      const existing = await this.prisma.student.findUnique({ where: { nis } });
      if (existing) {
        await this.prisma.student.update({ where: { nis }, data });
      } else {
        await this.prisma.student.create({
          data: { ...data, token: { create: { election_id: electionId, token: generateVotingToken() } } },
        });
      }
      imported++;
    } catch {
      failed++;
    }
  }
  return { imported, failed, total: rows.length };
}

async exportStudents(electionId: string) {
  const students = await this.prisma.student.findMany({
    where: { election_id: electionId },
    include: { token: true },
    orderBy: { class_name: 'asc' },
  });
  const rows = students.map((s) => ({
    NIS: s.nis,
    NISN: s.nisn ?? '',
    Nama: s.full_name,
    Kelas: s.class_name,
    Jurusan: s.major ?? '',
    Grade: s.grade ?? '',
    Token: s.token?.token ?? '',
    'Status Voting': s.has_voted ? 'Sudah' : 'Belum',
  }));
  const buffer = buildExcelBuffer(rows, 'Siswa');
  return { buffer, filename: `students-${Date.now()}.xlsx` };
}
```

- [ ] **Step 3: Add controller routes**

```ts
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

// in controller:
@Post('students/import')
@UseInterceptors(FileInterceptor('file'))
async importStudents(@Query('electionId') electionId: string, @UploadedFile() file: Express.Multer.File) {
  return this.studentService.importStudents(electionId, file.buffer);
}

@Post('students/export')
async exportStudents(@Query('electionId') electionId: string, @Res() res: Response) {
  const { buffer, filename } = await this.studentService.exportStudents(electionId);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}
```

- [ ] **Step 4: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/api typecheck && lint && test`
Commit: `feat: add excel import and export for students`

---

### Task 4: Candidate Module — CRUD + Photo Upload

**Files:**
- Create: `apps/api/src/modules/candidate/dto/create-candidate.dto.ts`
- Create: `apps/api/src/modules/candidate/dto/update-candidate.dto.ts`
- Create: `apps/api/src/modules/candidate/candidate.service.ts`
- Create: `apps/api/src/modules/candidate/candidate.controller.ts`
- Modify: `apps/api/src/modules/candidate/candidate.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/prisma/seed.ts` (add dev candidates)
- Create: `apps/api/src/modules/candidate/candidate.service.spec.ts`

**Interfaces:**
- Produces: candidate CRUD + `POST /candidates/:id/photo` (multipart). Admin-guarded.

- [ ] **Step 1: Create DTOs**

`create-candidate.dto.ts`:
```ts
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCandidateDto {
  @IsUUID() @IsNotEmpty() election_id!: string;
  @IsInt() @Min(1) candidate_number!: number;
  @IsString() @IsNotEmpty() chairman_name!: string;
  @IsString() @IsOptional() vice_chairman_name?: string;
  @IsString() @IsNotEmpty() vision!: string;
  @IsString() @IsNotEmpty() mission!: string;
}
```
`update-candidate.dto.ts`: PartialType wrapper.

- [ ] **Step 2: Create `candidate.service.ts`**

```ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidateService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(electionId?: string) {
    return this.prisma.candidate.findMany({
      where: { election_id: electionId },
      orderBy: { candidate_number: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.candidate.findUnique({ where: { id } });
  }

  create(dto: CreateCandidateDto) {
    return this.prisma.candidate.create({ data: dto });
  }

  async update(id: string, dto: UpdateCandidateDto) {
    await this.ensureExists(id);
    return this.prisma.candidate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const candidate = await this.ensureExists(id);
    await this.ensureEditable(candidate.election_id);
    return this.prisma.candidate.delete({ where: { id } });
  }

  async updatePhoto(id: string, photoUrl: string) {
    const candidate = await this.ensureExists(id);
    await this.ensureEditable(candidate.election_id);
    return this.prisma.candidate.update({ where: { id }, data: { photo_url: photoUrl } });
  }

  private async ensureExists(id: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException({ errorCode: 'CANDIDATE_NOT_FOUND' });
    return candidate;
  }

  private async ensureEditable(electionId: string) {
    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    if (election.status === 'ACTIVE' || election.status === 'CLOSED') {
      throw new BadRequestException({ errorCode: 'VOTING_NOT_ALLOWED' });
    }
  }
}
```

- [ ] **Step 3: Create `candidate.controller.ts`**

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get()
  findAll(@Query('electionId') electionId?: string) {
    return this.candidateService.findAll(electionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidateService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCandidateDto) {
    return this.candidateService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidateService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidateService.remove(id);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'candidate-photo'),
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
    }),
  )
  uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.candidateService.updatePhoto(id, `/uploads/candidate-photo/${file.filename}`);
  }
}
```

- [ ] **Step 4: Update `candidate.module.ts` + register in `app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';

@Module({
  controllers: [CandidateController],
  providers: [CandidateService],
})
export class CandidateModule {}
```

- [ ] **Step 5: Update seed — add dev candidates**

In `prisma/seed.ts`, after dev students:
```ts
for (let i = 1; i <= 2; i++) {
  await prisma.candidate.upsert({
    where: {
      election_id_candidate_number: { election_id: devElection.id, candidate_number: i },
    },
    update: {},
    create: {
      election_id: devElection.id,
      candidate_number: i,
      chairman_name: `Kandidat ${i}`,
      vice_chairman_name: `Wakil ${i}`,
      vision: 'Visi kandidat ' + i,
      mission: 'Misi kandidat ' + i,
    },
  });
  console.log(`Dev candidate ${i} ready`);
}
```
Run `pnpm.cmd --filter @e-voting/api db:seed`.

- [ ] **Step 6: Create `candidate.service.spec.ts` (mocked Prisma)**

Tests: create persists dto; remove blocked when election ACTIVE throws BadRequestException.

- [ ] **Step 7: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/api typecheck && lint && test`
Commit: `feat: add candidate crud and photo upload`

---

### Task 5: Frontend Infra — API Client, Services, Sidebar

**Files:**
- Modify: `apps/web/lib/api.ts`
- Create: `apps/web/services/students.ts`
- Create: `apps/web/services/candidates.ts`
- Modify: `apps/web/components/admin/sidebar.tsx`
- Create: `apps/web/components/admin/election-select.tsx`

**Interfaces:**
- Produces: `apiFetchBlob`; student/candidate service functions; `ElectionSelect` component.

- [ ] **Step 1: Update `lib/api.ts` — FormData + blob support**

Only set `Content-Type: application/json` when body is not FormData; add `apiFetchBlob`:
```ts
export async function apiFetchBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const response = await fetch(`${BASE_URL}${path}`, { ...options, credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.errorCode ?? 'UNKNOWN_ERROR', body?.message ?? 'Request failed');
  }
  return response.blob();
}
```

- [ ] **Step 2: Create `services/students.ts`**

```ts
import { apiFetch, apiFetchBlob } from '@/lib/api';
import type { Student, VotingToken } from '@e-voting/types';

export type StudentWithToken = Student & { token: VotingToken | null };

export interface ImportResult {
  imported: number;
  failed: number;
  total: number;
}

export function listStudents(electionId: string) {
  return apiFetch<StudentWithToken[]>(`/students?electionId=${electionId}`);
}

export function createStudent(data: Partial<Student>) {
  return apiFetch<StudentWithToken>('/students', { method: 'POST', body: JSON.stringify(data) });
}

export function updateStudent(id: string, data: Partial<Student>) {
  return apiFetch<StudentWithToken>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteStudent(id: string) {
  return apiFetch<{ message: string }>(`/students/${id}`, { method: 'DELETE' });
}

export function resetStudentVote(id: string) {
  return apiFetch<StudentWithToken>(`/student-elections/${id}/reset`, { method: 'PATCH' });
}

export function resetStudentToken(id: string) {
  return apiFetch<VotingToken>(`/student-elections/${id}/token/reset`, { method: 'POST' });
}

export function importStudents(electionId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<ImportResult>(`/students/import?electionId=${electionId}`, {
    method: 'POST',
    body: form,
  });
}

export async function exportStudents(electionId: string) {
  const blob = await apiFetchBlob(`/students/export?electionId=${electionId}`, { method: 'POST' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: Create `services/candidates.ts`**

```ts
import { apiFetch } from '@/lib/api';
import type { Candidate } from '@e-voting/types';

export function listCandidates(electionId: string) {
  return apiFetch<Candidate[]>(`/candidates?electionId=${electionId}`);
}

export function createCandidate(data: Partial<Candidate>) {
  return apiFetch<Candidate>('/candidates', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCandidate(id: string, data: Partial<Candidate>) {
  return apiFetch<Candidate>(`/candidates/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteCandidate(id: string) {
  return apiFetch<{ message: string }>(`/candidates/${id}`, { method: 'DELETE' });
}

export function uploadCandidatePhoto(id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<Candidate>(`/candidates/${id}/photo`, { method: 'POST', body: form });
}
```

- [ ] **Step 4: Create `components/admin/election-select.tsx`**

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { listElections } from '@/services/elections';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ElectionSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function ElectionSelect({ value, onChange }: ElectionSelectProps) {
  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: listElections,
  });

  return (
    <div className="space-y-2">
      <Label>Election</Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading || !elections?.length}>
        <SelectTrigger className="w-72">
          <SelectValue placeholder={isLoading ? 'Memuat...' : 'Pilih election'} />
        </SelectTrigger>
        <SelectContent>
          {elections?.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.title} ({e.status})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 5: Update `sidebar.tsx` NAV**

```tsx
const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/elections', label: 'Election' },
  { href: '/admin/candidates', label: 'Candidates' },
  { href: '/admin/students', label: 'Students' },
];
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/web exec next typegen && typecheck && lint && build`
Commit: `feat: add frontend services and sidebar for students and candidates`

---

### Task 6: Admin Candidates Page

**File:** `apps/web/app/admin/candidates/page.tsx`

- [ ] **Step 1: Create the page**

Client component: election selector (default first election via useEffect on elections query), candidates table (Nomor, Foto, Ketua, Wakil, Aksi), add/edit dialog (candidate_number, chairman_name, vice_chairman_name, vision, mission + photo file input with preview), delete AlertDialog, Toaster. Mutations invalidate `['candidates', electionId]`. Disable Edit/Delete actions when selected election status is ACTIVE or CLOSED (UI mirror of `VOTING_NOT_ALLOWED`). Photo: `<img src={apiBase + photo_url}>` with fallback to a placeholder div; on edit-save with a new file, call `uploadCandidatePhoto` after `updateCandidate`. Empty state: "Belum ada kandidat."

- [ ] **Step 2: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/web exec next typegen && typecheck && lint && build`
Commit: `feat: add admin candidates management page`

---

### Task 7: Admin Students Page (Import/Export)

**File:** `apps/web/app/admin/students/page.tsx`

- [ ] **Step 1: Create the page**

Client component: election selector, students table (NIS, Nama, Kelas, Jurusan, Token monospace, Status Voting badge, Aksi), add/edit dialog (nis, nisn, full_name, class_name, major, grade), action buttons Reset Token / Reset Voting / Delete each with AlertDialog confirm (disabled when election not editable), Import dialog (file input `.xlsx`, submit → show `{imported, failed}` summary inside dialog, then refresh), Export button (calls `exportStudents`, success toast), Toaster. Empty state: "Belum ada siswa."

- [ ] **Step 2: Verify and commit**

Run: `pnpm.cmd --filter @e-voting/web exec next typegen && typecheck && lint && build`
Commit: `feat: add admin students management page with import and export`

---

### Task 8: Verification & Docs Closeout

**Files:**
- Modify: `docs/04_API_SPECS.md`
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Full root verification**

Run: `pnpm.cmd format && format:check && lint && typecheck && build && pnpm.cmd --filter @e-voting/api test` — all must pass.

- [ ] **Step 2: Live smoke test**

Start `pnpm dev` (both apps). Flow: admin login → create DRAFT election → add candidate (with photo) → add student → start election → delete candidate (expect `VOTING_NOT_ALLOWED`) → close election. Generate an Excel import file via script with 2 new students, import, verify tokens created. Export and verify non-empty xlsx.

- [ ] **Step 3: Update `docs/04_API_SPECS.md`**

- Add note on `/candidates` and `/students`: optional `electionId` query param filters by election.
- Document token format: `XXXX-XXXX` (uppercase, tanpa karakter ambigu).
- Note under Student Election section: `:id` merujuk pada student id.

- [ ] **Step 4: Update `docs/PROGRESS.md`**

Add Phase 3 rows: Student CRUD, Import Excel, Export Excel, Candidate CRUD, Upload Photo, Token Generator, Reset Token.

- [ ] **Step 5: Final commit**

`git add -A && git commit -m "docs: update api spec and progress for phase 3"`
