import { describe, expect, it } from "vitest";
import {
  addPlayer,
  addRound,
  createSession,
  defaultSessionName,
  deleteRound,
  removePlayer,
  setPlayerArchived,
  setStatus,
  updateRound,
  updateSettings,
} from "./sessions";
import { sessionBalances } from "./settlement";
import type { Session } from "./types";

function make(): Session {
  const r = createSession({
    name: "",
    unitLabel: "bi",
    unitPrice: 5000,
    playerNames: ["Tôi", "A", "B"],
  });
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

const id = (s: Session, name: string) => s.players.find((p) => p.name === name)!.id;

describe("createSession", () => {
  it("needs at least 2 players and a positive integer price", () => {
    expect(createSession({ name: "", unitLabel: "bi", unitPrice: 5000, playerNames: ["A"] }).ok).toBe(false);
    expect(createSession({ name: "", unitLabel: "bi", unitPrice: 0, playerNames: ["A", "B"] }).ok).toBe(false);
    expect(createSession({ name: "", unitLabel: "bi", unitPrice: 1.5, playerNames: ["A", "B"] }).ok).toBe(false);
  });

  it("rejects duplicate names ignoring case and spaces", () => {
    const r = createSession({ name: "", unitLabel: "lá", unitPrice: 1000, playerNames: ["An", " an "] });
    expect(r.ok).toBe(false);
  });

  it("defaults the name from unit and date", () => {
    expect(defaultSessionName("bi", new Date(2026, 10, 16))).toBe("Bi-a 16/11");
    expect(defaultSessionName("lá", new Date(2026, 10, 3))).toBe("Bài 03/11");
    expect(make().name).toMatch(/^Bi-a \d{2}\/\d{2}$/);
  });
});

describe("rounds", () => {
  it("adds a round with a price snapshot and derives balances", () => {
    const s = make();
    const r = addRound(s, {
      winnerId: id(s, "Tôi"),
      losses: [
        { playerId: id(s, "A"), remaining: 3 },
        { playerId: id(s, "B"), remaining: 2 },
      ],
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.value.rounds[0].unitPrice).toBe(5000);
    const b = sessionBalances(r.value);
    expect(b[id(s, "Tôi")]).toBe(25000);
    expect(b[id(s, "A")]).toBe(-15000);
  });

  it("price change does not alter old rounds", () => {
    let s = make();
    const draft = { winnerId: id(s, "Tôi"), losses: [{ playerId: id(s, "A"), remaining: 2 }] };
    const added = addRound(s, draft);
    if (!added.ok) throw new Error(added.error);
    const changed = updateSettings(added.value, { name: "x", unitLabel: "bi", unitPrice: 10000 });
    if (!changed.ok) throw new Error(changed.error);
    s = changed.value;
    expect(sessionBalances(s)[id(s, "Tôi")]).toBe(10000);
  });

  it("validates drafts", () => {
    const s = make();
    const me = id(s, "Tôi");
    const a = id(s, "A");
    expect(addRound(s, { winnerId: "nope", losses: [{ playerId: a, remaining: 1 }] }).ok).toBe(false);
    expect(addRound(s, { winnerId: me, losses: [] }).ok).toBe(false);
    expect(addRound(s, { winnerId: me, losses: [{ playerId: me, remaining: 1 }] }).ok).toBe(false);
    expect(addRound(s, { winnerId: me, losses: [{ playerId: a, remaining: -1 }] }).ok).toBe(false);
    expect(addRound(s, { winnerId: me, losses: [{ playerId: a, remaining: 1.5 }] }).ok).toBe(false);
    expect(
      addRound(s, { winnerId: me, losses: [{ playerId: a, remaining: 1 }, { playerId: a, remaining: 2 }] }).ok,
    ).toBe(false);
    expect(addRound(s, { winnerId: me, losses: [{ playerId: a, remaining: 0 }] }).ok).toBe(true);
  });

  it("cannot add rounds to a finished session, but can after reopening", () => {
    const s = setStatus(make(), "finished");
    const draft = { winnerId: id(s, "Tôi"), losses: [{ playerId: id(s, "A"), remaining: 1 }] };
    expect(addRound(s, draft).ok).toBe(false);
    expect(addRound(setStatus(s, "active"), draft).ok).toBe(true);
  });

  it("edits keep the original snapshot; delete removes the round", () => {
    const s = make();
    const me = id(s, "Tôi");
    const a = id(s, "A");
    const added = addRound(s, { winnerId: me, losses: [{ playerId: a, remaining: 1 }] });
    if (!added.ok) throw new Error(added.error);
    const priced = updateSettings(added.value, { name: "x", unitLabel: "bi", unitPrice: 9000 });
    if (!priced.ok) throw new Error(priced.error);
    const roundId = priced.value.rounds[0].id;
    const edited = updateRound(priced.value, roundId, { winnerId: a, losses: [{ playerId: me, remaining: 2 }] });
    if (!edited.ok) throw new Error(edited.error);
    expect(edited.value.rounds[0].unitPrice).toBe(5000);
    expect(sessionBalances(edited.value)[a]).toBe(10000);
    expect(deleteRound(edited.value, roundId).rounds).toHaveLength(0);
  });
});

describe("players", () => {
  it("adds players and rejects duplicates", () => {
    const s = make();
    expect(addPlayer(s, "C").ok).toBe(true);
    expect(addPlayer(s, "a").ok).toBe(false);
    expect(addPlayer(s, "  ").ok).toBe(false);
  });

  it("only removes players without rounds; others can be archived", () => {
    const s = make();
    const me = id(s, "Tôi");
    const a = id(s, "A");
    const b = id(s, "B");
    const added = addRound(s, { winnerId: me, losses: [{ playerId: a, remaining: 1 }] });
    if (!added.ok) throw new Error(added.error);
    expect(removePlayer(added.value, a).ok).toBe(false);
    expect(removePlayer(added.value, b).ok).toBe(true);
    const archived = setPlayerArchived(added.value, a, true);
    expect(archived.players.find((p) => p.id === a)?.archived).toBe(true);
    expect(sessionBalances(archived)[a]).toBe(-5000);
  });
});
