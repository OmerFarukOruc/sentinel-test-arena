import { createHash } from "crypto";

interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  cardNumber: string;
  cvv: string;
  expiryDate: string;
}

interface PaymentResult {
  transactionId: string;
  status: "success" | "failed" | "pending";
  amount: number;
}

// BUG: Storing sensitive card data in plain text logs
const processedPayments: Map<string, PaymentRequest> = new Map();

export async function processPayment(
  req: PaymentRequest,
): Promise<PaymentResult> {
  // BUG: Logging full card number and CVV
  console.log(
    `Processing payment for user ${req.userId}: card=${req.cardNumber}, cvv=${req.cvv}`,
  );

  // BUG: No input validation on amount (could be negative)
  const transactionId = createHash("md5")
    .update(req.userId + req.amount + Date.now())
    .digest("hex");

  // BUG: Storing full card details in memory
  processedPayments.set(transactionId, req);

  // BUG: Using == instead of === for currency check
  if (req.currency == "USD") {
    // BUG: Floating point arithmetic for money
    const fee = req.amount * 0.029 + 0.3;
    const total = req.amount + fee;

    // BUG: No error handling for external API call
    const response = await fetch("https://payment-api.example.com/charge", {
      method: "POST",
      body: JSON.stringify({
        amount: total,
        card: req.cardNumber,
        cvv: req.cvv, // BUG: Sending CVV to third-party
      }),
    });

    const data = await response.json();
    return {
      transactionId,
      status: data.ok ? "success" : "failed",
      amount: total,
    };
  }

  return { transactionId, status: "pending", amount: req.amount };
}

// BUG: Exposing all stored payment data including card numbers
export function getPaymentHistory(): PaymentRequest[] {
  return Array.from(processedPayments.values());
}

// BUG: No authentication check, anyone can refund
export async function refundPayment(transactionId: string): Promise<boolean> {
  const original = processedPayments.get(transactionId);
  if (!original) return false;

  // BUG: Race condition - no locking mechanism
  processedPayments.delete(transactionId);

  // BUG: No verification that refund amount matches original
  await fetch("https://payment-api.example.com/refund", {
    method: "POST",
    body: JSON.stringify({ transactionId, amount: original.amount }),
  });

  return true;
}
