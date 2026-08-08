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
}
