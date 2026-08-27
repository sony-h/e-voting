import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface VotingSessionElection {
  electionId: string;
  voterId: string;
  voterType?: 'STUDENT' | 'STAFF';
  studentId?: string; // backwards compatibility if needed
  has_voted: boolean;
}
export interface VotingSession {
  voterId?: string;
  studentId?: string;
  voterType?: 'STUDENT' | 'STAFF';
  nis?: string;
  identifier?: string;
  elections: VotingSessionElection[];
}

@Injectable()
export class VotingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private async resolveCurrent(session: VotingSession) {
    const current = session.elections.find((e) => !e.has_voted);
    if (!current) throw new BadRequestException({ errorCode: 'ALREADY_VOTED' });
    return current;
  }

  async getCandidates(session: VotingSession) {
    const current = await this.resolveCurrent(session);
    await this.ensureElectionActive(current.electionId);
    return this.prisma.candidate.findMany({
      where: { election_id: current.electionId },
      include: { images: { orderBy: { sort_order: 'asc' } } },
      orderBy: { candidate_number: 'asc' },
    });
  }

  async getStatus(session: VotingSession) {
    const current = await this.resolveCurrent(session);
    const election = await this.ensureElectionExists(current.electionId);
    const titles = await this.prisma.election.findMany({
      where: { id: { in: session.elections.map((e) => e.electionId) } },
    });
    return {
      has_voted: false,
      electionId: current.electionId,
      election_status: election.status,
      elections: session.elections.map((e) => ({
        ...e,
        title: titles.find((t) => t.id === e.electionId)?.title ?? e.electionId,
      })),
    };
  }

  async submit(
    session: VotingSession,
    candidateId: string,
    sessionId?: string,
  ) {
    const current = await this.resolveCurrent(session);
    await this.ensureElectionActive(current.electionId);

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate || candidate.election_id !== current.electionId) {
      throw new BadRequestException({ errorCode: 'INVALID_CANDIDATE' });
    }

    const voterId = current.voterId ?? current.studentId!;
    const isStaff = current.voterType === 'STAFF';

    if (isStaff) {
      const staff = await this.prisma.staffVoter.findUnique({
        where: { id: voterId },
      });
      if (!staff) throw new NotFoundException({ errorCode: 'STAFF_NOT_FOUND' });
      if (staff.has_voted) {
        throw new BadRequestException({ errorCode: 'ALREADY_VOTED' });
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.vote.create({
          data: { election_id: current.electionId, candidate_id: candidateId },
        });
        await tx.staffVoter.update({
          where: { id: voterId },
          data: { has_voted: true, voted_at: new Date() },
        });
        await tx.votingToken.updateMany({
          where: { staff_id: voterId },
          data: { is_used: true },
        });
      });
    } else {
      const student = await this.prisma.student.findUnique({
        where: { id: voterId },
      });
      if (!student)
        throw new NotFoundException({ errorCode: 'STUDENT_NOT_FOUND' });
      if (student.has_voted) {
        throw new BadRequestException({ errorCode: 'ALREADY_VOTED' });
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.vote.create({
          data: { election_id: current.electionId, candidate_id: candidateId },
        });
        await tx.student.update({
          where: { id: voterId },
          data: { has_voted: true, voted_at: new Date() },
        });
        await tx.votingToken.updateMany({
          where: { student_id: voterId },
          data: { is_used: true },
        });
      });
    }

    const updatedElections = session.elections.map((e) =>
      e.electionId === current.electionId ? { ...e, has_voted: true } : e,
    );
    const next = updatedElections.find((e) => !e.has_voted);
    if (sessionId) {
      const ttl = Number(
        this.config.get<string>('STUDENT_SESSION_TTL') ?? '600',
      );
      await this.redis.setex(
        `student:session:${sessionId}`,
        ttl,
        JSON.stringify({ ...session, elections: updatedElections }),
      );
    }

    return {
      message: 'Your vote has been recorded.',
      next: next ? { electionId: next.electionId } : null,
    };
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
