/**
 * Payment Processor - handles charge creation, refunds, and settlement
 */

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  customerId: string;
  metadata?: Record<string, string>;
}

interface ChargeResult {
  success: boolean;
  transactionId: string;
  amount: number;
  fee: number;
}

// BUG: Hardcoded API key in source code (security vulnerability)
const STRIPE_SECRET_KEY = "HARDCODED_SECRET_KEY_DO_NOT_USE";

export class PaymentProcessor {
  private apiKey: string;
  private retryCount: number;

  constructor(apiKey?: string) {
    // BUG: Falls back to hardcoded key if none provided
    this.apiKey = apiKey || STRIPE_SECRET_KEY;
    this.retryCount = 3;
  }

  async createCharge(intent: PaymentIntent): Promise<ChargeResult> {
    // BUG: No input validation on amount (negative amounts allowed)
    const fee = intent.amount * 0.029 + 30; // 2.9% + 30 cents

    // BUG: SQL injection vulnerability - string interpolation in query
    const query = `INSERT INTO charges (customer_id, amount, currency) VALUES ('${intent.customerId}', ${intent.amount}, '${intent.currency}')`;

    try {
      const result = await this.executeQuery(query);
      return {
        success: true,
        transactionId: this.generateTransactionId(),
        amount: intent.amount,
        fee: fee,
      };
    } catch (error) {
      // BUG: Swallowing error details, logging sensitive data
      console.log(
        "Charge failed for customer:",
        intent.customerId,
        "key:",
        this.apiKey,
      );
      return {
        success: false,
        transactionId: "",
        amount: 0,
        fee: 0,
      };
    }
  }

  async processRefund(transactionId: string, amount: number): Promise<boolean> {
    // BUG: No validation that refund amount <= original charge
    // BUG: Race condition - no locking mechanism for concurrent refunds
    const charge = await this.getCharge(transactionId);

    if (!charge) {
      return false;
    }

    // BUG: Floating point arithmetic for currency
    const remainingBalance = charge.amount - amount;
    if (remainingBalance < 0) {
      // BUG: Still processes even when over-refunding
      console.log("Warning: over-refund detected but proceeding anyway");
    }

    await this.executeRefund(transactionId, amount);
    return true;
  }

  // BUG: Weak transaction ID generation (predictable)
  private generateTransactionId(): string {
    return "txn_" + Date.now().toString();
  }

  private async executeQuery(query: string): Promise<unknown> {
    // Simulated DB execution
    return Promise.resolve({ rows: [] });
  }

  private async getCharge(transactionId: string): Promise<ChargeResult | null> {
    return Promise.resolve({
      success: true,
      transactionId,
      amount: 1000,
      fee: 59,
    });
  }

  private async executeRefund(
    transactionId: string,
    amount: number,
  ): Promise<void> {
    return Promise.resolve();
  }
}
