/**
 * The only module that touches localStorage.
 * Data is versioned (`StorageEnvelope.version`); corrupt data never throws.
 */
import { STORAGE_VERSION } from "./types";
import type { Player, Round, Session, StorageEnvelope } from "./types";

export const STORAGE_KEY = "zero-sum:v1";
export const THEME_KEY = "zero-sum:theme";

export type ThemePreference = "system" | "light" | "dark";

export type LoadResult =
  | { status: "ok"; envelope: StorageEnvelope }
  | { status: "corrupt"; raw: string; error: string };

export type ParseResult =
  | { ok: true; envelope: StorageEnvelope }
  | { ok: false; error: string };

// ---------- validation ----------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

function parsePlayer(v: unknown): Player | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.name) || typeof v.archived !== "boolean") return null;
  return { id: v.id, name: v.name, archived: v.archived };
}

function parseRound(v: unknown): Round | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.winnerId) || !isStr(v.createdAt)) return null;
  if (!isInt(v.unitPrice) || v.unitPrice <= 0 || !Array.isArray(v.losses)) return null;
  const losses: Round["losses"] = [];
  for (const l of v.losses) {
    if (!isObj(l) || !isStr(l.playerId) || !isInt(l.remaining) || l.remaining < 0) return null;
    if (l.playerId === v.winnerId) return null;
    losses.push({ playerId: l.playerId, remaining: l.remaining });
  }
  if (losses.length < 1) return null;
  return { id: v.id, winnerId: v.winnerId, losses, unitPrice: v.unitPrice, createdAt: v.createdAt };
}

function parseSession(v: unknown): Session | null {
  if (!isObj(v)) return null;
  if (!isStr(v.id) || !isStr(v.name) || !isStr(v.createdAt) || !isStr(v.updatedAt)) return null;
  if (v.unitLabel !== "bi" && v.unitLabel !== "lá") return null;
  if (v.status !== "active" && v.status !== "finished") return null;
  if (!isInt(v.unitPrice) || v.unitPrice <= 0) return null;
  if (!Array.isArray(v.players) || !Array.isArray(v.rounds)) return null;

  const players: Player[] = [];
  for (const p of v.players) {
    const parsed = parsePlayer(p);
    if (!parsed) return null;
    players.push(parsed);
  }
  const ids = new Set(players.map((p) => p.id));
  const rounds: Round[] = [];
  for (const r of v.rounds) {
    const parsed = parseRound(r);
    if (!parsed) return null;
    if (!ids.has(parsed.winnerId) || parsed.losses.some((l) => !ids.has(l.playerId))) return null;
    rounds.push(parsed);
  }
  return {
    id: v.id,
    name: v.name,
    unitLabel: v.unitLabel,
    unitPrice: v.unitPrice,
    players,
    rounds,
    status: v.status,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

/** Validates unknown JSON text as a storage envelope (also used by JSON import). */
export function parseEnvelope(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "Không phải JSON hợp lệ" };
  }
  if (!isObj(data)) return { ok: false, error: "Dữ liệu không đúng định dạng" };
  if (data.version !== STORAGE_VERSION) {
    // Future versions would be migrated here before validation.
    return { ok: false, error: "Phiên bản dữ liệu không được hỗ trợ" };
  }
  if (!Array.isArray(data.sessions)) return { ok: false, error: "Thiếu danh sách phiên" };
  const sessions: Session[] = [];
  const seen = new Set<string>();
  for (const s of data.sessions) {
    const parsed = parseSession(s);
    if (!parsed || seen.has(parsed.id)) return { ok: false, error: "Có phiên không hợp lệ" };
    seen.add(parsed.id);
    sessions.push(parsed);
  }
  return { ok: true, envelope: { version: STORAGE_VERSION, sessions } };
}

export function serializeEnvelope(envelope: StorageEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

// ---------- localStorage access ----------

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // blocked (privacy mode, disabled cookies)
  }
}

export function loadEnvelope(): LoadResult {
  const empty: StorageEnvelope = { version: STORAGE_VERSION, sessions: [] };
  const storage = getStorage();
  if (!storage) return { status: "ok", envelope: empty };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: "ok", envelope: empty };
  }
  if (raw === null) return { status: "ok", envelope: empty };
  const parsed = parseEnvelope(raw);
  if (!parsed.ok) return { status: "corrupt", raw, error: parsed.error };
  return { status: "ok", envelope: parsed.envelope };
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export function saveEnvelope(envelope: StorageEnvelope): SaveResult {
  const storage = getStorage();
  if (!storage) return { ok: false, error: "Trình duyệt không cho phép lưu dữ liệu" };
  try {
    storage.setItem(STORAGE_KEY, serializeEnvelope(envelope));
    return { ok: true };
  } catch {
    return { ok: false, error: "Không lưu được dữ liệu (hết dung lượng hoặc chế độ riêng tư)" };
  }
}

export function clearEnvelope(): void {
  try {
    getStorage()?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ---------- theme preference ----------

export function loadTheme(): ThemePreference {
  try {
    const v = getStorage()?.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function saveTheme(theme: ThemePreference): void {
  try {
    getStorage()?.setItem(THEME_KEY, theme);
  } catch {
    // ignore: the preference just won't persist
  }
}
