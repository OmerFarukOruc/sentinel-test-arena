/**
 * Input validation utilities for auth flows.
 * Clean, well-tested patterns — no intentional issues.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Validate an email address format.
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Invalid email format");
  } else if (email.length > 254) {
    errors.push("Email exceeds maximum length of 254 characters");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a password meets security requirements.
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
    return { valid: false, errors };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one digit");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a username.
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username || username.trim().length === 0) {
    errors.push("Username is required");
  } else if (username.length < 3) {
    errors.push("Username must be at least 3 characters");
  } else if (username.length > 32) {
    errors.push("Username must not exceed 32 characters");
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push(
      "Username may only contain letters, numbers, underscores, and hyphens",
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Combine multiple validation results.
 */
export function combineValidations(
  ...results: ValidationResult[]
): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
