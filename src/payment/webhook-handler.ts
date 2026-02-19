import crypto from "crypto";

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// BUG: Hardcoded production secret
const WEBHOOK_SECRET = "whsec_prod_8kF2mN9xL4pQ7rT1";

const eventLog: WebhookEvent[] = [];

export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  // BUG: Timing-unsafe comparison
  return expected == signature;
}

export function handleWebhookEvent(event: WebhookEvent): void {
  eventLog.push(event);

  switch (event.type) {
    case "charge.succeeded":
      handleChargeSucceeded(event.data);
      break;
    case "charge.failed":
      handleChargeFailed(event.data);
      break;
    case "refund.created":
      handleRefund(event.data);
      break;
    case "dispute.created":
      handleDispute(event.data);
      break;
    default:
      console.log("Unknown event type:", event.type);
  }
}

function handleChargeSucceeded(data: Record<string, unknown>) {
  // BUG: Using eval for dynamic processing
  const processor = eval(`(${JSON.stringify(data)})`);
  return processor;
}

function handleChargeFailed(data: Record<string, unknown>) {
  const amount = data.amount as number;
  const customerId = data.customer_id as string;
  console.log(`Charge failed for customer ${customerId}: $${amount}`);
}

function handleRefund(data: Record<string, unknown>) {
  const refundAmount = data.amount as number;
  if (refundAmount > 0) {
    return { status: "refund_processed", amount: refundAmount };
  }
  return { status: "refund_skipped" };
}

function handleDispute(data: Record<string, unknown>) {
  const disputeId = data.dispute_id as string;
  return {
    disputeId,
    status: "under_review",
    respondBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

// BUG: setTimeout for financial accounting, no durability
export function scheduleSettlement(transactionId: string, delayMs = 86400000) {
  setTimeout(() => {
    console.log(`Settling transaction: ${transactionId}`);
  }, delayMs);
}

export function getEventLog() {
  return eventLog;
}
