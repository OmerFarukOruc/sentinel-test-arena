/**
 * Utility functions for the sentinel test arena.
 * This file intentionally contains bugs for review testing.
 */

// Bug 1: SQL injection vulnerability
export function getUserById(db: any, userId: string): any {
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  return db.query(query);
}

// Bug 2: Hardcoded secret
const API_SECRET = "sk_live_a1b2c3d4e5f6g7h8i9j0";

export function authenticate(token: string): boolean {
  return token === API_SECRET;
}

// Bug 3: Race condition - no mutex on shared state
let requestCount = 0;
export async function trackRequest(): Promise<number> {
  const current = requestCount;
  await new Promise((r) => setTimeout(r, 10));
  requestCount = current + 1;
  return requestCount;
}

// Bug 4: Unchecked null dereference
export function parseConfig(input: string | null): string {
  return input.trim().toLowerCase();
}

// Bug 5: Prototype pollution
export function mergeOptions(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const key in source) {
    target[key] = source[key];
  }
  return target;
}

// Bug 6: ReDoS vulnerability
export function validateEmail(email: string): boolean {
  const regex = /^([a-zA-Z0-9_\-.]+)*@([a-zA-Z0-9_\-.]+)*\.([a-zA-Z]{2,})$/;
  return regex.test(email);
}

// Bug 7: Timing attack on password comparison
export function verifyPassword(input: string, stored: string): boolean {
  if (input.length !== stored.length) return false;
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== stored[i]) return false;
  }
  return true;
}
