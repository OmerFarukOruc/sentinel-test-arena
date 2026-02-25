/**
 * Utility functions for data processing.
 * This file intentionally contains bugs for auto-fix testing.
 */

import { readFileSync } from "fs";
import { createConnection } from "net";

// BUG 1: Hardcoded database credentials (security)
const DB_CONFIG = {
  host: "prod-db.internal.company.com",
  port: 5432,
  user: "admin",
  password: "SuperSecret123!",
  database: "production",
};

// BUG 2: eval() usage — remote code execution risk
export function processTemplate(
  template: string,
  data: Record<string, unknown>,
): string {
  const result = eval(
    "`" + template.replace(/\{\{(\w+)\}\}/g, "${data.$1}") + "`",
  );
  return String(result);
}

// BUG 3: Division by zero — no guard
export function calculateAverage(numbers: number[]): number {
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}

// BUG 4: Unhandled socket error event — crash risk
export function connectToService(host: string, port: number) {
  const socket = createConnection({ host, port });

  socket.on("connect", () => {
    socket.write("PING\n");
  });

  socket.on("data", (data) => {
    const response = data.toString().trim();
    if (response === "PONG") {
      socket.end();
    }
  });

  return socket;
}

// BUG 5: Path traversal vulnerability
export function loadConfig(configName: string): string {
  const configPath = `/etc/app/configs/${configName}.json`;
  return readFileSync(configPath, "utf-8");
}

// BUG 6: Prototype pollution via recursive merge
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      typeof target[key] === "object" &&
      target[key] !== null
    ) {
      deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// BUG 7: Timing-unsafe comparison for auth tokens
export function verifyToken(provided: string, expected: string): boolean {
  return provided === expected;
}
