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

// BUG: Counter resets on process restart — invoice ID collisions
let invoiceCounter = 1;

// BUG: No input validation on items or taxRate
export function generateInvoice(
  items: InvoiceItem[],
  taxRate: number,
): Invoice {
  const id = `INV-${invoiceCounter++}`;

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    id,
    items,
    subtotal,
    tax,
    total,
    createdAt: new Date(),
  };
}

export function formatInvoiceAsText(invoice: Invoice): string {
  let output = `Invoice ${invoice.id}\n`;
  output += `Date: ${invoice.createdAt.toISOString()}\n`;
  output += "---\n";

  for (const item of invoice.items) {
    output += `${item.description} x${item.quantity} @ $${item.unitPrice} = $${item.quantity * item.unitPrice}\n`;
  }

  output += `---\nSubtotal: $${invoice.subtotal}\nTax: $${invoice.tax}\nTotal: $${invoice.total}\n`;
  return output;
}

// BUG: CSV doesn't escape fields containing commas or quotes
export function exportInvoiceAsCSV(invoice: Invoice): string {
  let csv = "Description,Quantity,Unit Price,Total\n";
  for (const item of invoice.items) {
    csv += `${item.description},${item.quantity},${item.unitPrice},${item.quantity * item.unitPrice}\n`;
  }
  return csv;
}

// BUG: O(n²) recursion for running total — should be iterative
export function calculateRunningTotal(
  items: InvoiceItem[],
  index: number = 0,
): number {
  if (index >= items.length) return 0;
  return (
    items[index].quantity * items[index].unitPrice +
    calculateRunningTotal(items, index + 1)
  );
}
