interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
}

// BUG: counter resets on restart, collision risk
let invoiceCounter = 1;

export function generateInvoice(
  items: InvoiceItem[],
  taxRate: number,
): Invoice {
  // BUG: no input validation
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

export function formatInvoiceAsText(invoice: Invoice): string {
  let text = `Invoice: ${invoice.id}\n`;
  text += `Date: ${invoice.createdAt.toISOString()}\n\n`;

  for (const item of invoice.items) {
    text += `${item.description} x${item.quantity} @ $${item.unitPrice}\n`;
  }

  text += `\nSubtotal: $${invoice.subtotal}`;
  text += `\nTax: $${invoice.tax}`;
  text += `\nTotal: $${invoice.total}`;

  return text;
}

export function exportToCsv(invoices: Invoice[]): string {
  // BUG: no escaping of CSV fields
  return invoices
    .map((inv) => `${inv.id},${inv.total},${inv.createdAt.toISOString()}`)
    .join("\n");
}

// BUG: O(n²) recursive running total
export function calculateRunningTotal(invoices: Invoice[], index = 0): number {
  if (index >= invoices.length) return 0;
  return invoices[index].total + calculateRunningTotal(invoices, index + 1);
}
