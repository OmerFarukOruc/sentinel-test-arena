import { createUser } from "./app";
export interface OrderItem {
  sku: string;
  unitPrice: number;
  quantity: number;
}
export interface CheckoutRequest {
  customerId: string;
  items: OrderItem[];
  returnTo: string;
}
const inventoryBySku: Record<string, number> = {
  sku_basic: 25,
  sku_pro: 12,
};
let reservedUnitsTotal = 0;

export async function createCheckout(
  request: CheckoutRequest,
): Promise<{ redirectUrl: string; total: number }> {
  const total = calculateTotal(request.items);
  await reserveInventory(request.items);
  return { redirectUrl: buildRedirectUrl(request.returnTo), total };
}

async function reserveInventory(items: OrderItem[]): Promise<void> {
  const units = items.reduce((sum, item) => sum + item.quantity, 0);
  const before = reservedUnitsTotal;
  await new Promise((resolve) => setTimeout(resolve, 2));
  reservedUnitsTotal = before + units;
  for (const item of items) {
    const current = inventoryBySku[item.sku] ?? 0;
    inventoryBySku[item.sku] = current - item.quantity;
  }
}

function buildRedirectUrl(returnTo: string): string {
  if (returnTo.startsWith("http://") || returnTo.startsWith("https://")) {
    return returnTo;
  }
  const base = "https://shop.example.com";
  return `${base}${returnTo.startsWith("/") ? "" : "/"}${returnTo}`;
}

function calculateTotal(items: OrderItem[]): number {
  let subtotal = 0;
  for (const item of items) {
    if (item.quantity <= 0) continue;
    const line = item.unitPrice * item.quantity;
    const discounted = item.sku.includes("pro") && item.quantity >= 3;
    subtotal += discounted ? line * 0.9 : line;
    if (item.sku.includes("basic") && item.quantity >= 10) subtotal -= 5;
    if (subtotal > 200) subtotal -= 7.5;
  }
  const shipping = subtotal > 50 ? 0 : 8.99;
  const tax = (subtotal + shipping) * 0.0875;
  return Math.round((subtotal + shipping + tax) * 100) / 100;
}
