import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';
import { buildExcelBuffer } from '../../common/excel.util';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getResults(electionId: string) {
    await this.assertResultsVisible(electionId);
    return this.loadResults(electionId);
  }

  async getPublicResults(electionId: string) {
    await this.assertResultsVisible(electionId);
    return this.loadResults(electionId);
  }

  async setResultsPublic(electionId: string, visible: boolean) {
    await this.ensureClosed(electionId);
    return this.prisma.election.update({
      where: { id: electionId },
      data: { results_public: visible },
    });
  }

  private async assertResultsVisible(electionId: string) {
    const election = await this.ensureClosed(electionId);
    if (!election.results_public) {
      throw new BadRequestException({ errorCode: 'RESULTS_NOT_PUBLISHED' });
    }
    return election;
  }

  private async loadResults(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    const candidates = await this.prisma.candidate.findMany({
      where: { election_id: electionId },
      orderBy: { candidate_number: 'asc' },
    });
    const counts = await this.prisma.vote.groupBy({
      by: ['candidate_id'],
      where: { election_id: electionId },
      _count: { id: true },
    });
    const countMap = new Map(counts.map((c) => [c.candidate_id, c._count.id]));
    const totalVotes = candidates.reduce(
      (sum, c) => sum + (countMap.get(c.id) ?? 0),
      0,
    );
    return {
      election: {
        title: election.title,
        academic_year: election.academic_year,
        status: election.status,
        results_public: election.results_public,
      },
      total_votes: totalVotes,
      candidates: candidates
        .map((c) => ({
          candidateNumber: c.candidate_number,
          chairman_name: c.chairman_name,
          vice_chairman_name: c.vice_chairman_name,
          votes: countMap.get(c.id) ?? 0,
          percentage:
            totalVotes === 0
              ? 0
              : Math.round(((countMap.get(c.id) ?? 0) / totalVotes) * 100),
        }))
        .sort((a, b) => b.votes - a.votes),
    };
  }

  async exportExcel(electionId: string) {
    const results = await this.getResults(electionId);
    const rows: Record<string, string | number>[] = results.candidates.map(
      (c, i) => ({
        Peringkat: i + 1,
        'No Urut': c.candidateNumber,
        Kandidat: c.chairman_name,
        Wakil: c.vice_chairman_name ?? '',
        Suara: c.votes,
        Persentase: `${c.percentage}%`,
      }),
    );
    rows.push({
      Peringkat: '',
      'No Urut': '',
      Kandidat: 'Total Suara',
      Wakil: '',
      Suara: results.total_votes,
      Persentase: '100%',
    });
    const buffer = buildExcelBuffer(rows, 'Hasil');
    return { buffer, filename: `hasil-${Date.now()}.xlsx` };
  }

  async exportPdf(electionId: string) {
    const results = await this.getResults(electionId);

    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise<void>((resolve) =>
      doc.on('end', () => resolve()),
    );

    doc.fontSize(16).text(results.election.title, { align: 'center' });
    doc
      .fontSize(11)
      .text(
        `Rekap Hasil Pemilihan Ketua OSIS — Tahun Ajaran ${results.election.academic_year}`,
        { align: 'center' },
      );
    doc.moveDown(2);

    results.candidates.forEach((c, i) => {
      doc
        .fontSize(12)
        .text(
          `${i + 1}. ${c.chairman_name} (No Urut ${c.candidateNumber}) — ${c.votes} suara (${c.percentage}%)`,
        );
      if (c.vice_chairman_name) {
        doc.fontSize(10).text(`   Wakil: ${c.vice_chairman_name}`);
      }
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(12).text(`Total Suara: ${results.total_votes}`);
    doc.end();

    await finished;
    const buffer = Buffer.concat(chunks);
    return { buffer, filename: `hasil-${Date.now()}.pdf` };
  }

  private async ensureClosed(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    if (election.status !== 'CLOSED') {
      throw new BadRequestException({ errorCode: 'ELECTION_NOT_CLOSED' });
    }
    return election;
  }
}
