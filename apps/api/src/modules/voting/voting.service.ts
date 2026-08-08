import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface VotingSession {
  studentId: string;
  electionId: string;
  nis: string;
}

@Injectable()
export class VotingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getCandidates(session: VotingSession) {
    await this.ensureElectionActive(session.electionId);
    return this.prisma.candidate.findMany({
      where: { election_id: session.electionId },
      include: { images: { orderBy: { sort_order: 'asc' } } },
      orderBy: { candidate_number: 'asc' },
    });
  }

  async getStatus(session: VotingSession) {
    await this.ensureElectionExists(session.electionId);
    const election = await this.prisma.election.findUnique({
      where: { id: session.electionId },
    });
    return {
      has_voted: false,
      electionId: session.electionId,
      election_status: election?.status,
    };
  }

  async submit(session: VotingSession, candidateId: string) {
    await this.ensureElectionActive(session.electionId);

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate || candidate.election_id !== session.electionId) {
      throw new BadRequestException({ errorCode: 'INVALID_CANDIDATE' });
    }

    const student = await this.prisma.student.findUnique({
      where: { id: session.studentId },
    });
    if (!student)
      throw new NotFoundException({ errorCode: 'STUDENT_NOT_FOUND' });
    if (student.has_voted) {
      throw new BadRequestException({ errorCode: 'ALREADY_VOTED' });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.vote.create({
        data: { election_id: session.electionId, candidate_id: candidateId },
      });
      await tx.student.update({
        where: { id: session.studentId },
        data: { has_voted: true, voted_at: new Date() },
      });
      await tx.votingToken.updateMany({
        where: { student_id: session.studentId },
        data: { is_used: true },
      });
    });

    return { message: 'Your vote has been recorded.' };
  }

  async destroySession(sessionId: string | undefined) {
    if (sessionId) await this.redis.del(`student:session:${sessionId}`);
  }

  private async ensureElectionExists(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    return election;
  }

  private async ensureElectionActive(electionId: string) {
    const election = await this.ensureElectionExists(electionId);
    if (election.status !== 'ACTIVE') {
      throw new BadRequestException({ errorCode: 'ELECTION_NOT_ACTIVE' });
    }
  }
}
