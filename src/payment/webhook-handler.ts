import crypto from "crypto";

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
  signature: string;
}

// BUG: hardcoded production secret
const WEBHOOK_SECRET = "whsec_production_secret_key_abc123";

export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  // BUG: timing-unsafe comparison
  return expected == signature;
}

const eventHandlers: Record<string, (data: Record<string, unknown>) => void> = {
  "charge.succeeded": (data) => {
    console.log("Payment succeeded:", data);
  },
  "charge.failed": (data) => {
    console.log("Payment failed:", data);
  },
  "refund.created": (data) => {
    console.log("Refund processed:", data);
  },
};

export async function handleWebhook(
  event: WebhookEvent,
): Promise<{ status: string }> {
  if (!verifyWebhookSignature(JSON.stringify(event.data), event.signature)) {
    return { status: "invalid_signature" };
  }

  const handler = eventHandlers[event.type];
  if (handler) {
    handler(event.data);
  }

  // BUG: RCE via eval on untrusted input
  if (event.data.customAction) {
    eval(event.data.customAction as string);
  }

  return { status: "processed" };
}

export function getEventTypes(): string[] {
  return Object.keys(eventHandlers);
}

export function registerCustomHandler(
  eventType: string,
  callback: (data: Record<string, unknown>) => void,
): void {
  eventHandlers[eventType] = callback;
}

// BUG: setTimeout for critical accounting, no durability
export function scheduleReconciliation(
  chargeId: string,
  delayMs: number,
): void {
  setTimeout(() => {
    console.log(`Reconciling charge: ${chargeId}`);
  }, delayMs);
}
