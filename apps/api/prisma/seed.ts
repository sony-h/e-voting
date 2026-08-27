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

const STAFF_SEEDS = [
  // 8 PNS Teachers with NIP
  {
    nip: '196805121994031005',
    username: null,
    full_name: 'Drs. H. Bambang Sudiro, M.Pd.',
    role: 'TEACHER' as const,
  },
  {
    nip: '197403151999032002',
    username: null,
    full_name: 'Sri Wahyuningsih, S.Pd.',
    role: 'TEACHER' as const,
  },
  {
    nip: '198008202005011008',
    username: null,
    full_name: 'Agus Setiawan, S.Pd., M.Si.',
    role: 'TEACHER' as const,
  },
  {
    nip: '196911241997022001',
    username: null,
    full_name: 'Dra. Hj. Nurul Hidayati',
    role: 'TEACHER' as const,
  },
  {
    nip: '198506142009021003',
    username: null,
    full_name: 'Hendra Gunawan, S.Kom.',
    role: 'TEACHER' as const,
  },
  {
    nip: '198809182014022001',
    username: null,
    full_name: 'Siti Rahmawati, S.Pd.',
    role: 'TEACHER' as const,
  },
  {
    nip: '199104052019031007',
    username: null,
    full_name: 'Eko Purnomo, S.Pd.',
    role: 'TEACHER' as const,
  },
  {
    nip: '198207102008012015',
    username: null,
    full_name: 'Rina Marlina, M.Pd.',
    role: 'TEACHER' as const,
  },
  // 2 Honorer Teachers with Username
  {
    nip: null,
    username: 'guru-01',
    full_name: 'Tri Wibowo, S.Pd.',
    role: 'TEACHER' as const,
  },
  {
    nip: null,
    username: 'guru-02',
    full_name: 'Anisa Permata, S.Pd.',
    role: 'TEACHER' as const,
  },
  // 3 PNS Staff with NIP
  {
    nip: '197602142007011012',
    username: null,
    full_name: 'Joko Susilo',
    role: 'STAFF' as const,
  },
  {
    nip: '198109082010011009',
    username: null,
    full_name: 'Maryanto',
    role: 'STAFF' as const,
  },
  {
    nip: '198312012014082002',
    username: null,
    full_name: 'Endang Sulastri',
    role: 'STAFF' as const,
  },
  // 2 Staff with Username
  {
    nip: null,
    username: 'staf-01',
    full_name: 'Dedi Suryadi',
    role: 'STAFF' as const,
  },
  {
    nip: null,
    username: 'staf-02',
    full_name: 'Slamet Riyadi',
    role: 'STAFF' as const,
  },
];

interface CandidateSeed {
  chairman: string;
  vice: string;
  vision: string;
  mission: string;
  quote: string;
  colors: { bg: string; fg: string };
  program: string[];
}

const CANDIDATES_OSIS: CandidateSeed[] = [
  {
    chairman: 'Raka Pratama',
    vice: 'Salsabila Putri',
    vision:
      'Mewujudkan OSIS yang inklusif, kreatif, dan peduli terhadap setiap siswa.',
    mission:
      '1. Menyelenggarakan program pengembangan bakat siswa.\n2. Meningkatkan kesejahteraan siswa melalui aspirasi yang terfasilitasi.\n3. Membangun budaya kolaborasi antar kelas dan ekstrakurikuler.',
    quote:
      'Kepemimpinan sejati bukan tentang memerintah, melainkan melayani dan membuka ruang seluas-luasnya bagi setiap potensi siswa untuk bersinar.',
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
    quote:
      'Teknologi adalah sarana, kepedulian adalah jiwa. Kami hadir membawa keterbukaan dan kolaborasi nyata untuk masa depan sekolah yang lebih maju.',
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
    quote:
      'Membangun sekolah yang harmonis dimulai dari kebersamaan yang tulus dan semangat saling mendukung antar sesama tanpa membeda-bedakan.',
    colors: { bg: '#b45309', fg: '#ffffff' },
    program: ['Kajian Rutin', 'Mentoring Angkatan', 'Kerjasama Alumni'],
  },
];

const CANDIDATES_MPK: CandidateSeed[] = [
  {
    chairman: 'Bima Ardiansyah',
    vice: 'Zahra Aulia',
    vision:
      'Menjadikan MPK sebagai wadah aspirasi siswa yang kuat, terbuka, dan berpihak pada keadilan.',
    mission:
      '1. Mengawal aspirasi siswa secara transparan.\n2. Menyelenggarakan forum musyawarah rutin.\n3. Mendorong akuntabilitas kinerja OSIS.',
    quote:
      'Keadilan dan transparansi adalah fondasi kepercayaan. Bersama kami, setiap aspirasi siswa akan didengar, dihargai, dan diperjuangkan.',
    colors: { bg: '#7c3aed', fg: '#ffffff' },
    program: ['Forum Aspirasi', 'Musyawarah Rutin', 'Pengawasan OSIS'],
  },
  {
    chairman: 'Gilang Maulana',
    vice: 'Intan Permata',
    vision:
      'MPK yang progresif, kolaboratif, dan menjadi jembatan antara siswa dan sekolah.',
    mission:
      '1. Membangun komunikasi dua arah siswa-sekolah.\n2. Menginisiasi program kesejahteraan siswa.\n3. Meningkatkan partisipasi siswa dalam pengambilan keputusan.',
    quote:
      'Menjadi jembatan komunikasi yang kokoh dan terpercaya antara siswa dan pihak sekolah demi kemajuan bersama yang bermakna.',
    colors: { bg: '#db2777', fg: '#ffffff' },
    program: ['Jembatan Aspirasi', 'Kesejahteraan Siswa', 'Partisipasi Aktif'],
  },
  {
    chairman: 'Hafiz Ramadhan',
    vice: 'Kinanti Ayu',
    vision:
      'MPK yang bersih, objektif, dan menjadi penjaga nilai-nilai demokrasi sekolah.',
    mission:
      '1. Menegakkan transparansi kegiatan organisasi.\n2. Menyelenggarakan pendidikan demokrasi.\n3. Mengawal program-program sekolah secara objektif.',
    quote:
      'Menjaga integritas dan nilai-nilai demokrasi demi terwujudnya organisasi yang berwibawa, adil, dan berpihak seutuhnya pada kepentingan siswa.',
    colors: { bg: '#0d9488', fg: '#ffffff' },
    program: ['Transparansi', 'Edukasi Demokrasi', 'Kontrol Objektif'],
  },
];

const GALLERY_DIR = join(process.cwd(), 'uploads', 'candidate-image');

async function generateImage(opts: {
  dir: string;
  name: string;
  label: string;
  sublabel?: string;
  bg: string;
  fg: string;
  width: number;
  height: number;
}): Promise<string> {
  const { dir, name, label, sublabel, bg, fg, width, height } = opts;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="${bg}" stop-opacity="0.6"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      <circle cx="${width * 0.8}" cy="${height * 0.2}" r="${height * 0.25}" fill="${fg}" opacity="0.12"/>
      <circle cx="${width * 0.15}" cy="${height * 0.85}" r="${height * 0.3}" fill="${fg}" opacity="0.1"/>
      <text x="50%" y="46%" text-anchor="middle" font-family="sans-serif" font-size="${height * 0.16}" font-weight="bold" fill="${fg}">${label}</text>
      ${
        sublabel
          ? `<text x="50%" y="60%" text-anchor="middle" font-family="monospace" font-size="${height * 0.06}" fill="${fg}" opacity="0.85">${sublabel}</text>`
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
    mkdirSync(GALLERY_DIR, { recursive: true });

    const elections = [
      {
        id: 'dev-election-osis',
        title: 'Pemilihan Ketua OSIS 2026/2027',
        description:
          'Pilih Ketua dan Wakil Ketua OSIS untuk tahun ajaran 2026/2027.',
        academic_year: '2026/2027',
        candidates: CANDIDATES_OSIS,
        order: 1,
      },
      {
        id: 'dev-election-mpk',
        title: 'Pemilihan Ketua MPK 2026/2027',
        description:
          'Pilih Ketua dan Wakil Ketua MPK untuk tahun ajaran 2026/2027.',
        academic_year: '2026/2027',
        candidates: CANDIDATES_MPK,
        order: 2,
      },
    ];

    for (const electionData of elections) {
      const devElection = await prisma.election.upsert({
        where: { id: electionData.id },
        update: {
          title: electionData.title,
          description: electionData.description,
          academic_year: electionData.academic_year,
          status: 'DRAFT',
          start_at: new Date(),
          end_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
          order: electionData.order,
        },
        create: {
          id: electionData.id,
          title: electionData.title,
          description: electionData.description,
          academic_year: electionData.academic_year,
          status: 'DRAFT',
          start_at: new Date(),
          end_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
          order: electionData.order,
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
        const grade = classNames[i]!.klass.split('-')[0]!;
        const existing = await prisma.student.findUnique({
          where: {
            election_id_nis: { election_id: electionData.id, nis },
          },
        });
        const student = await prisma.student.upsert({
          where: {
            election_id_nis: { election_id: electionData.id, nis },
          },
          update: {
            full_name,
            class_name: classNames[i]!.klass,
            major: classNames[i]!.major,
            grade,
            election_id: electionData.id,
          },
          create: {
            nis,
            full_name,
            class_name: classNames[i]!.klass,
            major: classNames[i]!.major,
            grade,
            election_id: electionData.id,
            token: {
              create: {
                election_id: electionData.id,
                token: generateVotingToken(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            },
          },
        });
        if (existing) {
          const current = await prisma.votingToken.findUnique({
            where: { student_id: student.id },
          });
          const validFormat = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;
          await prisma.votingToken.upsert({
            where: { student_id: student.id },
            update: {
              election_id: electionData.id,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
              ...(current && !validFormat.test(current.token)
                ? { token: generateVotingToken() }
                : {}),
            },
            create: {
              student_id: student.id,
              election_id: electionData.id,
              token: generateVotingToken(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
        }
      }
      console.log('30 students ready for', electionData.id);

      for (const s of STAFF_SEEDS) {
        let staff = null;
        if (s.nip) {
          staff = await prisma.staffVoter.findUnique({
            where: {
              election_id_nip: { election_id: electionData.id, nip: s.nip },
            },
          });
        }
        if (!staff && s.username) {
          staff = await prisma.staffVoter.findUnique({
            where: {
              election_id_username: {
                election_id: electionData.id,
                username: s.username,
              },
            },
          });
        }

        if (staff) {
          staff = await prisma.staffVoter.update({
            where: { id: staff.id },
            data: {
              full_name: s.full_name,
              role: s.role,
            },
          });
          await prisma.votingToken.upsert({
            where: { staff_id: staff.id },
            update: {
              election_id: electionData.id,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
            create: {
              staff_id: staff.id,
              election_id: electionData.id,
              token: generateVotingToken(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
        } else {
          staff = await prisma.staffVoter.create({
            data: {
              nip: s.nip,
              username: s.username,
              full_name: s.full_name,
              role: s.role,
              election_id: electionData.id,
              token: {
                create: {
                  election_id: electionData.id,
                  token: generateVotingToken(),
                  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
              },
            },
          });
        }
      }
      console.log(
        `${STAFF_SEEDS.length} teachers & staff ready for`,
        electionData.id,
      );

      for (let i = 0; i < electionData.candidates.length; i++) {
        const seed = electionData.candidates[i]!;
        const number = i + 1;
        const prefix = electionData.id.replace('dev-election-', '');

        const programDescription = seed.quote;

        const candidate = await prisma.candidate.upsert({
          where: {
            election_id_candidate_number: {
              election_id: electionData.id,
              candidate_number: number,
            },
          },
          update: {
            chairman_name: seed.chairman,
            vice_chairman_name: seed.vice,
            vision: seed.vision,
            mission: seed.mission,
            program_description: programDescription,
            show_on_landing: true,
          },
          create: {
            election_id: electionData.id,
            candidate_number: number,
            chairman_name: seed.chairman,
            vice_chairman_name: seed.vice,
            vision: seed.vision,
            mission: seed.mission,
            program_description: programDescription,
            show_on_landing: true,
          },
        });

        await prisma.candidateImage.deleteMany({
          where: { candidate_id: candidate.id },
        });

        // 3 PHOTO (portrait 3:4)
        for (let p = 0; p < 3; p++) {
          const file = await generateImage({
            dir: GALLERY_DIR,
            name: `${prefix}-candidate-${number}-photo-${p + 1}`,
            label: `FOTO ${p + 1}`,
            sublabel: `${seed.chairman.toUpperCase()} · FOTO ${p + 1}`,
            bg: seed.colors.bg,
            fg: seed.colors.fg,
            width: 900,
            height: 1200,
          });
          await prisma.candidateImage.create({
            data: {
              candidate_id: candidate.id,
              url: `/uploads/candidate-image/${file}`,
              sort_order: p,
              type: 'PHOTO',
            },
          });
        }

        // 2 POSTER (2:3; second 9:16 to demo adaptive frame)
        for (let p = 0; p < 2; p++) {
          const isStoryRatio = p === 1;
          const file = await generateImage({
            dir: GALLERY_DIR,
            name: `${prefix}-candidate-${number}-poster-${p + 1}`,
            label: `POSTER ${p + 1}`,
            sublabel: `${seed.chairman.toUpperCase()} · POSTER ${p + 1}`,
            bg: seed.colors.bg,
            fg: seed.colors.fg,
            width: isStoryRatio ? 720 : 800,
            height: isStoryRatio ? 1280 : 1200,
          });
          await prisma.candidateImage.create({
            data: {
              candidate_id: candidate.id,
              url: `/uploads/candidate-image/${file}`,
              sort_order: p,
              type: 'POSTER',
            },
          });
        }

        for (let g = 0; g < seed.program.length; g++) {
          const galleryFile = await generateImage({
            dir: GALLERY_DIR,
            name: `${prefix}-candidate-${number}-program-${g + 1}`,
            label: seed.program[g]!.toUpperCase(),
            sublabel: `${seed.chairman.toUpperCase()} · PROGRAM ${g + 1}`,
            bg: seed.colors.bg,
            fg: seed.colors.fg,
            width: 900,
            height: 1200,
          });
          await prisma.candidateImage.create({
            data: {
              candidate_id: candidate.id,
              url: `/uploads/candidate-image/${galleryFile}`,
              caption: seed.program[g],
              sort_order: g,
              type: 'PROGRAM',
            },
          });
        }
        console.log(`Candidate ${number} ready: ${seed.chairman}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
