/**
 * Utility functions for data processing.
 * This file intentionally contains bugs for auto-fix testing.
 */

const { DB_HOST, DB_USER, DB_PASSWORD } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
  throw new Error("Missing required database credentials");
}

// BUG 1 FIX: Load database credentials from environment
const DB_CONFIG = {
  host: DB_HOST,
  port: 5432,
  user: DB_USER,
  password: DB_PASSWORD,
  database: "production",
};

// BUG 2: eval() usage — remote code execution risk
export function processTemplate(
  template: string,
  data: Record<string, unknown>,
): string {
  return template.replaceAll(/\{\{([^{}]+)\}\}/g, (_match, key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return String(data[key] ?? "");
    }

    return "";
  });
}

// BUG 3: Division by zero — no guard
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}

// BUG 6: Prototype pollution via recursive merge
function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const blockedKeys = new Set(["__proto__", "constructor", "prototype"]);

  for (const [key, value] of Object.entries(source)) {
    if (blockedKeys.has(key)) {
      continue;
    }

    const targetValue = target[key];

    if (isPlainObject(value) && isPlainObject(targetValue)) {
      deepMerge(targetValue, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

// BUG 7: Timing-unsafe comparison for auth tokens
export function verifyToken(provided: string, expected: string): boolean {
  return provided === expected;
}
