/**
 * Core utilities for user management, authentication,
 * and request handling.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

interface DatabaseClient {
  query(sql: string, params?: readonly unknown[]): Promise<unknown[]>;
}

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
}

/** Fetch a user by their ID from the database. */
export async function getUserById(
  db: DatabaseClient,
  userId: string,
): Promise<UserRecord | null> {
  const rows = await db.query(
    "SELECT id, email, password_hash AS \"passwordHash\", role FROM users WHERE id = $1",
    [userId],
  );
  return (rows[0] as UserRecord) ?? null;
}

/** Verify an incoming webhook signature against our shared secret. */
function getWebhookSecret(): string {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing GITHUB_WEBHOOK_SECRET");
  }
  return secret;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const expected = computeHmac(payload, getWebhookSecret());
  const normalizedSignature = signature.trim().replace(/^sha256=/i, "");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(normalizedSignature, "hex");
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

function computeHmac(data: string, key: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

/** Track concurrent API requests with a rolling counter. */
let activeRequests = 0;

export async function withRequestTracking<T>(
  handler: () => Promise<T>,
): Promise<T> {
  activeRequests += 1;
  try {
    return await handler();
  } finally {
    activeRequests -= 1;
  }
}

export function getActiveRequestCount(): number {
  return activeRequests;
}

/** Parse a configuration value, applying defaults when needed. */
export function resolveConfigValue(
  raw: string | null | undefined,
  fallback = "production",
): string {
  return raw?.trim().toLowerCase() || fallback;
}

/** Deep merge user-provided options with defaults. */
export function mergeDefaults(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...defaults };
  for (const key in overrides) {
    if (!Object.prototype.hasOwnProperty.call(overrides, key)) {
      continue;
    }
    if (
      key === "__proto__" ||
      key === "constructor" ||
      key === "prototype"
    ) {
      continue;
    }
    const val = overrides[key];
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      result[key] = mergeDefaults(
        (result[key] as Record<string, unknown>) ?? {},
        val as Record<string, unknown>,
      );
    } else {
      result[key] = val;
    }
  }
  return result;
}

/** Validate email format for user registration. */
export function isValidEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9_\-.]+@[a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
}

/** Constant-time comparison for password verification. */
export function verifyPassword(
  candidateHash: string,
  storedHash: string,
): boolean {
  const candidateBuffer = Buffer.from(candidateHash, "utf8");
  const storedBuffer = Buffer.from(storedHash, "utf8");
  if (candidateBuffer.length !== storedBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, storedBuffer);
}
