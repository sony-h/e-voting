-- Drop partial unique index enforcing a single active election.
-- Dual-election support requires multiple simultaneous ACTIVE elections.
DROP INDEX "election_single_active";
