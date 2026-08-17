import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportService } from './report.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReportService', () => {
  let service: ReportService;
  const prismaMock = {
    election: { findUnique: jest.fn() },
    candidate: { findMany: jest.fn() },
    vote: { groupBy: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(ReportService);
    jest.clearAllMocks();
  });

  it('rejects results when election is not closed', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
    });
    await expect(service.getResults('e1')).rejects.toThrow(BadRequestException);
  });

  it('throws when election missing', async () => {
    prismaMock.election.findUnique.mockResolvedValue(null);
    await expect(service.getResults('nope')).rejects.toThrow(NotFoundException);
  });

  it('rejects results when not published to public', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'CLOSED',
      results_public: false,
    });
    await expect(service.getResults('e1')).rejects.toThrow(BadRequestException);
  });

  it('returns ranking sorted by votes desc', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'CLOSED',
      results_public: true,
      title: 'Pemilihan',
      academic_year: '2026/2027',
    });
    prismaMock.candidate.findMany.mockResolvedValue([
      {
        id: 'c1',
        candidate_number: 1,
        chairman_name: 'A',
        vice_chairman_name: null,
      },
      {
        id: 'c2',
        candidate_number: 2,
        chairman_name: 'B',
        vice_chairman_name: null,
      },
    ]);
    prismaMock.vote.groupBy.mockResolvedValue([
      { candidate_id: 'c1', _count: { id: 2 } },
      { candidate_id: 'c2', _count: { id: 2 } },
    ]);

    const result = await service.getResults('e1');

    expect(result.total_votes).toBe(4);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0]!.percentage).toBe(50);
    expect(result.election.title).toBe('Pemilihan');
  });

  it('returns zero votes and zero percentage when no votes', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'CLOSED',
      results_public: true,
      title: 'P',
      academic_year: '2026/2027',
    });
    prismaMock.candidate.findMany.mockResolvedValue([
      {
        id: 'c1',
        candidate_number: 1,
        chairman_name: 'A',
        vice_chairman_name: null,
      },
    ]);
    prismaMock.vote.groupBy.mockResolvedValue([]);

    const result = await service.getResults('e1');

    expect(result.total_votes).toBe(0);
    expect(result.candidates[0]!.votes).toBe(0);
    expect(result.candidates[0]!.percentage).toBe(0);
  });
});
