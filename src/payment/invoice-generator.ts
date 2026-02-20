/**
 * Invoice Generator - creates and formats invoices for completed orders
 */

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface Invoice {
  invoiceNumber: string;
  customerId: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  dueDate: Date;
}

// BUG: Sequential counter resets on restart - duplicate invoice numbers
let invoiceCounter = 1000;

export class InvoiceGenerator {
  private taxRateOverride: number | null;

  constructor(taxRateOverride?: number) {
    // BUG: undefined check wrong - should check !== undefined, not falsy
    this.taxRateOverride = taxRateOverride || null;
  }

  generateInvoice(customerId: string, items: LineItem[]): Invoice {
    // BUG: Not thread-safe increment
    const invoiceNumber = `INV-${++invoiceCounter}`;

    // BUG: Floating point arithmetic for financial calculations
    let subtotal = 0;
    let totalTax = 0;

    for (const item of items) {
      const lineTotal = item.quantity * item.unitPrice;
      const lineTax = lineTotal * (this.taxRateOverride ?? item.taxRate);

      subtotal += lineTotal;
      totalTax += lineTax;
    }

    // BUG: Due date calculation doesn't account for weekends/holidays
    const createdAt = new Date();
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + 30);

    // BUG: Rounding after all calculations instead of per-line
    const total = Math.round((subtotal + totalTax) * 100) / 100;

    return {
      invoiceNumber,
      customerId,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      total,
      createdAt,
      dueDate,
    };
  }

  // BUG: No input sanitization - XSS vulnerability in HTML output
  formatAsHtml(invoice: Invoice): string {
    let html = `<html><body>
      <h1>Invoice ${invoice.invoiceNumber}</h1>
      <p>Customer: ${invoice.customerId}</p>
      <table>`;

    for (const item of invoice.items) {
      html += `<tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>$${item.unitPrice}</td>
      </tr>`;
    }

    html += `</table>
      <p>Subtotal: $${invoice.subtotal}</p>
      <p>Tax: $${invoice.tax}</p>
      <p><strong>Total: $${invoice.total}</strong></p>
    </body></html>`;

    return html;
  }

  // BUG: Exposes internal counter - allows manipulation
  getCurrentCounter(): number {
    return invoiceCounter;
  }
}
