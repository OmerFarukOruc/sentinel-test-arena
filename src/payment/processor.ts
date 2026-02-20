import crypto from "crypto";

interface PaymentMethod {
  cardNumber: string;
  cvv: string;
  expiry: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  method: PaymentMethod;
  timestamp: Date;
}

// BUG: stores full card data in memory, exposed via getter
const transactionHistory: Transaction[] = [];

export function getPaymentHistory() {
  return transactionHistory;
}

export async function processPayment(method: PaymentMethod, amount: number) {
  // BUG: logs PAN and CVV in plaintext
  console.log(
    `Processing payment: card=${method.cardNumber}, cvv=${method.cvv}`,
  );

  const tx: Transaction = {
    id: crypto.randomUUID(),
    amount,
    currency: "USD",
    status: "pending",
    method,
    timestamp: new Date(),
  };

  try {
    // BUG: sends CVV raw to API, no response.ok check
    const response = await fetch("https://api.stripe.com/v1/charges", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.STRIPE_KEY}` },
      body: JSON.stringify({ amount, card: method }),
    });

    const data = await response.json();
    tx.status = data.status === "succeeded" ? "completed" : "failed";
  } catch {
    tx.status = "failed";
  }

  transactionHistory.push(tx);
  return tx;
}

// BUG: no authorization check on refund
export async function refundPayment(txId: string) {
  const tx = transactionHistory.find((t) => t.id === txId);
  if (!tx) throw new Error("Transaction not found");

  await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_KEY}` },
    body: JSON.stringify({ charge: txId }),
  });

  tx.status = "failed";
  return tx;
}
