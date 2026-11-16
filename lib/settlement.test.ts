import { describe, expect, it } from "vitest";
import {
  formatSignedVnd,
  formatSummaryText,
  formatVnd,
  minimalTransfers,
  roundDeltas,
  sessionBalances,
} from "./settlement";
import type { Round, Session } from "./types";

const session = (rounds: Round[]): Session => ({
  id: "s",
  name: "Bi-a 16/11",
  unitLabel: "bi",
  unitPrice: 5000,
  players: [
    { id: "me", name: "Tôi", archived: false },
    { id: "a", name: "A", archived: false },
    { id: "b", name: "B", archived: false },
  ],
  rounds,
  status: "active",
  createdAt: "2026-11-16T00:00:00.000Z",
  updatedAt: "2026-11-16T00:00:00.000Z",
});

const round = (
  id: string,
  winnerId: string,
  losses: [string, number][],
  unitPrice = 5000,
): Round => ({
  id,
  winnerId,
  losses: losses.map(([playerId, remaining]) => ({ playerId, remaining })),
  unitPrice,
  createdAt: "2026-11-16T00:00:00.000Z",
});

const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

describe("roundDeltas", () => {
  it("pool example: A has 3 left, B has 2 left, 5,000 per ball", () => {
    const d = roundDeltas(round("1", "me", [["a", 3], ["b", 2]]));
    expect(d).toEqual({ me: 25000, a: -15000, b: -10000 });
  });

  it("is zero-sum", () => {
    expect(sum(roundDeltas(round("1", "me", [["a", 7], ["b", 4]], 3000)))).toBe(0);
  });

  it("loser with 0 left pays nothing but stays in the round", () => {
    const d = roundDeltas(round("1", "me", [["a", 0], ["b", 2]]));
    expect(d).toEqual({ me: 10000, a: 0, b: -10000 });
  });
});

describe("sessionBalances", () => {
  it("accumulates several rounds", () => {
    const s = session([
      round("1", "me", [["a", 3], ["b", 2]]),
      round("2", "a", [["me", 1], ["b", 4]]),
    ]);
    const b = sessionBalances(s);
    expect(b).toEqual({ me: 25000 - 5000, a: -15000 + 25000, b: -10000 - 20000 });
    expect(sum(b)).toBe(0);
  });

  it("keeps the price snapshot of old rounds when the session price changes", () => {
    const s = { ...session([round("1", "me", [["a", 2]], 5000)]), unitPrice: 10000 };
    expect(sessionBalances(s)).toEqual({ me: 10000, a: -10000, b: 0 });
  });

  it("includes players without rounds with balance 0", () => {
    expect(sessionBalances(session([]))).toEqual({ me: 0, a: 0, b: 0 });
  });
});

describe("minimalTransfers", () => {
  it("settles the pool example", () => {
    const t = minimalTransfers({ me: 25000, a: -15000, b: -10000 });
    expect(t).toEqual([
      { from: "a", to: "me", amount: 15000 },
      { from: "b", to: "me", amount: 10000 },
    ]);
  });

  it("matches balances exactly with at most n-1 transfers", () => {
    const balances = { p1: 30000, p2: 5000, p3: -20000, p4: -10000, p5: -5000 };
    const transfers = minimalTransfers(balances);
    expect(transfers.length).toBeLessThanOrEqual(4);
    const net: Record<string, number> = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 };
    for (const t of transfers) {
      net[t.from] -= t.amount;
      net[t.to] += t.amount;
    }
    for (const [id, b] of Object.entries(balances)) expect(net[id]).toBe(b);
  });

  it("returns nothing when everyone is even", () => {
    expect(minimalTransfers({ a: 0, b: 0 })).toEqual([]);
  });
});

describe("formatting", () => {
  it("formats VND with vi-VN grouping", () => {
    expect(formatVnd(5000)).toBe("5.000đ");
    expect(formatVnd(1250000)).toBe("1.250.000đ");
  });

  it("always shows an explicit sign", () => {
    expect(formatSignedVnd(25000)).toBe("+25.000đ");
    expect(formatSignedVnd(-15000)).toBe("-15.000đ");
    expect(formatSignedVnd(0)).toBe("0đ");
  });

  it("builds the share text", () => {
    const text = formatSummaryText(session([round("1", "me", [["a", 3], ["b", 2]])]));
    expect(text).toContain('Tổng kết "Bi-a 16/11" (1 ván)');
    expect(text).toContain("Giá: 5.000đ/bi");
    expect(text).toContain("- Tôi: +25.000đ");
    expect(text).toContain("- A → Tôi: 15.000đ");
  });
});
