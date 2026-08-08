import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class StudentSessionGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.['evoting_student_session'];
    if (!sessionId)
      throw new UnauthorizedException({ errorCode: 'SESSION_EXPIRED' });
    const raw = await this.redis.get(`student:session:${sessionId}`);
    if (!raw) throw new UnauthorizedException({ errorCode: 'SESSION_EXPIRED' });
    request.session = JSON.parse(raw);
    return true;
  }
}
