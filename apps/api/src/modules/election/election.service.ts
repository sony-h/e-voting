import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

@Injectable()
export class ElectionService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.election.findMany({ orderBy: { order: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.election.findUnique({
      where: { id },
      include: { candidates: true },
    });
  }

  create(dto: CreateElectionDto) {
    return this.prisma.election.create({ data: dto });
  }

  async update(id: string, dto: UpdateElectionDto) {
    await this.ensureExists(id);
    const data: UpdateElectionDto = { ...dto };
    delete data.status;
    return this.prisma.election.update({ where: { id }, data });
  }

  async start(id: string) {
    const election = await this.ensureExists(id);
    if (election.status === 'CLOSED') {
      throw new BadRequestException({ errorCode: 'ELECTION_CLOSED' });
    }
    if (election.status === 'ACTIVE') {
      throw new BadRequestException({ errorCode: 'ELECTION_NOT_FOUND' });
    }
    const started = await this.prisma.election.update({
      where: { id },
      data: { status: 'ACTIVE', start_at: election.start_at ?? new Date() },
    });

    const expiryHours = Number(process.env.TOKEN_EXPIRY_HOURS ?? '24');
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    await this.prisma.votingToken.updateMany({
      where: { election_id: id },
      data: { expires_at: expiresAt },
    });

    return started;
  }

  async close(id: string) {
    const election = await this.ensureExists(id);
    if (election.status !== 'ACTIVE') {
      throw new BadRequestException({ errorCode: 'ELECTION_NOT_FOUND' });
    }
    return this.prisma.election.update({
      where: { id },
      data: { status: 'CLOSED', end_at: new Date() },
    });
  }

  async remove(id: string) {
    const election = await this.ensureExists(id);
    if (election.status === 'ACTIVE') {
      throw new BadRequestException({ errorCode: 'VOTING_NOT_ALLOWED' });
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.vote.deleteMany({ where: { election_id: id } });
      await tx.votingToken.deleteMany({ where: { election_id: id } });
      await tx.candidateImage.deleteMany({
        where: { candidate: { election_id: id } },
      });
      await tx.candidate.deleteMany({ where: { election_id: id } });
      await tx.staffVoter.deleteMany({ where: { election_id: id } });
      await tx.student.deleteMany({ where: { election_id: id } });
      return tx.election.delete({ where: { id } });
    });
  }

  private async ensureExists(id: string) {
    const election = await this.prisma.election.findUnique({ where: { id } });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    return election;
  }
}
