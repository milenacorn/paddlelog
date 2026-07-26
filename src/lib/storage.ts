import type { PaddleSession } from "./types";

const STORAGE_KEY = "paddlelog.sessions";

export function loadSessions(): PaddleSession[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PaddleSession[];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: PaddleSession[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}
