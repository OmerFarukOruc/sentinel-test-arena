/**
 * Simple utility functions for testing sentinel review pipeline.
 */

// SECURITY: This function has a potential SQL injection vulnerability
export function getUserById(id: string): string {
  const query = "SELECT * FROM users WHERE id = '" + id + "'";
  return query;
}

// BUG: No null check, will crash on undefined input
export function parseConfig(raw: string): Record<string, unknown> {
  const config = JSON.parse(raw);
  return config;
}

// PERFORMANCE: Synchronous file read in async context
import { readFileSync } from "fs";
export function loadTemplate(path: string): string {
  const content = readFileSync(path, "utf-8");
  return content;
}

// STYLE: Magic numbers, no constants
export function calculateDiscount(price: number): number {
  if (price > 100) {
    return price * 0.15;
  } else if (price > 50) {
    return price * 0.10;
  }
  return price * 0.05;
}
// diagnostic trigger 1771936530
// diag trigger 2 1771937007
// diag trigger 3 1771938048
// fix verification 1771938660
// verify polling fix 1771939160
// e2e auto_fix verification 1771941945
