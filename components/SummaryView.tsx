"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { formatSignedVnd, formatSummaryText, formatVnd, minimalTransfers, sessionBalances } from "@/lib/settlement";
import { replaceSession } from "@/lib/store";
import { setStatus } from "@/lib/sessions";
import type { Session } from "@/lib/types";
import { SessionGate } from "./StoreGate";
import { BottomBar, PageHeader, Shell, balanceClass, btnPrimary, btnSecondary, cardCls, cn } from "./ui";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function Summary({ session }: { session: Session }) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const balances = sessionBalances(session);
  const ranked = [...session.players]
    .filter((p) => !p.archived || balances[p.id] !== 0)
    .sort((a, b) => balances[b.id] - balances[a.id]);
  const transfers = minimalTransfers(balances);
  const nameOf = (id: string) => session.players.find((p) => p.id === id)?.name ?? "?";
  const finished = session.status === "finished";

  async function copy() {
    setCopied((await copyText(formatSummaryText(session))) ? "ok" : "fail");
    setTimeout(() => setCopied("idle"), 2500);
  }

  return (
    <>
      <PageHeader title="Tổng kết" backHref={`/session/${session.id}`} />
      <div className="space-y-5 px-4">
        <p className="text-sm text-muted">
          {session.name} · {session.rounds.length} ván · {formatVnd(session.unitPrice)}/{session.unitLabel}
        </p>

        <section className={cn(cardCls, "p-4")} aria-label="Số dư cuối">
          <h2 className="text-sm font-semibold text-muted">Số dư cuối</h2>
          <ul className="mt-2 divide-y divide-border">
            {ranked.map((p) => (
              <li key={p.id} className="flex min-h-11 items-center justify-between gap-2">
                <span className="truncate font-medium">{p.name}</span>
                <span className={cn("text-lg font-bold tabular-nums", balanceClass(balances[p.id]))}>
                  {formatSignedVnd(balances[p.id])}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(cardCls, "p-4")} aria-label="Chuyển khoản">
          <h2 className="text-sm font-semibold text-muted">Ai chuyển cho ai</h2>
          {transfers.length === 0 ? (
            <p className="mt-2 text-muted">Không ai nợ ai.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {transfers.map((t) => (
                <li key={`${t.from}-${t.to}`} className="flex min-h-11 items-center justify-between gap-2">
                  <span className="min-w-0 truncate">
                    <b>{nameOf(t.from)}</b> → <b>{nameOf(t.to)}</b>
                  </span>
                  <span className="font-bold tabular-nums">{formatVnd(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button type="button" className={cn(btnSecondary, "w-full")} onClick={copy}>
          {copied === "ok" ? "Đã sao chép ✓" : copied === "fail" ? "Không sao chép được" : "Sao chép kết quả"}
        </button>
      </div>
      <BottomBar>
        {finished ? (
          <button
            type="button"
            className={cn(btnSecondary, "w-full")}
            onClick={() => replaceSession(setStatus(session, "active"))}
          >
            Mở lại phiên
          </button>
        ) : (
          <button
            type="button"
            className={cn(btnPrimary, "w-full")}
            onClick={() => replaceSession(setStatus(session, "finished"))}
          >
            Kết thúc phiên
          </button>
        )}
      </BottomBar>
    </>
  );
}

export function SummaryView() {
  const { id } = useParams<{ id: string }>();
  return (
    <Shell>
      <SessionGate id={id}>{(session) => <Summary session={session} />}</SessionGate>
    </Shell>
  );
}
