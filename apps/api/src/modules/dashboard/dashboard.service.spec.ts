import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const prismaMock = {
    election: { findUnique: jest.fn() },
    student: { count: jest.fn(), findMany: jest.fn() },
    vote: { count: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(DashboardService);
    jest.clearAllMocks();
  });

  it('computes summary with participation rate', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
    });
    prismaMock.student.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1);
    prismaMock.vote.count.mockResolvedValue(1);

    const result = await service.summary('e1');

    expect(result).toEqual({
      total_students: 4,
      already_voted: 1,
      not_voted: 3,
      total_votes: 1,
      participation_rate: 25,
      status: 'ACTIVE',
    });
  });

  it('returns zero rate when no students', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'DRAFT',
    });
    prismaMock.student.count.mockResolvedValue(0);
    prismaMock.vote.count.mockResolvedValue(0);

    const result = await service.summary('e1');

    expect(result.participation_rate).toBe(0);
    expect(result.not_voted).toBe(0);
  });

  it('groups participation by class', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
    });
    prismaMock.student.findMany.mockResolvedValue([
      { class_name: 'XII-1', has_voted: true },
      { class_name: 'XII-1', has_voted: false },
      { class_name: 'XII-2', has_voted: true },
      { class_name: 'XII-2', has_voted: true },
    ]);

    const result = await service.byClass('e1');

    expect(result).toEqual([
      { class_name: 'XII-1', total: 2, voted: 1, participation_rate: 50 },
      { class_name: 'XII-2', total: 2, voted: 2, participation_rate: 100 },
    ]);
  });

  it('throws when election missing', async () => {
    prismaMock.election.findUnique.mockResolvedValue(null);
    await expect(service.summary('nope')).rejects.toThrow(NotFoundException);
  });
});
