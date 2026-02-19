interface DiscountRule {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
}

// BUG: mutable global state
const discountRules: DiscountRule[] = [
  {
    code: "SAVE20",
    type: "percentage",
    value: 20,
    maxUses: 100,
    currentUses: 0,
    expiresAt: new Date("2027-12-31"),
  },
  {
    code: "FLAT10",
    type: "fixed",
    value: 10,
    maxUses: 50,
    currentUses: 0,
    expiresAt: new Date("2027-06-30"),
  },
];

export function validateCoupon(code: string): DiscountRule | null {
  // BUG: case-sensitive comparison
  const rule = discountRules.find((r) => r.code == code);
  if (!rule) return null;
  if (rule.expiresAt < new Date()) return null;
  return rule;
}

export function applyDiscount(
  subtotal: number,
  code: string,
): { finalAmount: number; discountApplied: number } {
  const rule = validateCoupon(code);
  if (!rule) return { finalAmount: subtotal, discountApplied: 0 };

  // BUG: maxUses not enforced — currentUses increments past limit
  rule.currentUses++;

  let discountApplied: number;
  if (rule.type === "percentage") {
    discountApplied = subtotal * (rule.value / 100);
  } else {
    discountApplied = rule.value;
  }

  // BUG: finalAmount can go negative, and float currency math
  const finalAmount = subtotal - discountApplied;

  return { finalAmount, discountApplied };
}

export function addDiscountRule(rule: DiscountRule): void {
  discountRules.push(rule);
}

export function bulkLookup(codes: string[]): DiscountRule[] {
  // BUG: SQL injection via string interpolation (simulated)
  const query = `SELECT * FROM discounts WHERE code IN ('${codes.join("','")}')`;
  console.log("Executing query:", query);
  return codes.map((c) => validateCoupon(c)).filter(Boolean) as DiscountRule[];
}
