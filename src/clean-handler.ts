import type { ApiResponse, User } from "./app";
import { createUser, formatResponse } from "./app";

export interface CreateUserRequest {
  name: string;
  email: string;
}

class ValidationError extends Error {
  public readonly status = 400;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function handleCreateUser(
  request: CreateUserRequest,
): Promise<ApiResponse<User | { error: string }>> {
  try {
    const name = request.name.trim();
    const email = request.email.trim().toLowerCase();

    if (name.length < 2 || name.length > 60) {
      throw new ValidationError("Name must be 2-60 characters");
    }

    if (!isValidEmail(email)) {
      throw new ValidationError("Invalid email address");
    }

    const user = createUser(name, email);
    return formatResponse(user, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof ValidationError ? error.status : 500;
    return formatResponse({ error: message }, status);
  }
}
