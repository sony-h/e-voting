import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { generateVotingToken } from '../src/common/token.util';

const prisma = new PrismaClient();

const CLASSES = ['X-A', 'X-B', 'XI-A', 'XI-B', 'XII-A', 'XII-B'];
const MAJORS = ['IPA', 'IPS'];

const FIRST_NAMES = [
  'Ahmad',
  'Budi',
  'Citra',
  'Dewi',
  'Eko',
  'Fitri',
  'Galih',
  'Hana',
  'Indra',
  'Joko',
  'Kartika',
  'Lutfi',
  'Maya',
  'Nanda',
  'Oki',
  'Putri',
  'Rangga',
  'Sari',
  'Taufik',
  'Umi',
  'Vina',
  'Wahyu',
  'Yuni',
  'Zaki',
  'Andini',
  'Bagus',
  'Cahya',
  'Dinda',
  'Farhan',
  'Gita',
];

const SURNAMES = [
  'Pratama',
  'Wijaya',
  'Saputra',
  'Hidayat',
  'Kusuma',
  'Nugroho',
  'Santoso',
  'Lestari',
];

interface CandidateSeed {
  chairman: string;
  vice: string;
  vision: string;
  mission: string;
  colors: { bg: string; fg: string };
  program: string[];
}

const CANDIDATES: CandidateSeed[] = [
  {
    chairman: 'Raka Pratama',
    vice: 'Salsabila Putri',
    vision:
      'Mewujudkan OSIS yang inklusif, kreatif, dan peduli terhadap setiap siswa.',
    mission:
      '1. Menyelenggarakan program pengembangan bakat siswa.\n2. Meningkatkan kesejahteraan siswa melalui aspirasi yang terfasilitasi.\n3. Membangun budaya kolaborasi antar kelas dan ekstrakurikuler.',
    colors: { bg: '#1d4ed8', fg: '#ffffff' },
    program: [
      'Festival Bakat Siswa',
      'Ruang Aspirasi',
      'Gotong Royong Lingkungan',
    ],
  },
  {
    chairman: 'Dimas Saputra',
    vice: 'Nadia Rahma',
    vision:
      'OSIS digital: transparan, efisien, dan siap menghadapi tantangan masa depan.',
    mission:
      '1. Mendigitalisasi administrasi kegiatan OSIS.\n2. Menyelenggarakan pelatihan literasi digital bagi siswa.\n3. Meningkatkan partisipasi siswa melalui platform online.',
    colors: { bg: '#047857', fg: '#ffffff' },
    program: ['OSIS Digital', 'Pelatihan Literasi', 'Kompetisi Online'],
  },
  {
    chairman: 'Fajar Ramadhan',
    vice: 'Alya Zahra',
    vision:
      'Menjadikan OSIS sebagai rumah kedua bagi seluruh siswa melalui kegiatan yang membangun.',
    mission:
      '1. Menyelenggarakan kegiatan keagamaan dan kebersamaan rutin.\n2. Membentuk tim mentoring antar angkatan.\n3. Menjalin kerjasama dengan pihak sekolah dan alumni.',
    colors: { bg: '#b45309', fg: '#ffffff' },
    program: ['Kajian Rutin', 'Mentoring Angkatan', 'Kerjasama Alumni'],
  },
];

const PORTRAIT_DIR = join(process.cwd(), 'uploads', 'candidate-photo');
const GALLERY_DIR = join(process.cwd(), 'uploads', 'candidate-image');

async function generateImage(opts: {
  dir: string;
  name: string;
  label: string;
  sublabel?: string;
  bg: string;
  fg: string;
  size: number;
}): Promise<string> {
  const { dir, name, label, sublabel, bg, fg, size } = opts;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="${bg}" stop-opacity="0.6"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#g)"/>
      <circle cx="${size * 0.8}" cy="${size * 0.2}" r="${size * 0.25}" fill="${fg}" opacity="0.12"/>
      <circle cx="${size * 0.15}" cy="${size * 0.85}" r="${size * 0.3}" fill="${fg}" opacity="0.1"/>
      <text x="50%" y="46%" text-anchor="middle" font-family="sans-serif" font-size="${size * 0.16}" font-weight="bold" fill="${fg}">${label}</text>
      ${
        sublabel
          ? `<text x="50%" y="60%" text-anchor="middle" font-family="monospace" font-size="${size * 0.06}" fill="${fg}" opacity="0.85">${sublabel}</text>`
          : ''
      }
    </svg>
  `;
  const filename = `${name}.png`;
  const filepath = join(dir, filename);
  await sharp(Buffer.from(svg)).png().toFile(filepath);
  return filename;
}

async function main() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password_hash: passwordHash,
      full_name: 'Administrator',
    },
  });
  console.log('Admin ready');

  if (process.env.NODE_ENV !== 'production') {
    mkdirSync(PORTRAIT_DIR, { recursive: true });
    mkdirSync(GALLERY_DIR, { recursive: true });

    const devElection = await prisma.election.upsert({
      where: { id: 'dev-election' },
      update: {
        title: 'Pemilihan Ketua OSIS 2026/2027',
        description:
          'Pilih Ketua dan Wakil Ketua OSIS untuk tahun ajaran 2026/2027.',
        academic_year: '2026/2027',
        status: 'DRAFT',
        start_at: new Date(),
        end_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
      create: {
        id: 'dev-election',
        title: 'Pemilihan Ketua OSIS 2026/2027',
        description:
          'Pilih Ketua dan Wakil Ketua OSIS untuk tahun ajaran 2026/2027.',
        academic_year: '2026/2027',
        status: 'DRAFT',
        start_at: new Date(),
        end_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
    });
    console.log('Election ready:', devElection.title);

    const classNames = Array.from({ length: 30 }, (_, i) => {
      const klass = CLASSES[Math.floor(i / 5)]!;
      return { klass, major: MAJORS[Math.floor(i / 15)]! };
    });

    for (let i = 0; i < 30; i++) {
      const nis = String(231001 + i);
      const full_name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${
        SURNAMES[(i * 7) % SURNAMES.length]
      }`;
      const grade = classNames[i]!.klass.slice(0, 3);
      const existing = await prisma.student.findUnique({ where: { nis } });
      const student = await prisma.student.upsert({
        where: { nis },
        update: {
          full_name,
          class_name: classNames[i]!.klass,
          major: classNames[i]!.major,
          grade,
          election_id: devElection.id,
        },
        create: {
          nis,
          full_name,
          class_name: classNames[i]!.klass,
          major: classNames[i]!.major,
          grade,
          election_id: devElection.id,
          token: {
            create: {
              election_id: devElection.id,
              token: generateVotingToken(),
            },
          },
        },
      });
      if (existing) {
        await prisma.votingToken.upsert({
          where: { student_id: student.id },
          update: { election_id: devElection.id },
          create: {
            student_id: student.id,
            election_id: devElection.id,
            token: generateVotingToken(),
          },
        });
      }
    }
    console.log('30 students ready');

    for (let i = 0; i < CANDIDATES.length; i++) {
      const seed = CANDIDATES[i]!;
      const number = i + 1;

      const portraitFile = await generateImage({
        dir: PORTRAIT_DIR,
        name: `candidate-${number}-portrait`,
        label: `Nomor ${number}`,
        sublabel: seed.chairman.toUpperCase(),
        bg: seed.colors.bg,
        fg: seed.colors.fg,
        size: 640,
      });

      const candidate = await prisma.candidate.upsert({
        where: {
          election_id_candidate_number: {
            election_id: devElection.id,
            candidate_number: number,
          },
        },
        update: {
          chairman_name: seed.chairman,
          vice_chairman_name: seed.vice,
          vision: seed.vision,
          mission: seed.mission,
          photo_url: `/uploads/candidate-photo/${portraitFile}`,
          show_on_landing: true,
        },
        create: {
          election_id: devElection.id,
          candidate_number: number,
          chairman_name: seed.chairman,
          vice_chairman_name: seed.vice,
          vision: seed.vision,
          mission: seed.mission,
          photo_url: `/uploads/candidate-photo/${portraitFile}`,
          show_on_landing: true,
        },
      });

      await prisma.candidateImage.deleteMany({
        where: { candidate_id: candidate.id },
      });

      for (let g = 0; g < seed.program.length; g++) {
        const galleryFile = await generateImage({
          dir: GALLERY_DIR,
          name: `candidate-${number}-program-${g + 1}`,
          label: seed.program[g]!.toUpperCase(),
          sublabel: `${seed.chairman.toUpperCase()} · PROGRAM ${g + 1}`,
          bg: seed.colors.bg,
          fg: seed.colors.fg,
          size: 640,
        });
        await prisma.candidateImage.create({
          data: {
            candidate_id: candidate.id,
            url: `/uploads/candidate-image/${galleryFile}`,
            caption: seed.program[g],
            sort_order: g,
          },
        });
      }
      console.log(`Candidate ${number} ready: ${seed.chairman}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
