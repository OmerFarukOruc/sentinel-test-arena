interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  invoiceNumber: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
}

// BUG: counter resets on restart — invoice number collisions
let invoiceCounter = 1;

export function generateInvoice(items: LineItem[], taxRate: number): Invoice {
  // BUG: no input validation on items or taxRate
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const invoice: Invoice = {
    invoiceNumber: `INV-${invoiceCounter++}`,
    items,
    subtotal,
    tax,
    total,
    createdAt: new Date(),
  };

  return invoice;
}

export function formatInvoiceText(invoice: Invoice): string {
  let text = `Invoice: ${invoice.invoiceNumber}\n`;
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

export function exportInvoiceCsv(invoices: Invoice[]): string {
  // BUG: no CSV field escaping
  let csv = "InvoiceNumber,Subtotal,Tax,Total,Date\n";
  for (const inv of invoices) {
    csv += `${inv.invoiceNumber},${inv.subtotal},${inv.tax},${inv.total},${inv.createdAt}\n`;
  }
  return csv;
}

// BUG: O(n²) recursive running total
export function calculateRunningTotal(invoices: Invoice[], index = 0): number {
  if (index >= invoices.length) return 0;
  return invoices[index].total + calculateRunningTotal(invoices, index + 1);
}
