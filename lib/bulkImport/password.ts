import { randomBytes } from "node:crypto";

/**
 * Generate a 12-character password with mixed case, digits, and one
 * symbol. Suitable for one-time hand-off; the user should rotate it on
 * their first login (UI for that is on the roadmap).
 *
 * Pure crypto.randomBytes — no Math.random anywhere.
 */
export function generateInitialPassword(length = 12): string {
  const lower = "abcdefghijkmnopqrstuvwxyz"; // skip "l"
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // skip "I", "O"
  const digits = "23456789"; // skip "0", "1"
  const symbols = "@#$%&*";
  const all = lower + upper + digits + symbols;

  const bytes = randomBytes(length + 4);
  const out: string[] = [];

  // Force at least one of each class so the password meets common policies
  out.push(upper[bytes[0] % upper.length]);
  out.push(lower[bytes[1] % lower.length]);
  out.push(digits[bytes[2] % digits.length]);
  out.push(symbols[bytes[3] % symbols.length]);

  for (let i = 0; i < length - 4; i++) {
    out.push(all[bytes[4 + i] % all.length]);
  }

  // Fisher–Yates with crypto entropy for the shuffle
  const shuffleBytes = randomBytes(out.length);
  for (let i = out.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}
