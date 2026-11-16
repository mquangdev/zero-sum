"use client";

import { useSyncExternalStore } from "react";
import { clearEnvelope, loadEnvelope, parseEnvelope, saveEnvelope, STORAGE_KEY } from "./storage";
import { STORAGE_VERSION } from "./types";
import type { Session } from "./types";

export type StoreState =
  | { status: "loading" }
  | { status: "ready"; sessions: Session[]; writeError: string | null }
  | { status: "corrupt"; raw: string; error: string };

const LOADING: StoreState = { status: "loading" };

let state: StoreState | null = null; // null = not read from localStorage yet
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function read(): StoreState {
  if (state) return state;
  const loaded = loadEnvelope();
  state =
    loaded.status === "ok"
      ? { status: "ready", sessions: loaded.envelope.sessions, writeError: null }
      : { status: "corrupt", raw: loaded.raw, error: loaded.error };
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      state = null; // another tab changed the data
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, read, () => LOADING);
}

function commit(sessions: Session[]) {
  const result = saveEnvelope({ version: STORAGE_VERSION, sessions });
  state = { status: "ready", sessions, writeError: result.ok ? null : result.error };
  emit();
}

function currentSessions(): Session[] {
  const s = read();
  return s.status === "ready" ? s.sessions : [];
}

export function addSession(session: Session) {
  commit([session, ...currentSessions()]);
}

export function replaceSession(session: Session) {
  commit(currentSessions().map((s) => (s.id === session.id ? session : s)));
}

export function deleteSession(id: string) {
  commit(currentSessions().filter((s) => s.id !== id));
}

/** Validate then replace all data (JSON import). */
export function importAll(text: string): { ok: true } | { ok: false; error: string } {
  const parsed = parseEnvelope(text);
  if (!parsed.ok) return parsed;
  commit(parsed.envelope.sessions);
  return { ok: true };
}

/** Start over after corrupt data (the raw data was offered for export first). */
export function resetAll() {
  clearEnvelope();
  state = { status: "ready", sessions: [], writeError: null };
  emit();
}

export function exportAllText(): string {
  const s = read();
  const sessions = s.status === "ready" ? s.sessions : [];
  return JSON.stringify({ version: STORAGE_VERSION, sessions }, null, 2);
}
