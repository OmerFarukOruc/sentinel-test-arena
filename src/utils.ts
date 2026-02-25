/**
 * Utility functions for the sentinel test arena.
 * This file intentionally contains bugs for review testing.
 */
import { timingSafeEqual } from "node:crypto";

// Bug 1: SQL injection vulnerability
export function getUserById(db: any, userId: string): any {
  return db.query("SELECT * FROM users WHERE id = ?", [userId]);
}

// Bug 3: Race condition - no mutex on shared state
let requestCount = 0;
export async function trackRequest(): Promise<number> {
  requestCount += 1;
  const current = requestCount;
  await new Promise((r) => setTimeout(r, 10));
  return current;
}

// Bug 4: Unchecked null dereference
export function parseConfig(input: string | null): string {
  return (input ?? "").trim().toLowerCase();
}

// Bug 5: Prototype pollution
export function mergeOptions(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    if (
      key === "__proto__" ||
      key === "prototype" ||
      key === "constructor"
    ) {
      continue;
    }
    target[key] = source[key];
  }
  return target;
}

// Bug 6: ReDoS vulnerability
export function validateEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9_\-.]+@[a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// Bug 7: Timing attack on password comparison
export function verifyPassword(input: string, stored: string): boolean {
  const inputBuffer = Buffer.from(input);
  const storedBuffer = Buffer.from(stored);
  const maxLength = Math.max(inputBuffer.length, storedBuffer.length);

  const normalizedInput = Buffer.alloc(maxLength);
  const normalizedStored = Buffer.alloc(maxLength);

  inputBuffer.copy(normalizedInput);
  storedBuffer.copy(normalizedStored);

  return (
    timingSafeEqual(normalizedInput, normalizedStored) &&
    inputBuffer.length === storedBuffer.length
  );
}
