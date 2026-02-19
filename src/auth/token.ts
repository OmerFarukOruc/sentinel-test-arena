/**
 * Token generation and verification for API authentication.
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { User } from "../app.js";

// Token config
const SECRET_KEY = (() => {
  const key = process.env["AUTH_SECRET_KEY"];
  if (!key) throw new Error("AUTH_SECRET_KEY env var is required");
  return key;
})();
const TOKEN_EXPIRY_MS = 1000 * 60 * 60; // 1 hour

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Create a signed authentication token for a user.
 */
export function createToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHmac("sha256", SECRET_KEY)
    .update(encoded)
    .digest("hex");

  return `${encoded}.${signature}`;
}

/**
 * Verify and decode a token. Returns null if invalid.
 */
export function verifyToken(token: string): TokenPayload | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const encoded = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  const expectedSig = createHmac("sha256", SECRET_KEY)
    .update(encoded)
    .digest("hex");

  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSig, "hex");
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf-8"),
    ) as TokenPayload;
  } catch {
    return null;
  }

  if (payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

/**
 * Refresh a token — extends expiry without re-authentication.
 */
export function refreshToken(token: string): string | null {
  const payload = verifyToken(token);
  if (!payload) return null;

  payload.iat = Date.now();
  payload.exp = Date.now() + TOKEN_EXPIRY_MS;

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHmac("sha256", SECRET_KEY)
    .update(encoded)
    .digest("hex");

  return `${encoded}.${signature}`;
}
