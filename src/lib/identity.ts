/**
 * Anoneurx Identity — local-only profile primitives.
 *
 * Nothing here talks to a network. Credentials are stored only as
 * salted SHA-256 digests so the raw password / pattern never persists.
 */

import { getRandomBytes, bytesToHex } from "./crypto";

export type UnlockMethod = "pattern" | "password";

export interface IdentityAnswer {
  id: string;
  question: string;
  /** Salted digest — the raw answer is never stored. */
  answerHash: string;
}

export interface VaultProfile {
  username: string;
  displayName: string;
  passwordHash: string;
  patternHash: string | null;
  salt: string;
  identity: IdentityAnswer[];
  enabledUnlock: UnlockMethod[];
  createdAt: number;
}

export const IDENTITY_QUESTIONS: { id: string; question: string; placeholder: string }[] = [
  {
    id: "childhood-street",
    question: "What was the name of the street you lived on as a child?",
    placeholder: "e.g. Marlow Lane",
  },
  {
    id: "first-pet",
    question: "What was the name of your first pet?",
    placeholder: "e.g. Mango",
  },
  {
    id: "mother-maiden",
    question: "What is your mother's maiden name?",
    placeholder: "Answer stays on this device",
  },
  {
    id: "first-employer",
    question: "What was the name of your first employer?",
    placeholder: "e.g. Northwind Ltd",
  },
  {
    id: "memorable-date",
    question: "Which date is most personally significant to you (DD/MM/YYYY)?",
    placeholder: "e.g. 14/09/2011",
  },
];

export function createSalt(): string {
  return bytesToHex(getRandomBytes(16));
}

export async function hashSecret(value: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${value.trim().toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

export async function verifySecret(
  value: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const hash = await hashSecret(value, salt);
  return hash === expectedHash;
}

/** Pattern nodes (0-8) serialised into a stable string before hashing. */
export function serialisePattern(nodes: number[]): string {
  return nodes.join("-");
}

export function passwordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score] ?? "Weak" };
}
