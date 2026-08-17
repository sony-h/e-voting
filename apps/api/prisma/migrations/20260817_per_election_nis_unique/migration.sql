-- Per-election NIS/NISN uniqueness (multi-election support)
DROP INDEX "Student_nis_key";
DROP INDEX "Student_nisn_key";

CREATE UNIQUE INDEX "Student_election_id_nis_key" ON "Student"("election_id", "nis");
CREATE UNIQUE INDEX "Student_election_id_nisn_key" ON "Student"("election_id", "nisn");
