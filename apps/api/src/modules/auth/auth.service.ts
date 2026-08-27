import { randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { StudentLoginDto } from './dto/student-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async validateAdmin(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });
    if (!admin)
      throw new UnauthorizedException({ errorCode: 'INVALID_CREDENTIALS' });
    const valid = await bcrypt.compare(dto.password, admin.password_hash);
    if (!valid)
      throw new UnauthorizedException({ errorCode: 'INVALID_CREDENTIALS' });
    return admin;
  }

  async signAdminToken(admin: { id: string; username: string }) {
    const payload = { sub: admin.id, username: admin.username, role: 'ADMIN' };
    return this.jwtService.signAsync(payload);
  }

  async getAdminProfile(id: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new UnauthorizedException({ errorCode: 'UNAUTHORIZED' });
    return {
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name,
    };
  }

  async loginStudent(dto: StudentLoginDto) {
    const tokenRecord = await this.prisma.votingToken.findUnique({
      where: { token: dto.token },
      include: {
        student: { include: { election: true } },
        staff: { include: { election: true } },
      },
    });
    if (!tokenRecord || (!tokenRecord.student && !tokenRecord.staff)) {
      throw new UnauthorizedException({ errorCode: 'INVALID_TOKEN' });
    }

    if (tokenRecord.is_used) {
      throw new UnauthorizedException({ errorCode: 'INVALID_TOKEN' });
    }
    if (
      tokenRecord.expires_at &&
      new Date(tokenRecord.expires_at) < new Date()
    ) {
      throw new UnauthorizedException({ errorCode: 'TOKEN_EXPIRED' });
    }

    const isStaff = !!tokenRecord.staff;

    if (isStaff) {
      const staff = tokenRecord.staff!;
      const matchNip = staff.nip && staff.nip === dto.identifier;
      const matchUsername =
        staff.username &&
        staff.username.toLowerCase() === dto.identifier.toLowerCase();
      const matchId = staff.id === dto.identifier;

      if (!matchNip && !matchUsername && !matchId) {
        throw new UnauthorizedException({ errorCode: 'INVALID_TOKEN' });
      }

      if (staff.election.status !== 'ACTIVE') {
        throw new UnauthorizedException({ errorCode: 'ELECTION_NOT_ACTIVE' });
      }

      const staffConditions: Array<{ nip?: string; username?: string }> = [];
      if (staff.nip) staffConditions.push({ nip: staff.nip });
      if (staff.username) staffConditions.push({ username: staff.username });

      const allStaffRows = await this.prisma.staffVoter.findMany({
        where:
          staffConditions.length > 0
            ? { OR: staffConditions }
            : { id: staff.id },
        include: { election: true },
      });

      const otherPending = allStaffRows.filter((s) => !s.has_voted);
      if (staff.has_voted && otherPending.length === 0) {
        throw new UnauthorizedException({ errorCode: 'ALREADY_VOTED' });
      }

      const activeElections = allStaffRows
        .filter((s) => s.election.status === 'ACTIVE')
        .map((s) => ({
          electionId: s.election_id,
          voterId: s.id,
          voterType: 'STAFF' as const,
          has_voted: s.has_voted,
        }));

      if (activeElections.length === 0) {
        throw new UnauthorizedException({ errorCode: 'ELECTION_NOT_ACTIVE' });
      }

      const sessionId = randomUUID();
      const ttl = Number(
        this.config.get<string>('STUDENT_SESSION_TTL') ?? '600',
      );
      const expiresAt = new Date(Date.now() + ttl * 1000);
      const session = {
        voterId: staff.id,
        voterType: 'STAFF' as const,
        identifier: staff.nip ?? staff.username ?? staff.id,
        elections: activeElections,
      };
      await this.redis.setex(
        `student:session:${sessionId}`,
        ttl,
        JSON.stringify(session),
      );
      return {
        sessionId,
        expiresAt: expiresAt.toISOString(),
        student: {
          full_name: staff.full_name,
          class_name: staff.role === 'TEACHER' ? 'Guru' : 'Tenaga Kependidikan',
        },
      };
    }

    // Student login path
    const student = tokenRecord.student!;
    if (student.nis !== dto.identifier && student.nisn !== dto.identifier) {
      throw new UnauthorizedException({ errorCode: 'INVALID_TOKEN' });
    }
    if (student.election.status !== 'ACTIVE') {
      throw new UnauthorizedException({ errorCode: 'ELECTION_NOT_ACTIVE' });
    }
    const otherPending = await this.prisma.student.findMany({
      where: { nis: student.nis, has_voted: false },
      include: { election: true },
    });
    if (student.has_voted && otherPending.length === 0) {
      throw new UnauthorizedException({ errorCode: 'ALREADY_VOTED' });
    }

    // Find all Student rows for this student across elections
    const allStudents = await this.prisma.student.findMany({
      where: { nis: student.nis },
      include: { election: true },
    });

    const elections = allStudents
      .filter((s) => s.election.status === 'ACTIVE')
      .map((s) => ({
        electionId: s.election_id,
        voterId: s.id,
        voterType: 'STUDENT' as const,
        has_voted: s.has_voted,
      }));

    if (elections.length === 0) {
      throw new UnauthorizedException({ errorCode: 'ELECTION_NOT_ACTIVE' });
    }

    const sessionId = randomUUID();
    const ttl = Number(this.config.get<string>('STUDENT_SESSION_TTL') ?? '600');
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const session = {
      voterId: student.id,
      voterType: 'STUDENT' as const,
      identifier: student.nis,
      elections,
    };
    await this.redis.setex(
      `student:session:${sessionId}`,
      ttl,
      JSON.stringify(session),
    );
    return {
      sessionId,
      expiresAt: expiresAt.toISOString(),
      student: { full_name: student.full_name, class_name: student.class_name },
    };
  }

  async logoutStudent(sessionId: string | undefined) {
    if (sessionId) await this.redis.del(`student:session:${sessionId}`);
  }
}
