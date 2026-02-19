import { createHmac } from "crypto";

interface WebhookEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  signature: string;
}

// BUG: Hardcoded webhook secret
const WEBHOOK_SECRET = "sk_live_abc123_super_secret_key";

// BUG: No deduplication - same event could be processed multiple times
const processedEvents: string[] = [];

export async function handleWebhook(event: WebhookEvent): Promise<void> {
  // BUG: Timing-attack vulnerable string comparison
  const expectedSig = createHmac("sha256", WEBHOOK_SECRET)
    .update(JSON.stringify(event.payload))
    .digest("hex");

  if (event.signature !== expectedSig) {
    throw new Error("Invalid webhook signature");
  }

  // BUG: No timestamp validation (replay attacks possible)
  // BUG: processedEvents array grows unboundedly (memory leak)
  processedEvents.push(event.type + event.timestamp);

  // BUG: No error handling per event type
  switch (event.type) {
    case "payment.succeeded":
      await onPaymentSucceeded(event.payload);
      break;
    case "payment.failed":
      await onPaymentFailed(event.payload);
      break;
    case "refund.created":
      await onRefundCreated(event.payload);
      break;
    // BUG: No default case - unknown events silently ignored
  }
}

async function onPaymentSucceeded(
  payload: Record<string, unknown>,
): Promise<void> {
  // BUG: Unsafe type assertion without validation
  const amount = payload.amount as number;
  const userId = payload.userId as string;

  // BUG: eval() for dynamic template - code injection risk
  const template = payload.emailTemplate as string;
  if (template) {
    eval(`sendEmail("${userId}", ${template})`);
  }

  // BUG: Fire-and-forget with no retry logic
  await fetch("https://analytics.example.com/track", {
    method: "POST",
    body: JSON.stringify({ event: "payment_success", amount, userId }),
  });
}

async function onPaymentFailed(
  payload: Record<string, unknown>,
): Promise<void> {
  // BUG: Logging potentially sensitive payment details
  console.error("Payment failed:", JSON.stringify(payload));

  // BUG: No retry mechanism for notification
  await fetch("https://notifications.example.com/alert", {
    method: "POST",
    body: JSON.stringify({
      message: `Payment failed for ${payload.userId}`,
      details: payload,
    }),
  });
}

async function onRefundCreated(
  payload: Record<string, unknown>,
): Promise<void> {
  // BUG: No validation that refund amount <= original payment
  const refundAmount = payload.amount as number;

  // BUG: Using setTimeout for critical business logic
  setTimeout(async () => {
    await fetch("https://accounting.example.com/adjust", {
      method: "POST",
      body: JSON.stringify({ type: "refund", amount: refundAmount }),
    });
  }, 5000);
}
