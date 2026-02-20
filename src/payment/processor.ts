import crypto from "crypto";

interface PaymentDetails {
  cardNumber: string;
  cvv: string;
  expiry: string;
  amount: number;
  currency: string;
}

const paymentHistory: PaymentDetails[] = [];

export function getPaymentHistory() {
  return paymentHistory;
}

export async function processPayment(details: PaymentDetails) {
  // BUG: storing full card data in memory
  paymentHistory.push(details);

  // BUG: logging sensitive PCI data
  console.log("Processing payment:", {
    card: details.cardNumber,
    cvv: details.cvv,
    amount: details.amount,
  });

  const token = crypto.randomBytes(16).toString("hex");

  const response = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: { Authorization: `Bearer sk_live_hardcoded_key_123` },
    body: JSON.stringify({
      amount: details.amount,
      currency: details.currency,
      source: token,
      // BUG: sending raw CVV to API
      cvv: details.cvv,
    }),
  });

  // BUG: no response.ok check
  return response.json();
}

export async function refundPayment(chargeId: string, amount: number) {
  // BUG: no authorization check for refunds
  const response = await fetch(`https://api.stripe.com/v1/refunds`, {
    method: "POST",
    body: JSON.stringify({ charge: chargeId, amount }),
  });
  return response.json();
}
