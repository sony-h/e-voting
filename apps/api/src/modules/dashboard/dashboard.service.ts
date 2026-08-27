import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface StudentGroup {
  name: string;
  total: number;
  voted: number;
  participation_rate: number;
}

function toGroup(
  entries: Map<string, { total: number; voted: number }>,
): StudentGroup[] {
  return [...entries.entries()]
    .map(([name, e]) => ({
      name,
      total: e.total,
      voted: e.voted,
      participation_rate:
        e.total === 0 ? 0 : Math.round((e.voted / e.total) * 100),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(electionId: string) {
    const election = await this.ensureExists(electionId);
    const totalStudents = await this.prisma.student.count({
      where: { election_id: electionId },
    });
    const studentsVoted = await this.prisma.student.count({
      where: { election_id: electionId, has_voted: true },
    });

    const totalStaff = await this.prisma.staffVoter.count({
      where: { election_id: electionId },
    });
    const staffVoted = await this.prisma.staffVoter.count({
      where: { election_id: electionId, has_voted: true },
    });

    const totalVotes = await this.prisma.vote.count({
      where: { election_id: electionId },
    });

    const totalVoters = totalStudents + totalStaff;
    const totalVoted = studentsVoted + staffVoted;

    return {
      // Combined totals (backwards-compatible with frontend fields)
      total_students: totalStudents,
      already_voted: totalVoted,
      not_voted: totalVoters - totalVoted,
      total_votes: totalVotes,
      total_voters: totalVoters,
      participation_rate:
        totalVoters === 0 ? 0 : Math.round((totalVoted / totalVoters) * 100),

      // Student breakdown
      students_total: totalStudents,
      students_voted: studentsVoted,
      students_not_voted: totalStudents - studentsVoted,
      students_participation_rate:
        totalStudents === 0
          ? 0
          : Math.round((studentsVoted / totalStudents) * 100),

      // Staff breakdown
      staff_total: totalStaff,
      staff_voted: staffVoted,
      staff_not_voted: totalStaff - staffVoted,
      staff_participation_rate:
        totalStaff === 0 ? 0 : Math.round((staffVoted / totalStaff) * 100),

      status: election.status,
    };
  }

  async byClass(electionId: string) {
    await this.ensureExists(electionId);
    const students = await this.prisma.student.findMany({
      where: { election_id: electionId },
      select: { class_name: true, has_voted: true },
    });
    const groups = new Map<string, { total: number; voted: number }>();
    for (const s of students) {
      const g = groups.get(s.class_name) ?? { total: 0, voted: 0 };
      g.total++;
      if (s.has_voted) g.voted++;
      groups.set(s.class_name, g);
    }
    return toGroup(groups).map((g) => ({
      class_name: g.name,
      total: g.total,
      voted: g.voted,
      participation_rate: g.participation_rate,
    }));
  }

  async byMajor(electionId: string) {
    await this.ensureExists(electionId);
    const students = await this.prisma.student.findMany({
      where: { election_id: electionId },
      select: { major: true, has_voted: true },
    });
    const groups = new Map<string, { total: number; voted: number }>();
    for (const s of students) {
      const key = s.major ?? 'Tanpa jurusan';
      const g = groups.get(key) ?? { total: 0, voted: 0 };
      g.total++;
      if (s.has_voted) g.voted++;
      groups.set(key, g);
    }
    return toGroup(groups).map((g) => ({
      major: g.name,
      total: g.total,
      voted: g.voted,
      participation_rate: g.participation_rate,
    }));
  }

  async byRole(electionId: string) {
    await this.ensureExists(electionId);
    const staff = await this.prisma.staffVoter.findMany({
      where: { election_id: electionId },
      select: { role: true, has_voted: true },
    });
    const groups = new Map<string, { total: number; voted: number }>();
    for (const s of staff) {
      const key = s.role === 'TEACHER' ? 'Guru' : 'Tenaga Kependidikan / Staf';
      const g = groups.get(key) ?? { total: 0, voted: 0 };
      g.total++;
      if (s.has_voted) g.voted++;
      groups.set(key, g);
    }
    return toGroup(groups).map((g) => ({
      role: g.name,
      total: g.total,
      voted: g.voted,
      participation_rate: g.participation_rate,
    }));
  }

  private async ensureExists(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election)
      throw new NotFoundException({ errorCode: 'ELECTION_NOT_FOUND' });
    return election;
  }
}
