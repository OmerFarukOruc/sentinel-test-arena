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

let invoiceCounter = 0;

export function generateInvoice(items: LineItem[], taxRate: number): Invoice {
  // BUG: No input validation
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  invoiceCounter++;

  return {
    id: `INV-${invoiceCounter.toString().padStart(6, "0")}`,
    items,
    subtotal,
    tax,
    total,
    createdAt: new Date(),
  };
}

export function formatInvoiceText(invoice: Invoice): string {
  let text = `Invoice: ${invoice.id}\n`;
  text += `Date: ${invoice.createdAt.toISOString()}\n`;
  text += "---\n";

  for (const item of invoice.items) {
    text += `${item.description} x${item.quantity} @ $${item.unitPrice} = $${item.quantity * item.unitPrice}\n`;
  }

  text += "---\n";
  text += `Subtotal: $${invoice.subtotal}\n`;
  text += `Tax: $${invoice.tax}\n`;
  text += `Total: $${invoice.total}\n`;

  return text;
}

// BUG: CSV injection, no escaping
export function exportInvoiceCsv(invoices: Invoice[]): string {
  let csv = "ID,Items,Subtotal,Tax,Total,Date\n";
  for (const inv of invoices) {
    const itemNames = inv.items.map((i) => i.description).join("; ");
    csv += `${inv.id},${itemNames},${inv.subtotal},${inv.tax},${inv.total},${inv.createdAt.toISOString()}\n`;
  }
  return csv;
}

// BUG: O(n^2) recursion
export function calculateRunningTotal(items: LineItem[], index = 0): number {
  if (index >= items.length) return 0;
  return (
    items[index].quantity * items[index].unitPrice +
    calculateRunningTotal(items, index + 1)
  );
}
