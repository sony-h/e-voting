import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StudentSessionGuard } from '../../guards/student-session.guard';
import { VotingService, type VotingSession } from './voting.service';
import { SubmitVoteDto } from './dto/submit-vote.dto';

const STUDENT_COOKIE = 'evoting_student_session';

type VotingRequest = Request & { session: VotingSession };

@Controller('voting')
@UseGuards(StudentSessionGuard)
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Get('candidates')
  getCandidates(@Req() req: VotingRequest) {
    return this.votingService.getCandidates(req.session);
  }

  @Get('status')
  getStatus(@Req() req: VotingRequest) {
    return this.votingService.getStatus(req.session);
  }

  @Post('submit')
  async submit(
    @Body() dto: SubmitVoteDto,
    @Req() req: VotingRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.votingService.submit(
      req.session,
      dto.candidateId,
    );
    await this.votingService.destroySession(req.cookies?.[STUDENT_COOKIE]);
    res.clearCookie(STUDENT_COOKIE);
    return result;
  }
}
