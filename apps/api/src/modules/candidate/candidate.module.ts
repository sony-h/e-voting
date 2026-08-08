import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { PublicController } from './public.controller';
import { CandidateService } from './candidate.service';

@Module({
  controllers: [CandidateController, PublicController],
  providers: [CandidateService],
})
export class CandidateModule {}
