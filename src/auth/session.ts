/**
 * Session management — tracks active user sessions.
 */
import { readFile, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
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

async function loadSessions(): Promise<Session[]> {
  try {
    const raw = await readFile(SESSION_FILE, "utf-8");
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

async function saveSessions(sessions: Session[]): Promise<void> {
  await writeFile(SESSION_FILE, JSON.stringify(sessions, null, 2));
}

export async function createSession(
  payload: TokenPayload,
  ipAddress: string,
  userAgent: string,
): Promise<Session> {
  const sessions = await loadSessions();

  const session: Session = {
    sessionId: randomUUID(),
    userId: payload.userId,
    createdAt: Date.now(),
    lastActive: Date.now(),
    ipAddress,
    userAgent,
  };

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
  await saveSessions(sessions);

  return session;
}

export async function touchSession(sessionId: string): Promise<void> {
  const sessions = await loadSessions();
  const session = sessions.find((s) => s.sessionId === sessionId);
  if (session) {
    session.lastActive = Date.now();
    await saveSessions(sessions);
  }
}

export async function destroySession(sessionId: string): Promise<boolean> {
  const sessions = await loadSessions();
  const idx = sessions.findIndex((s) => s.sessionId === sessionId);
  if (idx === -1) return false;

  sessions.splice(idx, 1);
  await saveSessions(sessions);
  return true;
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  const sessions = await loadSessions();
  return sessions.filter((s) => s.userId === userId);
}

export async function purgeExpiredSessions(): Promise<number> {
  const sessions = await loadSessions();
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
  const active = sessions.filter((s) => s.lastActive > cutoff);
  const purged = sessions.length - active.length;
  await saveSessions(active);
  return purged;
}

export async function totalActiveSessions(): Promise<number> {
  const sessions = await loadSessions();
  return sessions.length;
}
