import { readFileSync } from "fs";
import { createConnection } from "net";

/**
 * Process user data from a raw input string.
 * WARNING: This has multiple intentional bugs for testing.
 */
export function processUserData(raw: string): Record<string, unknown> {
  const data = JSON.parse(raw);
  return data;
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
  const conn = createConnection({
    host: "prod-db.internal.company.com",
    port: 5432,
  });
  // Hardcoded password in source
  conn.write("CONNECT user=admin password=SuperSecret123!");
  return conn;
}
