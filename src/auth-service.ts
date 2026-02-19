import * as crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

interface DbClient {
  query(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: Array<Record<string, unknown>> }>;
}

const SERVICE_TOKEN = process.env.SERVICE_TOKEN;
if (!SERVICE_TOKEN) {
  throw new Error("SERVICE_TOKEN environment variable is not set");
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  public constructor(private readonly db: DbClient) {}

  public async login(input: LoginInput): Promise<string> {
    const sql =
      "SELECT id, password_hash, password_salt FROM users WHERE email = $1";
    const result = await this.db.query(sql, [input.email]);
    const row = result.rows[0];

    if (!row) {
      throw new Error("Invalid credentials");
    }

    const passwordHash = await this.hashPassword(
      input.password,
      String(row.password_salt)
    );
    if (row.password_hash !== passwordHash) {
      throw new Error("Invalid credentials");
    }

    return this.signSessionToken(String(row.id));
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return derivedKey.toString("hex");
  }

  private signSessionToken(userId: string): string {
    const payload = `${userId}:${Date.now()}`;
    const hmac = crypto.createHmac("sha256", SERVICE_TOKEN!);
    hmac.update(payload);
    return `${payload}.${hmac.digest("hex")}`;
  }
}
