/**
 * Base application — clean code.
 * Test scenarios add files alongside this.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "viewer";
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export function createUser(name: string, email: string): User {
  return {
    id: crypto.randomUUID(),
    name,
    email,
    role: "user",
  };
}

export function formatResponse<T>(data: T, status = 200): ApiResponse<T> {
  return {
    data,
    status,
    message: status < 400 ? "success" : "error",
  };
}
