import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CandidateService', () => {
  let service: CandidateService;
  const prismaMock = {
    candidate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    election: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CandidateService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(CandidateService);
    jest.clearAllMocks();
  });

  it('creates a candidate with the given dto', async () => {
    const dto = {
      election_id: 'e1',
      candidate_number: 1,
      chairman_name: 'A',
      vision: 'v',
      mission: 'm',
    };
    prismaMock.candidate.create.mockResolvedValue({ id: 'c1' });
    await service.create(dto);
    expect(prismaMock.candidate.create).toHaveBeenCalledWith({ data: dto });
  });

  it('rejects delete when election is active', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue({
      id: 'c1',
      election_id: 'e1',
    });
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
    });
    await expect(service.remove('c1')).rejects.toThrow(BadRequestException);
  });
});
