import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateImageController } from './candidate-image.controller';
import { PublicController } from './public.controller';
import { CandidateService } from './candidate.service';

@Module({
  controllers: [
    CandidateController,
    CandidateImageController,
    PublicController,
  ],
  providers: [CandidateService],
})
export class CandidateModule {}
