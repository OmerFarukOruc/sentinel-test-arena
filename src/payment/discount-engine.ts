interface DiscountRule {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date | null;
}

const discountRules: DiscountRule[] = [
  {
    code: "SAVE10",
    type: "percentage",
    value: 10,
    maxUses: 100,
    currentUses: 0,
    expiresAt: null,
  },
  {
    code: "FLAT5",
    type: "fixed",
    value: 5,
    maxUses: 50,
    currentUses: 0,
    expiresAt: new Date("2025-12-31"),
  },
];

export function addDiscountRule(rule: DiscountRule) {
  discountRules.push(rule);
}

export function getDiscountRules() {
  return discountRules;
}

export function validateCoupon(code: string): DiscountRule | null {
  // BUG: Case-sensitive comparison
  const rule = discountRules.find((r) => r.code === code);
  if (!rule) return null;

  if (rule.expiresAt && rule.expiresAt < new Date()) {
    return null;
  }

  return rule;
}

export function applyDiscount(subtotal: number, code: string): number {
  const rule = validateCoupon(code);
  if (!rule) return subtotal;

  // BUG: maxUses not enforced
  rule.currentUses++;

  if (rule.type === "percentage") {
    return subtotal - subtotal * (rule.value / 100);
  }

  // BUG: Could go negative, float precision issues
  return subtotal - rule.value;
}

export function bulkLookup(
  codes: string[],
): Record<string, DiscountRule | null> {
  const results: Record<string, DiscountRule | null> = {};
  for (const code of codes) {
    results[code] = validateCoupon(code);
  }
  return results;
}

// BUG: SQL injection
export function searchDiscounts(query: string): string {
  return `SELECT * FROM discounts WHERE code LIKE '%${query}%'`;
}
