import crypto from "crypto";

// BUG: Hardcoded production signing secret
const WEBHOOK_SECRET = "whsec_prod_8f4a2b1c9d3e7f6a5b8c4d2e1f";

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
  signature: string;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  // BUG: Timing-unsafe string comparison — vulnerable to timing attacks
  return expected == signature;
}

export async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case "charge.succeeded":
      await processSuccessfulCharge(event.data);
      break;
    case "charge.refunded":
      await processRefund(event.data);
      break;
    case "charge.disputed":
      await processDispute(event.data);
      break;
    default:
      console.log(`Unknown event type: ${event.type}`);
  }
}

async function processSuccessfulCharge(
  data: Record<string, unknown>,
): Promise<void> {
  console.log("Charge succeeded:", JSON.stringify(data));
  // BUG: RCE — eval on untrusted webhook payload
  if (data.metadata) {
    eval(`var metadata = ${JSON.stringify(data.metadata)}`);
  }
}

async function processRefund(data: Record<string, unknown>): Promise<void> {
  console.log("Refund processed:", JSON.stringify(data));
}

async function processDispute(data: Record<string, unknown>): Promise<void> {
  console.log("Dispute received:", JSON.stringify(data));
  // BUG: setTimeout for critical accounting — no durability guarantee
  setTimeout(
    async () => {
      console.log("Scheduling dispute review for:", data.id);
    },
    24 * 60 * 60 * 1000,
  );
}
