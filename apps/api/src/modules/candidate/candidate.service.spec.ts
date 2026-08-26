import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { CandidateService } from './candidate.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('sharp');

const sharpMock = sharp as jest.MockedFunction<typeof sharp>;

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
    candidateImage: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    vote: { deleteMany: jest.fn() },
    election: { findUnique: jest.fn() },
    $transaction: jest.fn(),
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

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('deletes candidate with images and votes in a transaction', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue({
      id: 'c1',
      election_id: 'e1',
    });
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'DRAFT',
    });
    prismaMock.$transaction.mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn(prismaMock),
    );
    prismaMock.candidateImage.deleteMany.mockResolvedValue({ count: 5 });
    prismaMock.vote.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.candidate.delete.mockResolvedValue({ id: 'c1' });

    await service.remove('c1');

    expect(prismaMock.candidateImage.deleteMany).toHaveBeenCalledWith({
      where: { candidate_id: 'c1' },
    });
    expect(prismaMock.vote.deleteMany).toHaveBeenCalledWith({
      where: { candidate_id: 'c1' },
    });
    expect(prismaMock.candidate.delete).toHaveBeenCalledWith({
      where: { id: 'c1' },
    });
  });

  it('adds gallery images with sequential sort order', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue({
      id: 'c1',
      election_id: 'e1',
    });
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'DRAFT',
    });
    prismaMock.candidateImage.count.mockResolvedValue(2);
    prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
    prismaMock.candidateImage.create.mockResolvedValue({ id: 'img1' });

    sharpMock.mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ width: 1280, height: 720 }),
    } as unknown as ReturnType<typeof sharp>);

    await service.addImages('c1', [
      { filename: 'a.png' } as Express.Multer.File,
      { filename: 'b.png' } as Express.Multer.File,
    ]);

    expect(prismaMock.candidateImage.create).toHaveBeenCalledWith({
      data: {
        candidate_id: 'c1',
        url: '/uploads/candidate-image/a.png',
        sort_order: 2,
        type: 'PROGRAM',
      },
    });
    expect(prismaMock.candidateImage.create).toHaveBeenCalledWith({
      data: {
        candidate_id: 'c1',
        url: '/uploads/candidate-image/b.png',
        sort_order: 3,
        type: 'PROGRAM',
      },
    });
  });

  it('rejects gallery images narrower than 800px', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue({
      id: 'c1',
      election_id: 'e1',
    });
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'DRAFT',
    });

    sharpMock.mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ width: 400, height: 300 }),
    } as unknown as ReturnType<typeof sharp>);

    await expect(
      service.addImages('c1', [
        { filename: 'small.png' } as Express.Multer.File,
      ]),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.candidateImage.create).not.toHaveBeenCalled();
  });

  it('removes a gallery image', async () => {
    prismaMock.candidateImage.findUnique.mockResolvedValue({
      id: 'img1',
      candidate: { election_id: 'e1' },
    });
    prismaMock.election.findUnique.mockResolvedValue({
      id: 'e1',
      status: 'DRAFT',
    });
    prismaMock.candidateImage.delete.mockResolvedValue({ id: 'img1' });

    await service.removeImage('img1');

    expect(prismaMock.candidateImage.delete).toHaveBeenCalledWith({
      where: { id: 'img1' },
    });
  });

  it('filters public candidates by show_on_landing', async () => {
    prismaMock.candidate.findMany.mockResolvedValue([{ id: 'c1' }]);
    await service.findPublic('e1');
    expect(prismaMock.candidate.findMany).toHaveBeenCalledWith({
      where: { election_id: 'e1', show_on_landing: true },
      include: { images: { orderBy: { sort_order: 'asc' } } },
      orderBy: { candidate_number: 'asc' },
    });
  });
});
