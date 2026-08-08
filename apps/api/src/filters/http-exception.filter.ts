import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
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

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      errorCode: 'INTERNAL_SERVER_ERROR',
    });
  }
}
