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
      include: { images: { orderBy: { sort_order: 'asc' } } },
      orderBy: { candidate_number: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.candidate.findUnique({
      where: { id },
      include: { images: { orderBy: { sort_order: 'asc' } } },
    });
  }

  findPublic(electionId: string) {
    return this.prisma.candidate.findMany({
      where: { election_id: electionId, show_on_landing: true },
      include: { images: { orderBy: { sort_order: 'asc' } } },
      orderBy: { candidate_number: 'asc' },
    });
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

  async addImages(id: string, files: Express.Multer.File[]) {
    const candidate = await this.ensureExists(id);
    await this.ensureEditable(candidate.election_id);
    const existing = await this.prisma.candidateImage.count({
      where: { candidate_id: id },
    });
    return this.prisma.$transaction(
      files.map((file, index) =>
        this.prisma.candidateImage.create({
          data: {
            candidate_id: id,
            url: `/uploads/candidate-image/${file.filename}`,
            sort_order: existing + index,
          },
        }),
      ),
    );
  }

  async removeImage(imageId: string) {
    const image = await this.prisma.candidateImage.findUnique({
      where: { id: imageId },
      include: { candidate: true },
    });
    if (!image)
      throw new NotFoundException({ errorCode: 'CANDIDATE_IMAGE_NOT_FOUND' });
    await this.ensureEditable(image.candidate.election_id);
    return this.prisma.candidateImage.delete({ where: { id: imageId } });
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
