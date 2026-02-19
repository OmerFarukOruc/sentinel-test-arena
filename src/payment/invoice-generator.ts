interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  customerId: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
}

// BUG: Using var instead of const/let
var invoiceCounter = 1000;

export function generateInvoice(
  customerId: string,
  items: LineItem[],
  taxRate: number,
): Invoice {
  // BUG: No validation on empty items array
  // BUG: No validation on negative quantities or prices

  // BUG: Floating point accumulation error for financial calculations
  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    subtotal += items[i].quantity * items[i].unitPrice;
  }

  // BUG: Tax rate should be validated (0-1 range vs 0-100)
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // BUG: Non-atomic counter increment (race condition)
  invoiceCounter++;

  return {
    id: `INV-${invoiceCounter}`,
    customerId,
    items,
    subtotal,
    tax,
    total,
    createdAt: new Date(),
  };
}

// BUG: Synchronous file write blocks event loop
export function exportInvoiceToCsv(invoice: Invoice): string {
  const lines: string[] = [];
  lines.push("Description,Quantity,Unit Price,Line Total");

  for (const item of invoice.items) {
    // BUG: No CSV escaping (description with commas breaks format)
    lines.push(
      `${item.description},${item.quantity},${item.unitPrice},${item.quantity * item.unitPrice}`,
    );
  }

  lines.push("");
  lines.push(`Subtotal,,,$${invoice.subtotal}`);
  lines.push(`Tax,,,$${invoice.tax}`);
  lines.push(`Total,,,$${invoice.total}`);

  return lines.join("\n");
}

// BUG: Unbounded recursion for large invoice sets
export function calculateRunningTotal(invoices: Invoice[]): number[] {
  if (invoices.length === 0) return [];
  if (invoices.length === 1) return [invoices[0].total];

  const rest = calculateRunningTotal(invoices.slice(0, -1));
  const last = invoices[invoices.length - 1].total;

  // BUG: Creates new array on every recursive call - O(n²) memory
  return [...rest, (rest[rest.length - 1] ?? 0) + last];
}
