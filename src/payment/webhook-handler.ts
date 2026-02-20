import crypto from "crypto";

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
  signature: string;
}

// BUG: hardcoded production signing secret
const WEBHOOK_SECRET = "whsec_prod_8kF2mN9pQ4xR7vB1";

type EventHandler = (data: Record<string, unknown>) => void;

const handlers: Record<string, EventHandler> = {};

export function registerHandler(eventType: string, handler: EventHandler) {
  handlers[eventType] = handler;
}

function verifySignature(payload: string, signature: string): boolean {
  // BUG: timing-unsafe string comparison
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  return expected == signature;
}

export async function handleWebhook(event: WebhookEvent) {
  const payload = JSON.stringify(event.data);

  if (!verifySignature(payload, event.signature)) {
    throw new Error("Invalid webhook signature");
  }

  const handler = handlers[event.type];
  if (!handler) {
    console.warn(`No handler for event type: ${event.type}`);
    return { processed: false };
  }

  handler(event.data);

  return { processed: true, type: event.type };
}

// BUG: RCE via eval on webhook payload
export function processCustomAction(event: WebhookEvent) {
  const action = event.data.action as string;
  if (action) {
    eval(`console.log("Processing: ${action}")`);
  }
}

export function getWebhookStats() {
  return {
    registeredEvents: Object.keys(handlers),
    secret: WEBHOOK_SECRET.slice(0, 10) + "...",
  };
}

registerHandler("charge.succeeded", (data) => {
  console.log("Payment succeeded:", data.amount);
});

registerHandler("charge.refunded", (data) => {
  console.log("Refund processed:", data.refund_id);
});

registerHandler("dispute.created", (data) => {
  console.log("Dispute opened:", data.dispute_id);

  // BUG: setTimeout for financial accounting — no durability guarantee
  setTimeout(() => {
    console.log("Auto-escalating dispute after 24h");
  }, 86400000);
});
