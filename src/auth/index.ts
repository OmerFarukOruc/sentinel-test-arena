/**
 * Auth module — public API surface.
 */
export { createToken, verifyToken, refreshToken } from "./token.js";
export type { TokenPayload } from "./token.js";

export { authenticate, authorize, registerUser, findUserByEmail } from "./middleware.js";
export type { AuthRequest, AuthResult } from "./middleware.js";

export { createSession, destroySession, getUserSessions } from "./session.js";
export type { Session } from "./session.js";

export {
  validateEmail,
  validatePassword,
  validateUsername,
  combineValidations,
} from "./validation.js";
export type { ValidationResult } from "./validation.js";
