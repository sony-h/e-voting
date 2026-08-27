import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateVotingToken } from '../../common/token.util';
import { parseExcelRows, buildExcelBuffer } from '../../common/excel.util';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffRole } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(electionId?: string) {
    return this.prisma.staffVoter.findMany({
      where: { election_id: electionId },
      include: { token: true },
      orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
    });
  }

  findPublic(electionId?: string) {
    return this.prisma.staffVoter.findMany({
      where: { election_id: electionId },
      select: {
        id: true,
        nip: true,
        username: true,
        full_name: true,
        role: true,
        election_id: true,
      },
      orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.staffVoter.findUnique({
      where: { id },
      include: { token: true },
    });
  }

  async create(dto: CreateStaffDto) {
    if (!dto.nip && !dto.username) {
      throw new BadRequestException({
        errorCode: 'NIP_OR_USERNAME_REQUIRED',
        message: 'NIP atau Username/Kode wajib diisi.',
      });
    }

    const token = generateVotingToken();
    return this.prisma.staffVoter.create({
      data: {
        ...dto,
        role: dto.role ?? StaffRole.TEACHER,
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

  async update(id: string, dto: UpdateStaffDto) {
    await this.ensureExists(id);
    return this.prisma.staffVoter.update({
      where: { id },
      data: dto,
      include: { token: true },
    });
  }

  async remove(id: string) {
    const staff = await this.ensureExists(id);
    await this.ensureEditable(staff.election_id);
    return this.prisma.$transaction([
      this.prisma.votingToken.deleteMany({ where: { staff_id: id } }),
      this.prisma.staffVoter.delete({ where: { id } }),
    ]);
  }

  async resetVote(id: string) {
    const staff = await this.ensureExists(id);
    await this.ensureEditable(staff.election_id);
    await this.prisma.votingToken.updateMany({
      where: { staff_id: id },
      data: { is_used: false },
    });
    return this.prisma.staffVoter.update({
      where: { id },
      data: { has_voted: false, voted_at: null },
      include: { token: true },
    });
  }

  async resetToken(id: string) {
    const staff = await this.ensureExists(id);
    await this.ensureTokenResetAllowed(staff.election_id, staff.id);
    const token = generateVotingToken();
    return this.prisma.votingToken.upsert({
      where: { staff_id: id },
      update: { token, is_used: false, expires_at: this.tokenExpiry() },
      create: {
        staff_id: id,
        election_id: staff.election_id,
        token,
        expires_at: this.tokenExpiry(),
      },
      include: { staff: true },
    });
  }

  async importStaff(electionId: string, buffer: Buffer) {
    await this.ensureEditable(electionId);
    const rows = parseExcelRows(buffer);
    let imported = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        const nip = String(row['nip'] ?? row['NIP'] ?? '').trim() || null;
        const username =
          String(
            row['username'] ?? row['Username'] ?? row['Kode'] ?? '',
          ).trim() || null;
        const full_name = String(
          row['full_name'] ?? row['Nama'] ?? row['nama'] ?? '',
        ).trim();
        const roleRaw = String(
          row['role'] ?? row['Role'] ?? row['Jabatan'] ?? '',
        )
          .trim()
          .toUpperCase();
        const role =
          roleRaw.includes('STAF') ||
          roleRaw.includes('STAFF') ||
          roleRaw.includes('TENDIK')
            ? StaffRole.STAFF
            : StaffRole.TEACHER;

        if (!full_name || (!nip && !username)) {
          failed++;
          continue;
        }

        const data = {
          nip,
          username,
          full_name,
          role,
          election_id: electionId,
        };

        let existing = null;
        if (nip) {
          existing = await this.prisma.staffVoter.findUnique({
            where: { election_id_nip: { election_id: electionId, nip } },
          });
        }
        if (!existing && username) {
          existing = await this.prisma.staffVoter.findUnique({
            where: {
              election_id_username: { election_id: electionId, username },
            },
          });
        }

        if (existing) {
          await this.prisma.staffVoter.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await this.prisma.staffVoter.create({
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

  async exportStaff(electionId: string) {
    const staffList = await this.prisma.staffVoter.findMany({
      where: { election_id: electionId },
      include: { token: true },
      orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
    });
    const rows = staffList.map((s) => ({
      NIP: s.nip ?? '',
      Username: s.username ?? '',
      Nama: s.full_name,
      Role: s.role === 'TEACHER' ? 'Guru' : 'Staf/Tendik',
      Token: s.token?.token ?? '',
      'Status Voting': s.has_voted ? 'Sudah' : 'Belum',
    }));
    const buffer = buildExcelBuffer(rows, 'Guru_dan_Staf');
    return { buffer, filename: `guru-staf-${Date.now()}.xlsx` };
  }

  private tokenExpiry(): Date {
    const hours = Number(process.env.TOKEN_EXPIRY_HOURS ?? '24');
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  private async ensureExists(id: string) {
    const staff = await this.prisma.staffVoter.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException({ errorCode: 'STAFF_NOT_FOUND' });
    return staff;
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

  private async ensureTokenResetAllowed(electionId: string, staffId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    if (election.status === 'CLOSED') {
      throw new BadRequestException({ errorCode: 'ELECTION_CLOSED' });
    }
    if (election.status === 'ACTIVE') {
      const staff = await this.prisma.staffVoter.findUnique({
        where: { id: staffId },
      });
      if (staff?.has_voted) {
        throw new BadRequestException({ errorCode: 'ALREADY_VOTED' });
      }
    }
  }
}
