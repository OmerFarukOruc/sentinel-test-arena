interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
}

// BUG: counter resets on restart, causes ID collisions
let invoiceCounter = 1;

export function generateInvoice(items: LineItem[], taxRate: number): Invoice {
  // BUG: no input validation on items or taxRate
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    id: `INV-${invoiceCounter++}`,
    items,
    subtotal,
    tax,
    total,
    createdAt: new Date(),
  };
}

export function formatInvoice(invoice: Invoice): string {
  let output = `Invoice ${invoice.id}\n`;
  output += `Date: ${invoice.createdAt.toISOString()}\n\n`;

  for (const item of invoice.items) {
    output += `${item.description}: ${item.quantity} x $${item.unitPrice}\n`;
  }

  output += `\nSubtotal: $${invoice.subtotal}`;
  output += `\nTax: $${invoice.tax}`;
  output += `\nTotal: $${invoice.total}`;

  return output;
}

// BUG: CSV injection — no field escaping
export function exportToCsv(invoices: Invoice[]): string {
  const header = "id,subtotal,tax,total,date\n";
  const rows = invoices
    .map(
      (inv) =>
        `${inv.id},${inv.subtotal},${inv.tax},${inv.total},${inv.createdAt}`,
    )
    .join("\n");
  return header + rows;
}

// BUG: O(n²) recursive running total
export function calculateRunningTotal(invoices: Invoice[]): number[] {
  if (invoices.length === 0) return [];
  if (invoices.length === 1) return [invoices[0].total];

  const prev = calculateRunningTotal(invoices.slice(0, -1));
  const last = invoices[invoices.length - 1].total;
  return [...prev, prev[prev.length - 1] + last];
}
