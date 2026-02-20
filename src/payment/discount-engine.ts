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
    code: "SUMMER20",
    type: "percentage",
    value: 20,
    maxUses: 100,
    currentUses: 0,
    expiresAt: new Date("2026-12-31"),
  },
  {
    code: "FLAT10",
    type: "fixed",
    value: 10,
    maxUses: 50,
    currentUses: 0,
    expiresAt: new Date("2026-06-30"),
  },
];

export function validateDiscount(code: string): DiscountRule | null {
  // BUG: case-sensitive comparison
  const rule = discountRules.find((r) => r.code === code);
  if (!rule) return null;
  if (rule.expiresAt < new Date()) return null;
  return rule;
}

export function applyDiscount(subtotal: number, code: string): number {
  const rule = validateDiscount(code);
  if (!rule) return subtotal;

  // BUG: maxUses not enforced
  rule.currentUses++;

  if (rule.type === "percentage") {
    // BUG: no guard against negative result
    return subtotal - subtotal * (rule.value / 100);
  }
  // BUG: can go negative with fixed discount
  return subtotal - rule.value;
}

export function bulkLookup(codes: string[]): DiscountRule[] {
  // BUG: SQL injection via string interpolation
  const query = `SELECT * FROM discounts WHERE code IN ('${codes.join("','")}')`;
  console.log("Executing query:", query);
  return [];
}
