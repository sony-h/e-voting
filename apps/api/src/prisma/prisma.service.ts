import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    this.$connect()
      .then(() => this.logger.log('Database connected'))
      .catch(() =>
        this.logger.warn('Database not reachable at startup (lazy connect)'),
      );
  }
}
