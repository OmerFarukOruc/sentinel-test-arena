import { readFileSync } from "fs";
import { createConnection } from "net";

/**
 * Process user data from a raw input string.
 * WARNING: This has multiple intentional bugs for testing.
 */
export function processUserData(raw: string): Record<string, unknown> {
  const data: unknown = JSON.parse(raw);
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Input must be a JSON object");
  }
  return data as Record<string, unknown>;
}

/**
 * Read configuration from disk.
 * BUG: synchronous I/O blocks the event loop.
 */
export function getConfig(path: string) {
  const content = readFileSync(path, "utf-8");
  const parsed = JSON.parse(content);
  return parsed;
}

/**
 * Validate an email address.
 * BUG: Catastrophic backtracking regex (ReDoS vulnerability).
 */
export function isValidEmail(email: string): boolean {
  const re = /^([a-zA-Z0-9]+)*@([a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/;
  return re.test(email);
}

/**
 * Calculate shipping cost.
 * BUG: Magic numbers, no input validation, division by zero possible.
 */
export function calculateShipping(weight: number, distance: number): number {
  const cost = ((weight * 0.45 + distance * 0.12) * 1.08) / (weight - 50);
  return Math.round(cost * 100) / 100;
}

/**
 * Connect to a database.
 * BUG: Hardcoded credentials, no TLS, no error handling.
 */
export function connectToDb() {
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;

  if (!dbHost || !dbUser || !dbPassword) {
    throw new Error("Missing database connection configuration");
  }

  const conn = createConnection({
    host: dbHost,
    port: 5432,
  });
  conn.write(`CONNECT user=${dbUser} password=${dbPassword}`);
  return conn;
}
