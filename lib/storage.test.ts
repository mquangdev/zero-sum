import { describe, expect, it } from "vitest";
import { parseEnvelope, serializeEnvelope } from "./storage";
import type { StorageEnvelope } from "./types";

const valid: StorageEnvelope = {
  version: 1,
  sessions: [
    {
      id: "s1",
      name: "Bi-a",
      unitLabel: "bi",
      unitPrice: 5000,
      players: [
        { id: "a", name: "A", archived: false },
        { id: "b", name: "B", archived: true },
      ],
      rounds: [
        {
          id: "r1",
          winnerId: "a",
          losses: [{ playerId: "b", remaining: 3 }],
          unitPrice: 5000,
          createdAt: "2026-11-16T00:00:00.000Z",
        },
      ],
      status: "active",
      createdAt: "2026-11-16T00:00:00.000Z",
      updatedAt: "2026-11-16T00:00:00.000Z",
    },
  ],
};

describe("parseEnvelope", () => {
  it("round-trips valid data", () => {
    const r = parseEnvelope(serializeEnvelope(valid));
    expect(r).toEqual({ ok: true, envelope: valid });
  });

  it("rejects non-JSON and wrong shapes without throwing", () => {
    expect(parseEnvelope("{oops").ok).toBe(false);
    expect(parseEnvelope("[]").ok).toBe(false);
    expect(parseEnvelope('{"version":2,"sessions":[]}').ok).toBe(false);
    expect(parseEnvelope('{"version":1}').ok).toBe(false);
  });

  it("rejects invalid sessions", () => {
    const bad = (mutate: (s: Record<string, unknown>) => void) => {
      const copy = JSON.parse(JSON.stringify(valid));
      mutate(copy.sessions[0]);
      return parseEnvelope(JSON.stringify(copy)).ok;
    };
    expect(bad((s) => (s.unitPrice = 0))).toBe(false);
    expect(bad((s) => (s.unitLabel = "xu"))).toBe(false);
    expect(bad((s) => (s.status = "paused"))).toBe(false);
    expect(bad((s) => ((s.rounds as { winnerId: string }[])[0].winnerId = "ghost"))).toBe(false);
    expect(bad((s) => ((s.rounds as { losses: { remaining: number }[] }[])[0].losses[0].remaining = -1))).toBe(false);
    expect(bad(() => undefined)).toBe(true);
  });
});
