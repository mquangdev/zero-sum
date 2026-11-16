import type { Round, Session, Transfer } from "./types";

const vnd = new Intl.NumberFormat("vi-VN");

/** "5.000đ" */
export function formatVnd(amount: number): string {
  return `${vnd.format(amount)}đ`;
}

/** "+25.000đ", "-15.000đ", "0đ" (sign is explicit, never color-only). */
export function formatSignedVnd(amount: number): string {
  if (amount === 0) return "0đ";
  return `${amount > 0 ? "+" : "-"}${formatVnd(Math.abs(amount))}`;
}

/** Money change of every participant of one round. Always sums to 0. */
export function roundDeltas(round: Round): Record<string, number> {
  const deltas: Record<string, number> = {};
  let winnerGain = 0;
  for (const loss of round.losses) {
    const pay = round.unitPrice * loss.remaining;
    deltas[loss.playerId] = (deltas[loss.playerId] ?? 0) - pay;
    winnerGain += pay;
  }
  deltas[round.winnerId] = (deltas[round.winnerId] ?? 0) + winnerGain;
  return deltas;
}

/** Running balance per player, derived from rounds (never stored). */
export function sessionBalances(session: Session): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const player of session.players) balances[player.id] = 0;
  for (const round of session.rounds) {
    const deltas = roundDeltas(round);
    for (const [id, delta] of Object.entries(deltas)) {
      balances[id] = (balances[id] ?? 0) + delta;
    }
  }
  return balances;
}

/**
 * Greedy settlement: repeatedly match the biggest debtor with the biggest creditor.
 * Total transferred equals total positive balance; at most (people - 1) transfers.
 */
export function minimalTransfers(balances: Record<string, number>): Transfer[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  for (const [id, balance] of Object.entries(balances)) {
    if (balance > 0) creditors.push({ id, amount: balance });
    else if (balance < 0) debtors.push({ id, amount: -balance });
  }
  const byAmountThenId = (a: { id: string; amount: number }, b: { id: string; amount: number }) =>
    b.amount - a.amount || a.id.localeCompare(b.id);

  const transfers: Transfer[] = [];
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort(byAmountThenId);
    debtors.sort(byAmountThenId);
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.amount, debtor.amount);
    transfers.push({ from: debtor.id, to: creditor.id, amount });
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }
  return transfers;
}

/** Vietnamese plain text to paste into a group chat. */
export function formatSummaryText(session: Session): string {
  const nameOf = (id: string) => session.players.find((p) => p.id === id)?.name ?? "?";
  const balances = sessionBalances(session);
  const ranked = Object.entries(balances).sort((a, b) => b[1] - a[1]);
  const transfers = minimalTransfers(balances);

  const lines = [
    `Tổng kết "${session.name}" (${session.rounds.length} ván)`,
    `Giá: ${formatVnd(session.unitPrice)}/${session.unitLabel}`,
    "",
    "Số dư:",
    ...ranked.map(([id, balance]) => `- ${nameOf(id)}: ${formatSignedVnd(balance)}`),
    "",
    "Chuyển khoản:",
    ...(transfers.length > 0
      ? transfers.map((t) => `- ${nameOf(t.from)} → ${nameOf(t.to)}: ${formatVnd(t.amount)}`)
      : ["- Không ai nợ ai"]),
  ];
  return lines.join("\n");
}
