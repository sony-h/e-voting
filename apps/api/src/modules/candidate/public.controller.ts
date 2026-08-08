import { Controller, Get, Query } from '@nestjs/common';
import { CandidateService } from '../candidate/candidate.service';

@Controller('public')
export class PublicController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get('candidates')
  findCandidates(@Query('electionId') electionId: string) {
    return this.candidateService.findPublic(electionId);
  }
}
