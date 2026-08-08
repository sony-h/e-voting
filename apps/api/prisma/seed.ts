import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password_hash: passwordHash,
      full_name: 'Administrator',
    },
  });
  console.log(`Admin ready: ${admin.username}`);

  if (process.env.NODE_ENV !== 'production') {
    const devElection = await prisma.election.upsert({
      where: { id: 'dev-election' },
      update: {},
      create: {
        id: 'dev-election',
        title: 'Pemilihan Ketua OSIS 2026/2027',
        description: 'Pemilihan Ketua dan Wakil Ketua OSIS',
        academic_year: '2026/2027',
        status: 'DRAFT',
      },
    });
    console.log(`Dev election ready: ${devElection.title}`);

    for (let i = 1; i <= 2; i++) {
      const nis = String(231000 + i);
      await prisma.student.upsert({
        where: { nis },
        update: {},
        create: {
          nis,
          full_name: `Siswa Demo ${i}`,
          class_name: `XII-${i}`,
          major: 'IPA',
          grade: 'XII',
          election_id: devElection.id,
          token: {
            create: {
              election_id: devElection.id,
              token: `DEMO-${i}-${'ABCD'.slice(0, 4)}`,
            },
          },
        },
      });
      console.log(`Dev student ${nis} ready`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
