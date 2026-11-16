import { newId } from "./id";
import type { Player, Round, RoundLoss, Session, UnitLabel } from "./types";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T = never>(error: string): Result<T> => ({ ok: false, error });

export const MAX_REMAINING = 999;

export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price > 0;
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function sameName(a: string, b: string): boolean {
  return normalizeName(a).toLocaleLowerCase("vi") === normalizeName(b).toLocaleLowerCase("vi");
}

export function validatePlayerName(
  name: string,
  existing: Pick<Player, "id" | "name">[],
  ignoreId?: string,
): Result<string> {
  const clean = normalizeName(name);
  if (clean === "") return fail("Tên không được để trống");
  if (existing.some((p) => p.id !== ignoreId && sameName(p.name, clean))) {
    return fail("Tên này đã có trong phiên");
  }
  return ok(clean);
}

export function defaultSessionName(unit: UnitLabel, now: Date = new Date()): string {
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${unit === "bi" ? "Bi-a" : "Bài"} ${d}/${m}`;
}

export interface NewSessionInput {
  name: string;
  unitLabel: UnitLabel;
  unitPrice: number;
  playerNames: string[];
}

export function createSession(input: NewSessionInput, now: Date = new Date()): Result<Session> {
  if (!isValidPrice(input.unitPrice)) return fail("Giá phải là số nguyên dương");

  const players: Player[] = [];
  for (const raw of input.playerNames) {
    if (normalizeName(raw) === "") continue;
    const name = validatePlayerName(raw, players);
    if (!name.ok) return fail(name.error);
    players.push({ id: newId(), name: name.value, archived: false });
  }
  if (players.length < 2) return fail("Cần ít nhất 2 người chơi");

  const iso = now.toISOString();
  return ok({
    id: newId(),
    name: normalizeName(input.name) || defaultSessionName(input.unitLabel, now),
    unitLabel: input.unitLabel,
    unitPrice: input.unitPrice,
    players,
    rounds: [],
    status: "active",
    createdAt: iso,
    updatedAt: iso,
  });
}

function touch(session: Session, patch: Partial<Session>, now: Date): Session {
  return { ...session, ...patch, updatedAt: now.toISOString() };
}

export function updateSettings(
  session: Session,
  patch: { name: string; unitLabel: UnitLabel; unitPrice: number },
  now: Date = new Date(),
): Result<Session> {
  if (!isValidPrice(patch.unitPrice)) return fail("Giá phải là số nguyên dương");
  const name = normalizeName(patch.name);
  if (name === "") return fail("Tên phiên không được để trống");
  return ok(touch(session, { name, unitLabel: patch.unitLabel, unitPrice: patch.unitPrice }, now));
}

export function setStatus(
  session: Session,
  status: Session["status"],
  now: Date = new Date(),
): Session {
  return touch(session, { status }, now);
}

export function addPlayer(session: Session, name: string, now: Date = new Date()): Result<Session> {
  const clean = validatePlayerName(name, session.players);
  if (!clean.ok) return fail(clean.error);
  const player: Player = { id: newId(), name: clean.value, archived: false };
  return ok(touch(session, { players: [...session.players, player] }, now));
}

export function playerHasRounds(session: Session, playerId: string): boolean {
  return session.rounds.some(
    (r) => r.winnerId === playerId || r.losses.some((l) => l.playerId === playerId),
  );
}

export function setPlayerArchived(
  session: Session,
  playerId: string,
  archived: boolean,
  now: Date = new Date(),
): Session {
  return touch(
    session,
    { players: session.players.map((p) => (p.id === playerId ? { ...p, archived } : p)) },
    now,
  );
}

/** Players who already appear in a round can only be archived, never removed. */
export function removePlayer(
  session: Session,
  playerId: string,
  now: Date = new Date(),
): Result<Session> {
  if (playerHasRounds(session, playerId)) return fail("Người chơi đã có ván, chỉ có thể ẩn");
  return ok(touch(session, { players: session.players.filter((p) => p.id !== playerId) }, now));
}

export interface RoundDraft {
  winnerId: string;
  losses: RoundLoss[];
}

export function validateRoundDraft(session: Session, draft: RoundDraft): Result<RoundDraft> {
  const ids = new Set(session.players.map((p) => p.id));
  if (!ids.has(draft.winnerId)) return fail("Hãy chọn người thắng");
  if (draft.losses.length < 1) return fail("Cần ít nhất 1 người thua");
  const seen = new Set<string>();
  for (const loss of draft.losses) {
    if (loss.playerId === draft.winnerId) return fail("Người thắng không thể là người thua");
    if (!ids.has(loss.playerId)) return fail("Người chơi không tồn tại");
    if (seen.has(loss.playerId)) return fail("Người thua bị trùng");
    seen.add(loss.playerId);
    if (!Number.isInteger(loss.remaining) || loss.remaining < 0 || loss.remaining > MAX_REMAINING) {
      return fail(`Số còn lại phải là số nguyên từ 0 đến ${MAX_REMAINING}`);
    }
  }
  return ok(draft);
}

export function addRound(
  session: Session,
  draft: RoundDraft,
  now: Date = new Date(),
): Result<Session> {
  if (session.status === "finished") return fail("Phiên đã kết thúc");
  const valid = validateRoundDraft(session, draft);
  if (!valid.ok) return fail(valid.error);
  const round: Round = {
    id: newId(),
    winnerId: draft.winnerId,
    losses: draft.losses.map((l) => ({ ...l })),
    unitPrice: session.unitPrice,
    createdAt: now.toISOString(),
  };
  return ok(touch(session, { rounds: [...session.rounds, round] }, now));
}

/** Editing keeps the original unitPrice snapshot and createdAt. */
export function updateRound(
  session: Session,
  roundId: string,
  draft: RoundDraft,
  now: Date = new Date(),
): Result<Session> {
  const existing = session.rounds.find((r) => r.id === roundId);
  if (!existing) return fail("Không tìm thấy ván");
  const valid = validateRoundDraft(session, draft);
  if (!valid.ok) return fail(valid.error);
  const rounds = session.rounds.map((r) =>
    r.id === roundId
      ? { ...r, winnerId: draft.winnerId, losses: draft.losses.map((l) => ({ ...l })) }
      : r,
  );
  return ok(touch(session, { rounds }, now));
}

export function deleteRound(session: Session, roundId: string, now: Date = new Date()): Session {
  return touch(session, { rounds: session.rounds.filter((r) => r.id !== roundId) }, now);
}
