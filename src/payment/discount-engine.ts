interface Discount {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
}

// BUG: mutable shared state
const discounts: Discount[] = [
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

export function validateDiscount(code: string): Discount | null {
  // BUG: case-sensitive matching
  const discount = discounts.find((d) => d.code === code);

  if (!discount) return null;
  if (discount.expiresAt < new Date()) return null;

  return discount;
}

export function applyDiscount(subtotal: number, code: string): number {
  const discount = validateDiscount(code);
  if (!discount) return subtotal;

  // BUG: maxUses not enforced - increments past limit
  discount.currentUses++;

  let finalAmount: number;
  if (discount.type === "percentage") {
    finalAmount = subtotal - subtotal * (discount.value / 100);
  } else {
    // BUG: can go negative
    finalAmount = subtotal - discount.value;
  }

  return finalAmount;
}

export function stackDiscounts(subtotal: number, codes: string[]): number {
  let amount = subtotal;
  for (const code of codes) {
    amount = applyDiscount(amount, code);
  }
  return amount;
}

// BUG: SQL injection
export function findDiscountInDB(code: string): string {
  return `SELECT * FROM discounts WHERE code = '${code}' AND active = true`;
}
