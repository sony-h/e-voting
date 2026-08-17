import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { StudentSessionGuard } from '../../guards/student-session.guard';
import { Roles } from '../../decorators/roles.decorator';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { StudentLoginDto } from './dto/student-login.dto';

const ADMIN_COOKIE = 'evoting_admin_token';
const STUDENT_COOKIE = 'evoting_student_session';

interface AdminPayload {
  sub: string;
  username: string;
  role: string;
}

interface StudentSessionPayload {
  studentId: string;
  electionId: string;
  nis: string;
}

type AdminRequest = Request & { user: AdminPayload };
type StudentRequest = Request & { session: StudentSessionPayload };

@Controller('auth/admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const admin = await this.authService.validateAdmin(dto);
    const token = await this.authService.signAdminToken(admin);
    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });
    return {
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name,
    };
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
  async profile(@Req() req: AdminRequest) {
    return this.authService.getAdminProfile(req.user.sub);
  }
}

@Controller('auth/student')
export class StudentAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: StudentLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { sessionId, expiresAt, student } =
      await this.authService.loginStudent(dto);
    res.cookie(STUDENT_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 60 * 1000,
    });
    return { expiresAt, student };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutStudent(req.cookies?.[STUDENT_COOKIE]);
    res.clearCookie(STUDENT_COOKIE);
    return { message: 'Logged out' };
  }

  @Get('session')
  @UseGuards(StudentSessionGuard)
  async session(@Req() req: StudentRequest) {
    return req.session;
  }
}
