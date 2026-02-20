/**
 * Authentication service — test file for Sentinel Review validation
 * Tests ZeroGravity (opus-4.6: security + architecture) and OpenAI (gpt-5.2: correctness)
 */

import crypto from "crypto";

// SECURITY BUG: Hardcoded secret key
const JWT_SECRET = "super-secret-key-2026-production";
const API_KEY = "sk-live-abc123def456ghi789";

// SECURITY BUG: SQL injection vulnerability
export async function findUser(db: any, username: string) {
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  return db.query(query);
}

// SECURITY BUG: Command injection
export function generateReport(userId: string) {
  const { execSync } = require("child_process");
  const result = execSync(`generate-report --user=${userId}`);
  return result.toString();
}

// SECURITY BUG: Weak password hashing (MD5)
export function hashPassword(password: string): string {
  return crypto.createHash("md5").update(password).digest("hex");
}

// SECURITY BUG: No rate limiting, timing attack on comparison
export function verifyToken(token: string, expected: string): boolean {
  return token === expected;
}

// ARCHITECTURE BUG: God function doing everything
export async function handleUserRequest(
  req: any,
  db: any,
  cache: any,
  emailService: any,
  logger: any,
  metrics: any,
) {
  // Parse request
  const { action, userId, data } = req.body;

  // Direct DB access (no repository pattern)
  const user = await db.query(`SELECT * FROM users WHERE id = '${userId}'`);

  if (!user) {
    return { status: 404 };
  }

  // Business logic mixed with infrastructure
  if (action === "update_profile") {
    await db.query(
      `UPDATE users SET name = '${data.name}' WHERE id = '${userId}'`,
    );
    await cache.del(`user:${userId}`);
    await emailService.send(user.email, "Profile updated");
    metrics.increment("profile.updates");
    logger.info("Profile updated", { userId });
  } else if (action === "delete_account") {
    await db.query(`DELETE FROM users WHERE id = '${userId}'`);
    await db.query(`DELETE FROM sessions WHERE user_id = '${userId}'`);
    await db.query(`DELETE FROM posts WHERE author_id = '${userId}'`);
    await cache.del(`user:${userId}`);
    await emailService.send(user.email, "Account deleted");
    metrics.increment("account.deletions");
    logger.info("Account deleted", { userId });
  }

  return { status: 200 };
}

// CORRECTNESS BUG: Off-by-one, wrong accumulator logic
export function calculateDiscount(
  items: { price: number; quantity: number }[],
): number {
  let total = 0;
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  // CORRECTNESS BUG: discount calculation is inverted
  const discount = total > 100 ? total * 1.1 : total * 0.95;
  return discount;
}

// CORRECTNESS BUG: Promise not awaited, race condition
export function processQueue(queue: string[]) {
  const results: string[] = [];
  for (const item of queue) {
    // Missing await - fire and forget
    fetch(`https://api.example.com/process/${item}`).then((r) => r.json());
    results.push(item);
  }
  return results;
}
