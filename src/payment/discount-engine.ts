interface DiscountRule {
  code: string;
  percentage: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
}

// BUG: Mutable global state, not thread-safe
const discountCodes: DiscountRule[] = [
  {
    code: "SAVE20",
    percentage: 20,
    maxUses: 100,
    currentUses: 0,
    expiresAt: new Date("2025-12-31"),
  },
  {
    code: "HALF_OFF",
    percentage: 50,
    maxUses: 10,
    currentUses: 0,
    expiresAt: new Date("2025-06-30"),
  },
];

export function applyDiscount(
  amount: number,
  code: string,
): { finalAmount: number; discountApplied: number } {
  // BUG: Case-sensitive code matching (user enters "save20" → fails)
  const rule = discountCodes.find((r) => r.code === code);

  if (!rule) {
    return { finalAmount: amount, discountApplied: 0 };
  }

  // BUG: Checking expiry AFTER finding the code but not returning early properly
  if (rule.expiresAt < new Date()) {
    console.log(`Code ${code} expired`);
    // BUG: Falls through instead of returning
  }

  // BUG: No check for maxUses exceeded
  rule.currentUses++;

  // BUG: Percentage can exceed 100 if multiple discounts stacked
  const discount = amount * (rule.percentage / 100);

  // BUG: Floating point - should use integer cents
  const finalAmount = amount - discount;

  // BUG: finalAmount could be negative if discount > amount
  return { finalAmount, discountApplied: discount };
}

// BUG: SQL injection vulnerability in discount lookup
export async function lookupDiscountFromDb(
  code: string,
  db: { query: (sql: string) => Promise<unknown[]> },
): Promise<DiscountRule | null> {
  const results = await db.query(
    `SELECT * FROM discounts WHERE code = '${code}'`,
  );
  return (results[0] as DiscountRule) ?? null;
}

// BUG: No rate limiting on discount creation
export function createDiscount(
  code: string,
  percentage: number,
  maxUses: number,
  daysValid: number,
): DiscountRule {
  // BUG: No validation that percentage is 0-100
  // BUG: No validation that maxUses > 0
  // BUG: No check for duplicate codes
  const rule: DiscountRule = {
    code,
    percentage,
    maxUses,
    currentUses: 0,
    expiresAt: new Date(Date.now() + daysValid * 86400000),
  };

  discountCodes.push(rule);
  return rule;
}
