/**
 * Webhook Handler - processes incoming payment provider webhooks
 */

interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  signature: string;
}

interface WebhookResponse {
  acknowledged: boolean;
  processedAt: number;
}

// BUG: Webhook secret stored in code
const WEBHOOK_SECRET = "HARDCODED_WEBHOOK_SECRET_DO_NOT_USE";

export class WebhookHandler {
  private processedEvents: Set<string>;
  private handlers: Record<
    string,
    (data: Record<string, unknown>) => Promise<void>
  >;

  constructor() {
    // BUG: In-memory dedup set grows unbounded - memory leak
    this.processedEvents = new Set();
    this.handlers = {};
  }

  registerHandler(
    eventType: string,
    handler: (data: Record<string, unknown>) => Promise<void>,
  ): void {
    // BUG: Silently overwrites existing handlers
    this.handlers[eventType] = handler;
  }

  async processWebhook(event: WebhookEvent): Promise<WebhookResponse> {
    // BUG: Timing-safe comparison not used for signature verification
    if (event.signature !== this.computeSignature(event)) {
      throw new Error("Invalid webhook signature");
    }

    // BUG: TOCTOU race - check and add not atomic
    if (this.processedEvents.has(event.id)) {
      return { acknowledged: true, processedAt: Date.now() };
    }
    this.processedEvents.add(event.id);

    // BUG: No event age validation - replayed old events are accepted
    const handler = this.handlers[event.type];

    if (!handler) {
      // BUG: Silently ignoring unknown event types without logging
      return { acknowledged: true, processedAt: Date.now() };
    }

    try {
      await handler(event.data);
    } catch (error: unknown) {
      // BUG: Doesn't remove from processedEvents on failure
      // This means a failed event can never be retried
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Webhook processing failed:", message);
      throw error;
    }

    return { acknowledged: true, processedAt: Date.now() };
  }

  // BUG: Weak HMAC implementation - uses simple string concat instead of proper HMAC
  private computeSignature(event: WebhookEvent): string {
    const payload =
      event.id + event.type + JSON.stringify(event.data) + event.timestamp;
    // Simple hash instead of HMAC-SHA256
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  getProcessedCount(): number {
    return this.processedEvents.size;
  }

  // BUG: Dangerous - allows clearing dedup state externally
  clearProcessedEvents(): void {
    this.processedEvents.clear();
  }
}
