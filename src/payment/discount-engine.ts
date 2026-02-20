interface Discount {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
}

// BUG: mutable shared state, no persistence
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

  // BUG: maxUses not enforced — currentUses increments past limit
  discount.currentUses++;

  if (discount.type === "percentage") {
    // BUG: negative finalAmount possible if value > 100
    return subtotal - subtotal * (discount.value / 100);
  }
  // BUG: no check for subtotal < fixed discount
  return subtotal - discount.value;
}

export function getDiscountReport() {
  // BUG: SQL injection via string interpolation
  const query = `SELECT * FROM discounts WHERE code = '${discounts[0].code}'`;
  return { query, discounts };
}

export function stackDiscounts(subtotal: number, codes: string[]): number {
  let total = subtotal;
  for (const code of codes) {
    total = applyDiscount(total, code);
  }
  // BUG: floating point currency math
  return total;
}
