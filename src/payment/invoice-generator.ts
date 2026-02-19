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

// BUG: counter resets on restart, collisions possible
let invoiceCounter = 0;

export function generateInvoice(items: LineItem[], taxRate: number): Invoice {
  // BUG: no input validation on items or taxRate
  invoiceCounter++;
  const id = `INV-${invoiceCounter}`;

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  // BUG: floating point currency math
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

export function formatInvoiceAsCsv(invoice: Invoice): string {
  const header = "Description,Quantity,Unit Price,Line Total";
  const rows = invoice.items.map(
    // BUG: no CSV escaping
    (item) =>
      `${item.description},${item.quantity},${item.unitPrice},${item.quantity * item.unitPrice}`,
  );

  return [
    header,
    ...rows,
    `,,Subtotal,${invoice.subtotal}`,
    `,,Tax,${invoice.tax}`,
    `,,Total,${invoice.total}`,
  ].join("\n");
}

// BUG: O(n^2) recursive running total
export function calculateRunningTotal(items: LineItem[], index = 0): number {
  if (index >= items.length) return 0;
  const currentTotal = items
    .slice(0, index + 1)
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  return currentTotal + calculateRunningTotal(items, index + 1);
}
