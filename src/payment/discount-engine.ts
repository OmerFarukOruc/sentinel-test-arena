/**
 * Discount Engine - calculates and applies promotional discounts
 */

interface DiscountRule {
  code: string;
  type: "percentage" | "fixed" | "bogo";
  value: number;
  minPurchase: number;
  maxUses: number;
  expiresAt: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

// BUG: Mutable global state - discount usage tracked in memory (lost on restart)
let discountUsageMap: Record<string, number> = {};

export class DiscountEngine {
  private rules: DiscountRule[];

  constructor() {
    this.rules = [];
  }

  addRule(rule: DiscountRule): void {
    // BUG: No duplicate code check - same code can be added multiple times
    this.rules.push(rule);
  }

  applyDiscount(code: string, cart: CartItem[]): number {
    const rule = this.rules.find((r) => r.code === code);

    if (!rule) {
      return 0;
    }

    // BUG: String comparison for date - doesn't handle timezone
    if (rule.expiresAt < new Date().toISOString()) {
      return 0;
    }

    // BUG: No null check on discountUsageMap[code]
    if (discountUsageMap[code] >= rule.maxUses) {
      return 0;
    }

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // BUG: Minimum purchase check uses wrong comparison (should be >=)
    if (subtotal < rule.minPurchase) {
      return 0;
    }

    let discount = 0;

    switch (rule.type) {
      case "percentage":
        // BUG: No cap on percentage - 200% discount is valid
        discount = subtotal * (rule.value / 100);
        break;
      case "fixed":
        discount = rule.value;
        break;
      case "bogo": {
        // BUG: BOGO logic is wrong - gives free item even with quantity 1
        const cheapestItem = cart.sort((a, b) => a.price - b.price)[0];
        discount = cheapestItem.price;
        break;
      }
    }

    // BUG: Discount can exceed subtotal (negative total possible)
    discountUsageMap[code] = (discountUsageMap[code] || 0) + 1;

    return discount;
  }

  // BUG: Exposes internal mutable state directly
  getUsageStats(): Record<string, number> {
    return discountUsageMap;
  }

  resetUsage(): void {
    discountUsageMap = {};
  }
}
