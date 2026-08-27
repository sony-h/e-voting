-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('TEACHER', 'STAFF');

-- AlterTable
ALTER TABLE "VotingToken" ALTER COLUMN "student_id" DROP NOT NULL,
ADD COLUMN     "staff_id" TEXT;

-- CreateTable
CREATE TABLE "StaffVoter" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "nip" TEXT,
    "username" TEXT,
    "full_name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'TEACHER',
    "has_voted" BOOLEAN NOT NULL DEFAULT false,
    "voted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffVoter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffVoter_role_idx" ON "StaffVoter"("role");

-- CreateIndex
CREATE UNIQUE INDEX "StaffVoter_election_id_nip_key" ON "StaffVoter"("election_id", "nip");

-- CreateIndex
CREATE UNIQUE INDEX "StaffVoter_election_id_username_key" ON "StaffVoter"("election_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "VotingToken_staff_id_key" ON "VotingToken"("staff_id");

-- AddForeignKey
ALTER TABLE "StaffVoter" ADD CONSTRAINT "StaffVoter_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotingToken" ADD CONSTRAINT "VotingToken_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "StaffVoter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
