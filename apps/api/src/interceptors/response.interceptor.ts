import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  { success: true; message: string; data: T }
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ success: true; message: string; data: T }> {
    const res = context.switchToHttp().getResponse<Response>();
    if (res.headersSent) {
      return next.handle() as Observable<{
        success: true;
        message: string;
        data: T;
      }>;
    }
    return next
      .handle()
      .pipe(map((data) => ({ success: true, message: 'Success', data })));
  }
}
