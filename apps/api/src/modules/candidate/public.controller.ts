import { Controller, Get, Param, Query } from '@nestjs/common';
import { CandidateService } from '../candidate/candidate.service';
import { ReportService } from '../report/report.service';
import { StaffService } from '../staff/staff.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly reportService: ReportService,
    private readonly staffService: StaffService,
  ) {}

  @Get('candidates')
  findCandidates(@Query('electionId') electionId: string) {
    return this.candidateService.findPublic(electionId);
  }

  @Get('candidates/:id')
  findCandidate(@Param('id') id: string) {
    return this.candidateService.findPublicOne(id);
  }

  @Get('results')
  getResults(@Query('electionId') electionId: string) {
    return this.reportService.getPublicResults(electionId);
  }

  @Get('staff')
  findStaff(@Query('electionId') electionId?: string) {
    return this.staffService.findPublic(electionId);
  }
}
