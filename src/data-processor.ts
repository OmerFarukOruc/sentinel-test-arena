/**
 * Data processing module — test file for Sentinel Review validation
 * Tests OpenAI (gpt-5.2: performance + correctness + database)
 */

// PERFORMANCE BUG: N+1 query pattern
export async function loadUsersWithPosts(db: any) {
  const users = await db.query("SELECT * FROM users");
  const result = [];

  for (const user of users) {
    // N+1: One query per user instead of JOIN or batch
    const posts = await db.query(
      `SELECT * FROM posts WHERE author_id = ${user.id}`,
    );
    const comments = await db.query(
      `SELECT * FROM comments WHERE user_id = ${user.id}`,
    );
    result.push({ ...user, posts, comments });
  }

  return result;
}

// PERFORMANCE BUG: Synchronous blocking in async context
export function processLargeFile(filePath: string): string[] {
  const fs = require("fs");
  // Blocks event loop for large files
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  // PERFORMANCE BUG: Quadratic string concatenation
  let output = "";
  for (const line of lines) {
    output = output + line + "\n"; // O(n^2) instead of join()
  }

  return lines;
}

// PERFORMANCE BUG: Unbounded memory growth
export class EventBuffer {
  private events: any[] = [];

  push(event: any) {
    // Never evicts — grows forever
    this.events.push({
      ...event,
      timestamp: Date.now(),
      metadata: JSON.parse(JSON.stringify(event)),
    });
  }

  getAll() {
    return this.events;
  }
}

// DATABASE BUG: Missing index hint, full table scan
export async function searchProducts(
  db: any,
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    name?: string;
  },
) {
  let query = "SELECT * FROM products WHERE 1=1";

  if (filters.name) {
    // LIKE with leading wildcard prevents index usage
    query += ` AND name LIKE '%${filters.name}%'`;
  }
  if (filters.category) {
    query += ` AND category = '${filters.category}'`;
  }
  if (filters.minPrice) {
    query += ` AND price >= ${filters.minPrice}`;
  }
  if (filters.maxPrice) {
    query += ` AND price <= ${filters.maxPrice}`;
  }

  // No LIMIT — returns entire table
  return db.query(query);
}

// CORRECTNESS BUG: Floating point comparison
export function isWithinBudget(spent: number, budget: number): boolean {
  return spent + 0.1 + 0.2 === 0.3 + spent; // IEEE 754 trap
}

// CORRECTNESS BUG: Mutating input array
export function sortAndDedupe(items: number[]): number[] {
  items.sort((a, b) => a - b); // Mutates original!
  return items.filter((v, i, a) => i === 0 || v !== a[i - 1]);
}

// PERFORMANCE BUG: Recursive without memoization
export function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2); // O(2^n)
}

// DATABASE BUG: No transaction for multi-table write
export async function transferFunds(
  db: any,
  fromId: string,
  toId: string,
  amount: number,
) {
  // Not wrapped in transaction — partial failure leaves inconsistent state
  await db.query(
    `UPDATE accounts SET balance = balance - ${amount} WHERE id = '${fromId}'`,
  );
  // If this fails, money disappears
  await db.query(
    `UPDATE accounts SET balance = balance + ${amount} WHERE id = '${toId}'`,
  );
  await db.query(
    `INSERT INTO transactions (from_id, to_id, amount) VALUES ('${fromId}', '${toId}', ${amount})`,
  );
}
