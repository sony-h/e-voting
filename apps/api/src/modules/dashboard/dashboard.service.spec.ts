import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const prismaMock = {
    election: { findUnique: jest.fn() },
    student: { count: jest.fn(), findMany: jest.fn() },
    staffVoter: { count: jest.fn(), findMany: jest.fn() },
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
    prismaMock.staffVoter.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    prismaMock.vote.count.mockResolvedValue(2);

    const result = await service.summary('e1');

    expect(result.total_voters).toBe(6);
    expect(result.already_voted).toBe(2);
    expect(result.not_voted).toBe(4);
    expect(result.total_votes).toBe(2);
    expect(result.participation_rate).toBe(33);
    expect(result.students_total).toBe(4);
    expect(result.students_voted).toBe(1);
    expect(result.staff_total).toBe(2);
    expect(result.staff_voted).toBe(1);
    expect(result.status).toBe('ACTIVE');
  });

  it('returns zero rate when no students and no staff', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'DRAFT',
    });
    prismaMock.student.count.mockResolvedValue(0);
    prismaMock.staffVoter.count.mockResolvedValue(0);
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
