-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "show_on_landing" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CandidateImage" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateImage_candidate_id_idx" ON "CandidateImage"("candidate_id");

-- AddForeignKey
ALTER TABLE "CandidateImage" ADD CONSTRAINT "CandidateImage_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
