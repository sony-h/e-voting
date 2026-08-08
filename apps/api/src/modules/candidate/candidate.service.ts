import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidateService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(electionId?: string) {
    return this.prisma.candidate.findMany({
      where: { election_id: electionId },
      orderBy: { candidate_number: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.candidate.findUnique({ where: { id } });
  }

  create(dto: CreateCandidateDto) {
    return this.prisma.candidate.create({ data: dto });
  }

  async update(id: string, dto: UpdateCandidateDto) {
    await this.ensureExists(id);
    return this.prisma.candidate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const candidate = await this.ensureExists(id);
    await this.ensureEditable(candidate.election_id);
    return this.prisma.candidate.delete({ where: { id } });
  }

  async updatePhoto(id: string, photoUrl: string) {
    const candidate = await this.ensureExists(id);
    await this.ensureEditable(candidate.election_id);
    return this.prisma.candidate.update({
      where: { id },
      data: { photo_url: photoUrl },
    });
  }

  private async ensureExists(id: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate)
      throw new NotFoundException({ errorCode: 'CANDIDATE_NOT_FOUND' });
    return candidate;
  }

  private async ensureEditable(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    if (election.status === 'ACTIVE' || election.status === 'CLOSED') {
      throw new BadRequestException({ errorCode: 'VOTING_NOT_ALLOWED' });
    }
  }
}
