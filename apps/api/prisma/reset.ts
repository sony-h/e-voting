import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ELECTION_IDS = ['dev-election-osis', 'dev-election-mpk'];

async function main() {
  for (const electionId of ELECTION_IDS) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) {
      console.log(`${electionId} not found, skipping`);
      continue;
    }

    const votes = await prisma.vote.deleteMany({
      where: { election_id: electionId },
    });
    console.log(`${electionId}: votes deleted`, votes.count);

    const students = await prisma.student.updateMany({
      where: { election_id: electionId },
      data: { has_voted: false, voted_at: null },
    });
    console.log(`${electionId}: students reset`, students.count);

    const tokens = await prisma.votingToken.updateMany({
      where: { election_id: electionId },
      data: { is_used: false },
    });
    console.log(`${electionId}: tokens reset`, tokens.count);

    const updated = await prisma.election.update({
      where: { id: electionId },
      data: { status: 'DRAFT', results_public: false },
    });
    console.log(
      `${electionId}: reset to ${updated.status} | results_public: ${updated.results_public}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
