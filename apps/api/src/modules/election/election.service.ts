import {
  BadRequestException,
  ConflictException,
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
    return this.prisma.election.findMany({ orderBy: { created_at: 'desc' } });
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
    try {
      return await this.prisma.election.update({
        where: { id },
        data: { status: 'ACTIVE', start_at: election.start_at ?? new Date() },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException({ errorCode: 'MULTIPLE_ACTIVE_ELECTION' });
      }
      throw error;
    }
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

  private async ensureExists(id: string) {
    const election = await this.prisma.election.findUnique({ where: { id } });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    return election;
  }
}
