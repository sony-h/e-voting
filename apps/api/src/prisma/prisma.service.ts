import type { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    let attempt = 0;
    while (true) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
        return;
      } catch (error) {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          this.logger.error(
            `Database connection failed after ${attempt} attempts`,
            error instanceof Error ? error.message : String(error),
          );
          throw error;
        }
        this.logger.warn(
          `Database connection attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
}
