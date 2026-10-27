// Team invite codes (docs/07 > lib/domain, Decision 4). Pure functions: the
// random source is passed in, so tests use a fixed one and production passes
// crypto.randomInt.

/** No 0/O or 1/I, so a code is easy to read aloud and type by hand. */
export const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 6;

/** A source of whole numbers in [0, max), like `crypto.randomInt`. */
export type RandomInt = (max: number) => number;

export function generateInviteCode(random: RandomInt): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_ALPHABET[random(INVITE_CODE_ALPHABET.length)];
  }
  return code;
}

/** What people type, as it's stored: trimmed and upper-cased. */
export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase();
}
