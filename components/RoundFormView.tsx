"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_REMAINING, addRound, deleteRound, updateRound } from "@/lib/sessions";
import type { RoundDraft } from "@/lib/sessions";
import { formatSignedVnd, formatVnd, roundDeltas } from "@/lib/settlement";
import { replaceSession } from "@/lib/store";
import type { Round, Session } from "@/lib/types";
import { SessionGate } from "./StoreGate";
import {
  BottomBar,
  ConfirmDialog,
  ErrorText,
  PageHeader,
  Shell,
  balanceClass,
  btnDanger,
  btnPrimary,
  btnSecondary,
  cardCls,
  cn,
  inputCls,
} from "./ui";

function Stepper({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(MAX_REMAINING, Math.max(0, v));
  return (
    <div className="flex w-full items-center gap-2">
      <button
        type="button"
        aria-label={`Giảm ${label}`}
        className={cn(btnSecondary, "size-12 shrink-0 px-0 text-2xl")}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 0}
      >
        −
      </button>
      <input
        aria-label={label}
        className={cn(inputCls, "min-h-12 min-w-0 flex-1 px-1 text-center text-lg font-bold tabular-nums")}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value.replace(/\D/g, "")) || 0))}
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        aria-label={`Tăng ${label}`}
        className={cn(btnSecondary, "size-12 shrink-0 px-0 text-2xl")}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= MAX_REMAINING}
      >
        +
      </button>
    </div>
  );
}

function Form({ session, existing }: { session: Session; existing?: Round }) {
  const router = useRouter();
  const [winnerId, setWinnerId] = useState<string>(existing?.winnerId ?? "");
  const [remaining, setRemaining] = useState<Record<string, number>>(
    Object.fromEntries((existing?.losses ?? []).map((l) => [l.playerId, l.remaining])),
  );
  const [skipped, setSkipped] = useState<Set<string>>(() => {
    if (!existing) return new Set();
    const inRound = new Set([existing.winnerId, ...existing.losses.map((l) => l.playerId)]);
    return new Set(session.players.filter((p) => !inRound.has(p.id)).map((p) => p.id));
  });
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const inRoundIds = new Set(existing ? [existing.winnerId, ...existing.losses.map((l) => l.playerId)] : []);
  const candidates = session.players.filter((p) => !p.archived || inRoundIds.has(p.id));
  const losers = candidates.filter((p) => p.id !== winnerId && !skipped.has(p.id));
  const unitPrice = existing?.unitPrice ?? session.unitPrice;

  const draft: RoundDraft = {
    winnerId,
    losses: losers.map((p) => ({ playerId: p.id, remaining: remaining[p.id] ?? 0 })),
  };
  const canSave = winnerId !== "" && losers.length > 0;
  const deltas = canSave
    ? roundDeltas({ id: "preview", createdAt: "", unitPrice, winnerId: draft.winnerId, losses: draft.losses })
    : {};
  const nameOf = (id: string) => session.players.find((p) => p.id === id)?.name ?? "?";

  function toggle(id: string) {
    const next = new Set(skipped);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSkipped(next);
  }

  function save() {
    const result = existing ? updateRound(session, existing.id, draft) : addRound(session, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    replaceSession(result.value);
    if (!existing) {
      // The route may stay mounted (hidden) after navigating away, so clear the
      // draft to make the next "add round" start from a blank form.
      setWinnerId("");
      setRemaining({});
      setSkipped(new Set());
      setError("");
    }
    router.replace(`/session/${session.id}`);
  }

  function remove() {
    if (!existing) return;
    replaceSession(deleteRound(session, existing.id));
    router.replace(`/session/${session.id}`);
  }

  if (!existing && session.status === "finished") {
    return (
      <>
        <PageHeader title="Thêm ván" backHref={`/session/${session.id}`} />
        <p className="px-4 text-muted">Phiên đã kết thúc. Hãy mở lại phiên để thêm ván.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title={existing ? "Sửa ván" : "Thêm ván"} backHref={`/session/${session.id}`} />
      <div className="space-y-5 px-4">
        <section className={cn(cardCls, "p-4")}>
          <h2 className="text-sm font-semibold">Ai thắng?</h2>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Người thắng">
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={winnerId === p.id}
                onClick={() => setWinnerId(p.id)}
                className={cn(winnerId === p.id ? btnPrimary : btnSecondary, "min-h-12")}
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>

        {winnerId !== "" && (
          <section className={cn(cardCls, "p-4")}>
            <h2 className="text-sm font-semibold">
              Số {session.unitLabel} còn lại ({formatVnd(unitPrice)}/{session.unitLabel})
            </h2>
            <ul className="mt-2 divide-y divide-border">
              {candidates
                .filter((p) => p.id !== winnerId)
                .map((p) => {
                  const out = skipped.has(p.id);
                  return (
                    <li key={p.id} className="py-3">
                      <div className="flex flex-col gap-2">
                        <label className="flex min-h-11 min-w-0 items-center gap-3">
                          <input
                            type="checkbox"
                            className="size-5 shrink-0 accent-primary"
                            checked={!out}
                            onChange={() => toggle(p.id)}
                          />
                          <span
                            className={cn(
                              "break-words text-base font-semibold",
                              out && "text-muted line-through",
                            )}
                          >
                            {p.name}
                          </span>
                        </label>
                        {!out && (
                          <Stepper
                            value={remaining[p.id] ?? 0}
                            label={`Số ${session.unitLabel} còn lại của ${p.name}`}
                            onChange={(v) => setRemaining({ ...remaining, [p.id]: v })}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
            {losers.length === 0 && <ErrorText>Cần ít nhất 1 người thua</ErrorText>}
          </section>
        )}

        {canSave && (
          <section className={cn(cardCls, "p-4")} aria-label="Xem trước">
            <h2 className="text-sm font-semibold text-muted">Xem trước</h2>
            <ul className="mt-2 space-y-1">
              {[draft.winnerId, ...draft.losses.map((l) => l.playerId)].map((id) => (
                <li key={id} className="flex justify-between gap-2">
                  <span className="truncate">{id === winnerId ? "🏆 " : ""}{nameOf(id)}</span>
                  <span className={cn("font-bold tabular-nums", balanceClass(deltas[id] ?? 0))}>
                    {formatSignedVnd(deltas[id] ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ErrorText>{error}</ErrorText>

        {existing && (
          <button type="button" className={cn(btnDanger, "w-full")} onClick={() => setConfirmDelete(true)}>
            Xoá ván này
          </button>
        )}
      </div>
      <BottomBar>
        <button type="button" className={cn(btnPrimary, "w-full")} disabled={!canSave} onClick={save}>
          Lưu ván
        </button>
      </BottomBar>
      <ConfirmDialog
        open={confirmDelete}
        title="Xoá ván?"
        message="Số dư sẽ được tính lại như chưa có ván này."
        confirmLabel="Xoá"
        danger
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

export function RoundFormView() {
  const { id, roundId } = useParams<{ id: string; roundId?: string }>();
  return (
    <Shell>
      <SessionGate id={id}>
        {(session) => {
          const existing = roundId ? session.rounds.find((r) => r.id === roundId) : undefined;
          if (roundId && !existing) {
            return (
              <>
                <PageHeader title="Sửa ván" backHref={`/session/${session.id}`} />
                <p className="px-4 text-muted">Không tìm thấy ván này.</p>
              </>
            );
          }
          // key resets form state when switching between rounds
          return <Form key={existing?.id ?? "new"} session={session} existing={existing} />;
        }}
      </SessionGate>
    </Shell>
  );
}
