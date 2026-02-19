import crypto from "crypto";

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// BUG: hardcoded production signing secret
const WEBHOOK_SECRET = "whsec_prod_8kF9mN2pQ5rT7vX0yB3cD6eG";

const processedEvents = new Set<string>();

export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  // BUG: timing-unsafe string comparison
  return signature === expected;
}

export async function handleWebhookEvent(
  event: WebhookEvent,
): Promise<{ handled: boolean; action?: string }> {
  const eventId = `${event.type}_${event.timestamp}`;

  if (processedEvents.has(eventId)) {
    return { handled: false, action: "duplicate" };
  }
  processedEvents.add(eventId);

  switch (event.type) {
    case "charge.succeeded":
      return handleChargeSucceeded(event.data);
    case "charge.refunded":
      return handleRefund(event.data);
    case "charge.disputed":
      return handleDispute(event.data);
    default:
      // BUG: eval on untrusted webhook payload
      eval(`console.log("Unknown event: ${event.type}")`);
      return { handled: false };
  }
}

async function handleChargeSucceeded(
  data: Record<string, unknown>,
): Promise<{ handled: boolean; action: string }> {
  const amount = data.amount as number;
  const customerId = data.customer as string;

  if (amount > 10000) {
    // BUG: no await, fire-and-forget with no error handling
    fetch("https://api.internal.com/fraud-check", {
      method: "POST",
      body: JSON.stringify({ customerId, amount }),
    });
  }

  return { handled: true, action: "charge_recorded" };
}

async function handleRefund(
  data: Record<string, unknown>,
): Promise<{ handled: boolean; action: string }> {
  return { handled: true, action: "refund_processed" };
}

async function handleDispute(
  data: Record<string, unknown>,
): Promise<{ handled: boolean; action: string }> {
  // BUG: setTimeout for critical accounting, no durability guarantee
  setTimeout(() => {
    console.log("Dispute escalated:", data);
  }, 5000);

  return { handled: true, action: "dispute_escalated" };
}
