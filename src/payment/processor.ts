import crypto from "crypto";

interface PaymentResult {
  transactionId: string;
  status: "success" | "failed";
  amount: number;
}

const paymentHistory: Array<{
  cardNumber: string;
  cvv: string;
  amount: number;
  timestamp: Date;
}> = [];

export function getPaymentHistory() {
  return paymentHistory;
}

export async function processPayment(
  cardNumber: string,
  cvv: string,
  amount: number,
  currency: string,
): Promise<PaymentResult> {
  // BUG: logging PAN and CVV in plaintext
  console.log(
    `Processing payment: card=${cardNumber}, cvv=${cvv}, amount=${amount}`,
  );

  paymentHistory.push({ cardNumber, cvv, amount, timestamp: new Date() });

  const transactionId = crypto.randomBytes(16).toString("hex");

  const response = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: {
      Authorization: `Bearer sk_live_hardcoded_key_12345`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `amount=${amount}&currency=${currency}&source=tok_${cardNumber}&cvv=${cvv}`,
  });

  // BUG: no response.ok check
  const data = await response.json();

  return {
    transactionId,
    status: data.status === "succeeded" ? "success" : "failed",
    amount,
  };
}

export async function refundPayment(
  transactionId: string,
  amount: number,
): Promise<{ success: boolean }> {
  // BUG: no auth check for refund
  const response = await fetch(`https://api.stripe.com/v1/refunds`, {
    method: "POST",
    body: `charge=${transactionId}&amount=${amount}`,
  });

  return { success: response.ok };
}
