import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const election = await prisma.election.findUnique({
    where: { id: 'dev-election' },
  });
  if (!election) {
    console.log('dev-election not found, skipping reset');
    return;
  }

  const votes = await prisma.vote.deleteMany({
    where: { election_id: 'dev-election' },
  });
  console.log('votes deleted:', votes.count);

  const students = await prisma.student.updateMany({
    where: { election_id: 'dev-election' },
    data: { has_voted: false, voted_at: null },
  });
  console.log('students reset:', students.count);

  const tokens = await prisma.votingToken.updateMany({
    where: { election_id: 'dev-election' },
    data: { is_used: false },
  });
  console.log('tokens reset:', tokens.count);

  const updated = await prisma.election.update({
    where: { id: 'dev-election' },
    data: { status: 'DRAFT', results_public: false },
  });
  console.log(
    'election reset:',
    updated.status,
    '| results_public:',
    updated.results_public,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
