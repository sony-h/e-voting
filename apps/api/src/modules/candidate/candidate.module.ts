import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateImageController } from './candidate-image.controller';
import { PublicController } from './public.controller';
import { CandidateService } from './candidate.service';
import { ReportModule } from '../report/report.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [ReportModule, StaffModule],
  controllers: [
    CandidateController,
    CandidateImageController,
    PublicController,
  ],
  providers: [CandidateService],
})
export class CandidateModule {}
