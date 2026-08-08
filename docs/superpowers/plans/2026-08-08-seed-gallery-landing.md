# Rich Seed + Image Gallery + 3D Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rich demo seed (30 students, 3 candidates with portraits + program image galleries), candidate image gallery (schema + admin upload + student carousel), and an immersive motion/CSS-3D landing page with a public candidates showcase.

**Architecture:** New `CandidateImage` table + `Candidate.show_on_landing` flag (docs-first); multer multi-file upload; sharp-generated dummy images (offline); `motion` + CSS 3D transforms for the landing; public read-only endpoint `GET /public/candidates`.

**Tech Stack:** Prisma 6, NestJS 11, multer, sharp; Next.js 16, motion, TanStack Query.

## Global Constraints

- Docs-first: `03_DATABASE.md` → `04_API_SPECS.md` before code.
- No hidden endpoints; public endpoint documented. Vote counts never public.
- Seed idempotent (upsert), offline (sharp-generated images to uploads/).
- `useReducedMotion` respected; mobile-first; no admin mention on landing.
- Conventional commits; no code comments unless asked.

---

### Task 1: Schema + Docs (CandidateImage + show_on_landing)
- `docs/03_DATABASE.md`: CandidateImage table + ER + constraints; Candidate.show_on_landing note
- `schema.prisma`: CandidateImage model + `Candidate.show_on_landing @default(true)` + `images CandidateImage[]`
- Migration `add_candidate_images`; verify `prisma migrate dev` + typecheck
- Commit `feat: add candidate image gallery and landing visibility flag`

### Task 2: Backend — Gallery Endpoints + Public Candidates
- candidate.service: include images in findAll/findOne; `addImages(id, files)`; `removeImage(id)`; `findPublic(electionId)` (show_on_landing only, include images)
- candidate.controller: `POST /candidates/:id/images` (multi, 5 max, 2MB), `DELETE /candidate-images/:id`
- PublicController: `GET /public/candidates?electionId=`
- voting.service: getCandidates includes images
- `docs/04_API_SPECS.md`: public section + gallery endpoints + `CANDIDATE_IMAGE_NOT_FOUND`
- Tests: gallery create/delete/include; public filter
- Commit `feat: add candidate gallery endpoints and public candidate list`

### Task 3: Seed Rewrite
- Admin env creds; dev-election DRAFT + start/end; 30 students (6 classes, IPA/IPS, NIS 231001+, generated tokens); 3 candidates with portrait + 3 gallery images each; sharp SVG→PNG generation helper; idempotent
- Add `sharp` devDep
- Commit `feat: seed rich demo data with candidate photos and galleries`

### Task 4: Frontend — Services + Admin Gallery UI
- services/candidates.ts: `uploadCandidateImages`, `deleteCandidateImage`, `listPublicCandidates`; types include images
- Admin candidates dialog: gallery multi-upload + thumbnail grid + per-image delete + `show_on_landing` checkbox
- Commit `feat: add admin candidate gallery upload and management`

### Task 5: Student Detail Gallery Carousel
- Student detail dialog: carousel (index, prev/next, dots, touch swipe) over images
- Commit `feat: add gallery carousel to student candidate detail`

### Task 6: Landing — 3D Immersive + Candidates Showcase
- Add `motion`; hero (staggered entrance, floating 3D checkmark, mouse tilt desktop, scroll parallax); election strip; candidates section (3D tilt cards, horizontal snap-scroll program image strip, staggered whileInView); Cara Memilih steps; CTA; useReducedMotion
- Commit `feat: build immersive 3d landing with candidates showcase`

### Task 7: Verification + Docs Closeout
- Full root verify; live smoke (re-seed, gallery upload, toggle visibility, student carousel, public endpoint, no counts); PROGRESS.md
- Commit `docs: update progress for seed, gallery, and landing`
