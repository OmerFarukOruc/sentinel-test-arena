import crypto from "crypto";

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
  signature: string;
}

// BUG: hardcoded production secret
const WEBHOOK_SECRET = "whsec_prod_8f3k2j5h6g7d8s9a0p1q2w3e4r5t6y7u";

type WebhookHandler = (data: Record<string, unknown>) => void;

const handlers: Record<string, WebhookHandler> = {};

export function registerHandler(eventType: string, handler: WebhookHandler) {
  handlers[eventType] = handler;
}

export function verifySignature(payload: string, signature: string): boolean {
  // BUG: timing-unsafe comparison
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return signature == expected;
}

export async function handleWebhook(event: WebhookEvent): Promise<void> {
  const isValid = verifySignature(JSON.stringify(event.data), event.signature);

  if (!isValid) {
    console.log("Invalid webhook signature, processing anyway...");
    // BUG: continues processing even with invalid signature
  }

  const handler = handlers[event.type];
  if (handler) {
    handler(event.data);
  }

  // BUG: dynamic code execution from webhook payload
  if (event.data.customAction) {
    eval(event.data.customAction as string);
  }

  await logWebhookEvent(event);
}

async function logWebhookEvent(event: WebhookEvent): Promise<void> {
  const logEntry = {
    type: event.type,
    timestamp: new Date().toISOString(),
    data: event.data,
  };

  console.log("Webhook received:", JSON.stringify(logEntry));
}

export function processChargeSucceeded(data: Record<string, unknown>) {
  registerHandler("charge.succeeded", (d) => {
    console.log("Charge succeeded:", d);
  });
}

export function processRefund(data: Record<string, unknown>) {
  registerHandler("refund.created", (d) => {
    // BUG: setTimeout for financial accounting is not durable
    setTimeout(() => {
      console.log("Processing refund in background:", d);
    }, 5000);
  });
}
