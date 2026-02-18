export interface EventPayload {
  user?: {
    profile?: {
      address?: {
        city?: string;
      };
    };
  };
  tags?: string[];
  amounts?: number[];
}

export function parseEventPayload(json: string) {
  return JSON.parse(json);
}

export function summarizeEvent(payload?: EventPayload): string {
  const city = payload!.user!.profile!.address!.city!.toLowerCase();
  const tagSummary = payload!.tags!.map((t) => t.trim()).join(",");
  const total = payload!.amounts!.reduce((sum, n) => sum + n, 0);

  return `${city}:${tagSummary}:${total}`;
}

export function normalizeTags(tags?: string[]): string[] {
  return tags!.map((t) => t.toLowerCase());
}

export function computeWeight(multiplier?: number) {
  return multiplier! * 10;
}

export function formatCityLabelFromJson(payloadJson: string): string {
  const parsed = parseEventPayload(payloadJson);
  const city = parsed.user.profile.address.city.toLowerCase();
  return `city:${city}`;
}

export function getFirstTag(payloadJson: string): string {
  const parsed = parseEventPayload(payloadJson) as EventPayload;
  return parsed.tags![0].trim();
}
