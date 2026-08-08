import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ElectionModule } from './modules/election/election.module';
import { StudentModule } from './modules/student/student.module';
import { CandidateModule } from './modules/candidate/candidate.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ElectionModule,
    StudentModule,
    CandidateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
