-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('PROGRAM', 'PHOTO', 'POSTER');

-- AlterTable: typed images (single table for program gallery, photos, posters)
ALTER TABLE "CandidateImage" ADD COLUMN "type" "ImageType" NOT NULL DEFAULT 'PROGRAM';

-- Backfill: promote single photo_url / poster_url into typed rows
INSERT INTO "CandidateImage" ("id", "candidate_id", "url", "sort_order", "created_at", "type")
SELECT gen_random_uuid(), c."id", c."photo_url", 0, now(), 'PHOTO'
FROM "Candidate" c
WHERE c."photo_url" IS NOT NULL;

INSERT INTO "CandidateImage" ("id", "candidate_id", "url", "sort_order", "created_at", "type")
SELECT gen_random_uuid(), c."id", c."poster_url", 1, now(), 'POSTER'
FROM "Candidate" c
WHERE c."poster_url" IS NOT NULL;

-- DropTableColumn: superseded by typed CandidateImage rows
ALTER TABLE "Candidate" DROP COLUMN "photo_url";
ALTER TABLE "Candidate" DROP COLUMN "poster_url";
