import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StudentService } from './student.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StudentService', () => {
  let service: StudentService;
  const prismaMock = {
    student: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    votingToken: { updateMany: jest.fn(), upsert: jest.fn() },
    election: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(StudentService);
    jest.clearAllMocks();
  });

  it('creates a student with a generated token', async () => {
    prismaMock.student.create.mockResolvedValue({ id: 's1' });
    await service.create({
      nis: '231001',
      full_name: 'A',
      class_name: 'XII-1',
      election_id: 'e1',
    });
    const data = prismaMock.student.create.mock.calls[0][0].data;
    expect(data.token.create.token).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it('rejects delete when election is active', async () => {
    prismaMock.student.findUnique.mockResolvedValue({
      id: 's1',
      election_id: 'e1',
    });
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
    });
    await expect(service.remove('s1')).rejects.toThrow(BadRequestException);
  });

  it('allows reset token before election starts', async () => {
    prismaMock.student.findUnique.mockResolvedValue({
      id: 's1',
      election_id: 'e1',
    });
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'DRAFT',
    });
    prismaMock.votingToken.upsert.mockResolvedValue({ id: 't1' });
    await service.resetToken('s1');
    const { token } = prismaMock.votingToken.upsert.mock.calls[0][0].update;
    expect(token).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});
