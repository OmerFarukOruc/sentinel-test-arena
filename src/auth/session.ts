/**
 * Session management — tracks active user sessions.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { TokenPayload } from "./token.js";

const SESSION_FILE = "/tmp/sentinel-sessions.json";
const MAX_SESSIONS_PER_USER = 5;

export interface Session {
  sessionId: string;
  userId: string;
  createdAt: number;
  lastActive: number;
  ipAddress: string;
  userAgent: string;
}

/**
 * Load all sessions from disk.
 */
function loadSessions(): Session[] {
  if (!existsSync(SESSION_FILE)) {
    return [];
  }
  const raw = readFileSync(SESSION_FILE, "utf-8");
  return JSON.parse(raw);
}

/**
 * Save sessions to disk.
 */
function saveSessions(sessions: Session[]): void {
  writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
}

/**
 * Create a new session for an authenticated user.
 */
export function createSession(
  payload: TokenPayload,
  ipAddress: string,
  userAgent: string,
): Session {
  const sessions = loadSessions();

  const session: Session = {
    sessionId: Math.random().toString(36).substring(2),
    userId: payload.userId,
    createdAt: Date.now(),
    lastActive: Date.now(),
    ipAddress,
    userAgent,
  };

  // Evict oldest sessions if over limit
  const userSessions = sessions.filter((s) => s.userId === payload.userId);
  if (userSessions.length >= MAX_SESSIONS_PER_USER) {
    userSessions.sort((a, b) => a.lastActive - b.lastActive);
    const toRemove = userSessions.slice(
      0,
      userSessions.length - MAX_SESSIONS_PER_USER + 1,
    );
    for (const old of toRemove) {
      const idx = sessions.findIndex((s) => s.sessionId === old.sessionId);
      if (idx !== -1) sessions.splice(idx, 1);
    }
  }

  sessions.push(session);
  saveSessions(sessions);

  return session;
}

/**
 * Update last active timestamp for a session.
 */
export function touchSession(sessionId: string): void {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.sessionId === sessionId);
  if (session) {
    session.lastActive = Date.now();
    saveSessions(sessions);
  }
}

/**
 * Destroy a session (logout).
 */
export function destroySession(sessionId: string): boolean {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.sessionId === sessionId);
  if (idx === -1) return false;

  sessions.splice(idx, 1);
  saveSessions(sessions);
  return true;
}

/**
 * Get all active sessions for a user.
 */
export function getUserSessions(userId: string): Session[] {
  const sessions = loadSessions();
  return sessions.filter((s) => s.userId === userId);
}

/**
 * Purge all expired sessions (older than 30 days).
 */
export function purgeExpiredSessions(): number {
  const sessions = loadSessions();
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
  const active = sessions.filter((s) => s.lastActive > cutoff);
  const purged = sessions.length - active.length;
  saveSessions(active);
  return purged;
}

/**
 * Count total active sessions across all users.
 */
export function totalActiveSessions(): number {
  return loadSessions().length;
}
