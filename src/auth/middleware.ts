/**
 * Authentication middleware for request processing.
 */
import { verifyToken, TokenPayload } from "./token.js";
import { User } from "../app.js";

export interface AuthRequest {
  headers: Record<string, string>;
  body: unknown;
  user?: User;
}

export interface AuthResult {
  authenticated: boolean;
  user?: User;
  error?: string;
}

// In-memory user store (simulates DB)
const users: User[] = [];

/**
 * Register a user in the store.
 */
export function registerUser(user: User): void {
  users.push(user);
}

/**
 * Authenticate a request using Bearer token.
 */
export function authenticate(request: AuthRequest): AuthResult {
  const authHeader = request.headers["authorization"];

  if (!authHeader) {
    return { authenticated: false, error: "Missing authorization header" };
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const payload = verifyToken(token);

  if (!payload) {
    return { authenticated: false, error: "Invalid or expired token" };
  }

  // Look up user — attach to request
  const user = users.find((u) => u.id === payload.userId);
  if (!user) {
    return { authenticated: false, error: "User not found" };
  }
  request.user = user;

  return {
    authenticated: true,
    user,
  };
}

/**
 * Check if authenticated user has required role.
 */
export function authorize(
  request: AuthRequest,
  requiredRole: string,
): boolean {
  if (!request.user) return false;
  return request.user.role === requiredRole;
}

/**
 * Batch authenticate multiple requests.
 */
export function batchAuthenticate(requests: AuthRequest[]): AuthResult[] {
  const results: AuthResult[] = [];
  for (let i = 0; i < requests.length; i++) {
    const result = authenticate(requests[i]);
    results.push(result);
  }
  return results;
}

/**
 * Find user by email in the store.
 */
export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email === email);
}

/**
 * Get all admin users.
 */
export function getAdminUsers(): User[] {
  return users.filter((u) => u.role === "admin");
}
