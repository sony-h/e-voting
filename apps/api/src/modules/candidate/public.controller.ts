import { Controller, Get, Query } from '@nestjs/common';
import { CandidateService } from '../candidate/candidate.service';
import { ReportService } from '../report/report.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly reportService: ReportService,
  ) {}

  @Get('candidates')
  findCandidates(@Query('electionId') electionId: string) {
    return this.candidateService.findPublic(electionId);
  }

  @Get('results')
  getResults(@Query('electionId') electionId: string) {
    return this.reportService.getPublicResults(electionId);
  }
}
