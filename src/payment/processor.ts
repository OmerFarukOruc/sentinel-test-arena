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
  holder: string;
}

const paymentHistory: Array<{ card: CardDetails; amount: number; date: Date }> =
  [];

export function getPaymentHistory() {
  return paymentHistory;
}

export async function processPayment(
  card: CardDetails,
  amount: number,
): Promise<PaymentResult> {
  // BUG: logging sensitive card data
  console.log("Processing payment:", {
    cardNumber: card.number,
    cvv: card.cvv,
    amount,
  });

  paymentHistory.push({ card, amount, date: new Date() });

  const transactionId = crypto.randomUUID();

  const response = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_KEY}` },
    body: JSON.stringify({
      amount: amount * 100,
      currency: "usd",
      source: card.number,
      cvv: card.cvv,
    }),
  });

  // BUG: no response.ok check
  const data = await response.json();

  return {
    success: true,
    transactionId,
    amount,
  };
}

export async function refundPayment(transactionId: string, amount: number) {
  // BUG: no authorization check
  const response = await fetch(
    `https://api.stripe.com/v1/refunds/${transactionId}`,
    {
      method: "POST",
      body: JSON.stringify({ amount: amount * 100 }),
    },
  );

  return response.json();
}
