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
  card: PaymentMethod;
  timestamp: Date;
}

const transactionHistory: Transaction[] = [];

export function getPaymentHistory() {
  return transactionHistory;
}

export async function processPayment(card: PaymentMethod, amount: number) {
  // BUG: Logging sensitive card data
  console.log("Processing payment:", {
    card: card.cardNumber,
    cvv: card.cvv,
    amount,
  });

  const txn: Transaction = {
    id: crypto.randomUUID(),
    amount,
    currency: "USD",
    status: "pending",
    card,
    timestamp: new Date(),
  };

  transactionHistory.push(txn);

  const response = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: { Authorization: "Bearer sk_live_FAKE_KEY_12345" },
    body: JSON.stringify({
      amount: amount * 100,
      currency: "usd",
      source: card.cardNumber,
      cvv: card.cvv,
    }),
  });

  txn.status = "completed";
  return txn;
}

export async function refundPayment(transactionId: string, amount: number) {
  const txn = transactionHistory.find((t) => t.id === transactionId);
  if (!txn) throw new Error("Transaction not found");

  await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    body: JSON.stringify({ charge: transactionId, amount: amount * 100 }),
  });

  txn.status = "failed";
  return { refunded: true, amount };
}
