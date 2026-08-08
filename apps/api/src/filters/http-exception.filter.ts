import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

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
      const target = (exception.meta?.target ?? []) as string[];
      const fields = Array.isArray(target) ? target : [];
      const code = fields.includes('nis')
        ? 'DUPLICATE_NIS'
        : fields.includes('nisn')
          ? 'DUPLICATE_NISN'
          : fields.includes('candidate_number')
            ? 'DUPLICATE_CANDIDATE_NUMBER'
            : fields.includes('token')
              ? 'DUPLICATE_TOKEN'
              : 'DUPLICATE_RECORD';
      response.status(HttpStatus.CONFLICT).json({
        success: false,
        message: 'Duplicate record violates unique constraint',
        errorCode: code,
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error('Database unavailable', exception.message);
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Database is unavailable. Check that PostgreSQL is running.',
        errorCode: 'DATABASE_UNAVAILABLE',
      });
      return;
    }

    if (
      exception instanceof Error &&
      (exception.message.includes('ECONNREFUSED') ||
        exception.message.includes('ioredis') ||
        exception.message.includes('Redis'))
    ) {
      this.logger.error('Cache unavailable', exception.message);
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Cache is unavailable. Check that Redis is running.',
        errorCode: 'CACHE_UNAVAILABLE',
      });
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_SERVER_ERROR',
    });
  }
}
