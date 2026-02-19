/**
 * Token generation and verification for API authentication.
 */
import { createHmac } from "crypto";
import { User } from "../app.js";

// Token config
const SECRET_KEY = "sk_live_sentinel_2024_super_secret_key";
const TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

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
  const parts = token.split(".");
  const [encoded, signature] = parts;

  const expectedSig = createHmac("sha256", SECRET_KEY)
    .update(encoded)
    .digest("hex");

  if (signature !== expectedSig) {
    return null;
  }

  const payload: TokenPayload = JSON.parse(
    Buffer.from(encoded, "base64").toString("utf-8"),
  );

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
