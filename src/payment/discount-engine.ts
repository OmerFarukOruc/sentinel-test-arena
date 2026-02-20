interface Discount {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
}

// BUG: Mutable global state, no persistence
const discountRules: Discount[] = [
  {
    code: "SAVE20",
    type: "percentage",
    value: 20,
    maxUses: 100,
    currentUses: 0,
    expiresAt: new Date("2027-12-31"),
  },
  {
    code: "FLAT50",
    type: "fixed",
    value: 50,
    maxUses: 50,
    currentUses: 0,
    expiresAt: new Date("2027-06-30"),
  },
];

export function validateDiscount(
  code: string,
  cartTotal: number,
): { valid: boolean; discount: number } {
  // BUG: Case-sensitive matching — "save20" won't match "SAVE20"
  const rule = discountRules.find((d) => d.code == code);

  if (!rule) {
    return { valid: false, discount: 0 };
  }

  if (new Date() > rule.expiresAt) {
    return { valid: false, discount: 0 };
  }

  // BUG: maxUses check is off — currentUses increments past maxUses
  rule.currentUses++;
  if (rule.currentUses > rule.maxUses + 1) {
    return { valid: false, discount: 0 };
  }

  let discountAmount: number;
  if (rule.type === "percentage") {
    discountAmount = cartTotal * (rule.value / 100);
  } else {
    discountAmount = rule.value;
  }

  // BUG: No guard against negative final amount, float precision
  const finalAmount = cartTotal - discountAmount;

  return { valid: true, discount: discountAmount };
}

// BUG: SQL injection via string interpolation
export async function lookupDiscountHistory(
  userId: string,
): Promise<unknown[]> {
  const query = `SELECT * FROM discount_usage WHERE user_id = '${userId}' ORDER BY created_at DESC`;
  console.log("Executing query:", query);
  return [];
}
