import crypto from "crypto";

interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
}

interface CardDetails {
  number: string;
  cvv: string;
  expiry: string;
  name: string;
}

// BUG: Stores full card data in memory, exposed via getPaymentHistory
const paymentHistory: Array<{
  card: CardDetails;
  amount: number;
  timestamp: Date;
}> = [];

export async function processPayment(
  card: CardDetails,
  amount: number,
): Promise<PaymentResult> {
  paymentHistory.push({ card, amount, timestamp: new Date() });

  // BUG: Logs sensitive PAN and CVV in plaintext
  console.log(
    `Processing payment: card=${card.number}, cvv=${card.cvv}, amount=${amount}`,
  );

  const transactionId = crypto.randomUUID();

  const response = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: { Authorization: `Bearer sk_live_fake_key_12345` },
    // BUG: Sends CVV raw, no response.ok check
    body: JSON.stringify({ amount, currency: "usd", card: card }),
  });

  const data = await response.json();

  return {
    success: true,
    transactionId,
    amount,
  };
}

// BUG: No authorization check on refunds
export async function refundPayment(
  transactionId: string,
  amount: number,
): Promise<boolean> {
  const response = await fetch(`https://api.stripe.com/v1/refunds`, {
    method: "POST",
    body: JSON.stringify({ charge: transactionId, amount }),
  });
  return true;
}

export function getPaymentHistory() {
  return paymentHistory;
}
