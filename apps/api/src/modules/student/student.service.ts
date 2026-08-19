import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateVotingToken } from '../../common/token.util';
import { parseExcelRows, buildExcelBuffer } from '../../common/excel.util';
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
    return this.prisma.student.findUnique({
      where: { id },
      include: { token: true },
    });
  }

  async create(dto: CreateStudentDto) {
    const token = generateVotingToken();
    return this.prisma.student.create({
      data: {
        ...dto,
        token: {
          create: {
            election_id: dto.election_id,
            token,
            expires_at: this.tokenExpiry(),
          },
        },
      },
      include: { token: true },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.ensureExists(id);
    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: { token: true },
    });
  }

  async remove(id: string) {
    const student = await this.ensureExists(id);
    await this.ensureEditable(student.election_id);
    return this.prisma.$transaction([
      this.prisma.votingToken.deleteMany({ where: { student_id: id } }),
      this.prisma.student.delete({ where: { id } }),
    ]);
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
    await this.ensureTokenResetAllowed(student.election_id, student.id);
    const token = generateVotingToken();
    return this.prisma.votingToken.upsert({
      where: { student_id: id },
      update: { token, is_used: false, expires_at: this.tokenExpiry() },
      create: {
        student_id: id,
        election_id: student.election_id,
        token,
        expires_at: this.tokenExpiry(),
      },
      include: { student: true },
    });
  }

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
        const existing = await this.prisma.student.findUnique({
          where: { election_id_nis: { election_id: electionId, nis } },
        });
        if (existing) {
          await this.prisma.student.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await this.prisma.student.create({
            data: {
              ...data,
              token: {
                create: {
                  election_id: electionId,
                  token: generateVotingToken(),
                  expires_at: this.tokenExpiry(),
                },
              },
            },
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

  private tokenExpiry(): Date {
    const hours = Number(process.env.TOKEN_EXPIRY_HOURS ?? '24');
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  private async ensureExists(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student)
      throw new NotFoundException({ errorCode: 'STUDENT_NOT_FOUND' });
    return student;
  }

  private async ensureEditable(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    if (election.status === 'ACTIVE' || election.status === 'CLOSED') {
      throw new BadRequestException({ errorCode: 'VOTING_NOT_ALLOWED' });
    }
  }

  private async ensureTokenResetAllowed(electionId: string, studentId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    if (election.status === 'CLOSED') {
      throw new BadRequestException({ errorCode: 'ELECTION_CLOSED' });
    }
    if (election.status === 'ACTIVE') {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
      });
      if (student?.has_voted) {
        throw new BadRequestException({ errorCode: 'ALREADY_VOTED' });
      }
    }
  }
}
