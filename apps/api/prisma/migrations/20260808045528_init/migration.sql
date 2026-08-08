-- CreateEnum
CREATE TYPE "ElectionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "Election" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "academic_year" TEXT NOT NULL,
    "status" "ElectionStatus" NOT NULL DEFAULT 'DRAFT',
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "nisn" TEXT,
    "full_name" TEXT NOT NULL,
    "class_name" TEXT NOT NULL,
    "major" TEXT,
    "grade" TEXT,
    "has_voted" BOOLEAN NOT NULL DEFAULT false,
    "voted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "candidate_number" INTEGER NOT NULL,
    "chairman_name" TEXT NOT NULL,
    "vice_chairman_name" TEXT,
    "photo_url" TEXT,
    "vision" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VotingToken" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VotingToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "school_name" TEXT,
    "school_logo" TEXT,
    "principal_name" TEXT,
    "current_academic_year" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Election_status_idx" ON "Election"("status");

-- CreateIndex
CREATE INDEX "Student_class_name_idx" ON "Student"("class_name");

-- CreateIndex
CREATE INDEX "Student_major_idx" ON "Student"("major");

-- CreateIndex
CREATE UNIQUE INDEX "Student_nis_key" ON "Student"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "Student_nisn_key" ON "Student"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_election_id_candidate_number_key" ON "Candidate"("election_id", "candidate_number");

-- CreateIndex
CREATE UNIQUE INDEX "VotingToken_student_id_key" ON "VotingToken"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "VotingToken_token_key" ON "VotingToken"("token");

-- CreateIndex
CREATE INDEX "Vote_candidate_id_idx" ON "Vote"("candidate_id");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotingToken" ADD CONSTRAINT "VotingToken_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotingToken" ADD CONSTRAINT "VotingToken_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Single Active Election (business rule: only one election can be ACTIVE)
CREATE UNIQUE INDEX "election_single_active" ON "Election" ("status") WHERE "status" = 'ACTIVE';
