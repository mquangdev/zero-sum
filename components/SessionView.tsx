"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { formatSignedVnd, formatVnd, roundDeltas, sessionBalances } from "@/lib/settlement";
import { replaceSession } from "@/lib/store";
import { setStatus } from "@/lib/sessions";
import type { Round, Session } from "@/lib/types";
import { SessionGate } from "./StoreGate";
import { BottomBar, PageHeader, Shell, StatusChip, balanceClass, btnPrimary, btnSecondary, cardCls, cn } from "./ui";

function RoundRow({ session, round, index }: { session: Session; round: Round; index: number }) {
  const nameOf = (id: string) => session.players.find((p) => p.id === id)?.name ?? "?";
  const deltas = roundDeltas(round);
  const finished = session.status === "finished";
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold">Ván {index}</span>
        <span className="text-xs text-muted">
          {new Date(round.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <p className="mt-1 flex justify-between gap-2">
        <span className="truncate">🏆 {nameOf(round.winnerId)}</span>
        <span className={cn("font-semibold", balanceClass(deltas[round.winnerId]))}>
          {formatSignedVnd(deltas[round.winnerId])}
        </span>
      </p>
      <ul className="mt-1 space-y-0.5 text-sm text-muted">
        {round.losses.map((l) => (
          <li key={l.playerId} className="flex justify-between gap-2">
            <span className="truncate">
              {nameOf(l.playerId)} còn {l.remaining} {session.unitLabel}
            </span>
            <span className={balanceClass(deltas[l.playerId])}>{formatSignedVnd(deltas[l.playerId])}</span>
          </li>
        ))}
      </ul>
    </>
  );
  return finished ? (
    <div className={cn(cardCls, "p-3")}>{body}</div>
  ) : (
    <Link
      href={`/session/${session.id}/round/${round.id}`}
      aria-label={`Sửa ván ${index}`}
      className={cn(cardCls, "block p-3")}
    >
      {body}
    </Link>
  );
}

function Detail({ session }: { session: Session }) {
  const balances = sessionBalances(session);
  const finished = session.status === "finished";
  const ranked = session.players
    .filter((p) => !p.archived || session.rounds.some((r) => r.winnerId === p.id || r.losses.some((l) => l.playerId === p.id)))
    .sort((a, b) => balances[b.id] - balances[a.id]);

  return (
    <>
      <PageHeader
        title={session.name}
        backHref="/"
        right={
          <Link
            href={`/session/${session.id}/settings`}
            aria-label="Cài đặt phiên"
            className="flex size-11 items-center justify-center rounded-xl text-xl"
          >
            ⚙️
          </Link>
        }
      />
      <div className="space-y-5 px-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <StatusChip finished={finished} />
          <span>
            {formatVnd(session.unitPrice)}/{session.unitLabel} · {session.rounds.length} ván
          </span>
        </div>

        <section className={cn(cardCls, "p-4")} aria-label="Bảng điểm">
          <h2 className="text-sm font-semibold text-muted">Bảng điểm</h2>
          <ul className="mt-2 divide-y divide-border">
            {ranked.map((p) => (
              <li key={p.id} className="flex min-h-11 items-center justify-between gap-2">
                <span className="truncate font-medium">
                  {p.name}
                  {p.archived && <span className="ml-1 text-xs text-muted">(đã ẩn)</span>}
                </span>
                <span className={cn("text-lg font-bold tabular-nums", balanceClass(balances[p.id]))}>
                  {formatSignedVnd(balances[p.id])}
                </span>
              </li>
            ))}
          </ul>
          <Link href={`/session/${session.id}/summary`} className={cn(btnSecondary, "mt-3 w-full")}>
            Tổng kết
          </Link>
        </section>

        <section aria-label="Lịch sử ván">
          <h2 className="mb-2 text-sm font-semibold text-muted">Lịch sử ván</h2>
          {session.rounds.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
              Chưa có ván nào. Bấm &quot;Thêm ván&quot; để bắt đầu ghi.
            </p>
          ) : (
            <ul className="space-y-2">
              {session.rounds
                .map((round, i) => ({ round, index: i + 1 }))
                .reverse()
                .map(({ round, index }) => (
                  <li key={round.id}>
                    <RoundRow session={session} round={round} index={index} />
                  </li>
                ))}
            </ul>
          )}
          {finished && session.rounds.length > 0 && (
            <p className="mt-2 text-center text-sm text-muted">Mở lại phiên để sửa hoặc xoá ván.</p>
          )}
        </section>
      </div>
      <BottomBar>
        {finished ? (
          <button
            type="button"
            className={cn(btnPrimary, "w-full")}
            onClick={() => replaceSession(setStatus(session, "active"))}
          >
            Phiên đã kết thúc · Mở lại
          </button>
        ) : (
          <Link href={`/session/${session.id}/round`} className={cn(btnPrimary, "w-full")}>
            + Thêm ván
          </Link>
        )}
      </BottomBar>
    </>
  );
}

export function SessionView() {
  const { id } = useParams<{ id: string }>();
  return (
    <Shell>
      <SessionGate id={id}>{(session) => <Detail session={session} />}</SessionGate>
    </Shell>
  );
}
