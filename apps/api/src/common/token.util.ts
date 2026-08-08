import { randomBytes } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateVotingToken(): string {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}
