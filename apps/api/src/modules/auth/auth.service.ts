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
      include: { student: { include: { election: true } } },
    });
    if (!tokenRecord || !tokenRecord.student) {
      throw new UnauthorizedException({ errorCode: 'INVALID_TOKEN' });
    }
    const student = tokenRecord.student;
    if (student.nis !== dto.identifier && student.nisn !== dto.identifier) {
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
    if (student.election.status !== 'ACTIVE') {
      throw new UnauthorizedException({ errorCode: 'ELECTION_NOT_ACTIVE' });
    }
    if (student.has_voted)
      throw new UnauthorizedException({ errorCode: 'ALREADY_VOTED' });

    const sessionId = randomUUID();
    const ttl = Number(this.config.get<string>('STUDENT_SESSION_TTL') ?? '300');
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const session = {
      studentId: student.id,
      electionId: student.election_id,
      nis: student.nis,
      expiresAt: expiresAt.toISOString(),
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
