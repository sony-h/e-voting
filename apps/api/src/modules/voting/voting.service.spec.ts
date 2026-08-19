import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VotingService, type VotingSession } from './voting.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

describe('VotingService', () => {
  let service: VotingService;
  const prismaMock = {
    candidate: { findUnique: jest.fn(), findMany: jest.fn() },
    election: { findUnique: jest.fn(), findMany: jest.fn() },
    student: { findUnique: jest.fn(), update: jest.fn() },
    votingToken: { updateMany: jest.fn() },
    vote: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const redisMock = { del: jest.fn(), get: jest.fn(), setex: jest.fn() };
  const configMock = { get: jest.fn().mockReturnValue('600') };

  const session: VotingSession = {
    studentId: 's1',
    nis: '231001',
    elections: [{ electionId: 'e1', studentId: 's1', has_voted: false }],
  };

  beforeEach(async () => {
    prismaMock.$transaction.mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn(prismaMock),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        VotingService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();
    service = moduleRef.get(VotingService);
    jest.clearAllMocks();
  });

  it('submits a vote anonymously inside a transaction', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
    });
    prismaMock.candidate.findUnique.mockResolvedValue({
      id: 'c1',
      election_id: 'e1',
    });
    prismaMock.student.findUnique.mockResolvedValue({
      id: 's1',
      has_voted: false,
    });

    const result = await service.submit(session, 'c1');

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.vote.create).toHaveBeenCalledWith({
      data: { election_id: 'e1', candidate_id: 'c1' },
    });
    expect(prismaMock.student.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { has_voted: true, voted_at: expect.any(Date) },
    });
    expect(prismaMock.votingToken.updateMany).toHaveBeenCalledWith({
      where: { student_id: 's1' },
      data: { is_used: true },
    });
    expect(result).toEqual({ message: 'Your vote has been recorded.' });
  });

  it('rejects submit when election is not active', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'DRAFT',
    });
    await expect(service.submit(session, 'c1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects submit when candidate is from another election', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
    });
    prismaMock.candidate.findUnique.mockResolvedValue({
      id: 'c1',
      election_id: 'OTHER',
    });
    await expect(service.submit(session, 'c1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects submit when student already voted', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
    });
    prismaMock.candidate.findUnique.mockResolvedValue({
      id: 'c1',
      election_id: 'e1',
    });
    prismaMock.student.findUnique.mockResolvedValue({
      id: 's1',
      has_voted: true,
    });
    await expect(service.submit(session, 'c1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects getCandidates when election is not active', async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'CLOSED',
    });
    await expect(service.getCandidates(session)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws not found when election missing', async () => {
    prismaMock.election.findUnique.mockResolvedValue(null);
    await expect(service.getStatus(session)).rejects.toThrow(NotFoundException);
  });

  it('resolves current election and returns next after submit', async () => {
    const multiSession: VotingSession = {
      studentId: 's1',
      nis: '231001',
      elections: [
        { electionId: 'e1', studentId: 's1', has_voted: false },
        { electionId: 'e2', studentId: 's1', has_voted: false },
      ],
    };
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
    });
    prismaMock.candidate.findUnique.mockResolvedValue({
      id: 'c1',
      election_id: 'e1',
    });
    prismaMock.student.findUnique.mockResolvedValue({
      id: 's1',
      has_voted: false,
    });

    const result = await service.submit(multiSession, 'c1', 'sess1');

    expect(result.message).toBe('Your vote has been recorded.');
    expect(result.next).toEqual({ electionId: 'e2' });
    expect(redisMock.setex).toHaveBeenCalledWith(
      'student:session:sess1',
      600,
      expect.stringContaining('"has_voted":true'),
    );
  });

  it('throws ALREADY_VOTED when all elections voted', async () => {
    const allVotedSession: VotingSession = {
      studentId: 's1',
      nis: '231001',
      elections: [
        { electionId: 'e1', studentId: 's1', has_voted: true },
        { electionId: 'e2', studentId: 's1', has_voted: true },
      ],
    };
    await expect(service.getCandidates(allVotedSession)).rejects.toThrow(
      BadRequestException,
    );
  });
});
