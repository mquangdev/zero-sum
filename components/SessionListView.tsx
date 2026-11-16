"use client";

import Link from "next/link";
import { StoreGate } from "./StoreGate";
import { ThemeToggle } from "./ThemeToggle";
import { BottomBar, PageHeader, Shell, StatusChip, btnPrimary, cardCls, cn } from "./ui";

export function SessionListView() {
  return (
    <Shell>
      <PageHeader title="Zero Sum" right={<ThemeToggle />} />
      <StoreGate>
        {(sessions) => (
          <>
            {sessions.length === 0 ? (
              <div className="px-6 pt-16 text-center">
                <p className="text-5xl" aria-hidden>
                  🎱
                </p>
                <p className="mt-4 text-xl font-bold">Chưa có phiên nào</p>
                <p className="mt-2 text-muted">
                  Tạo một phiên, thêm người chơi rồi ghi tiền từng ván. Không cần đăng nhập.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 px-4">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <Link href={`/session/${s.id}`} className={cn(cardCls, "block min-h-11 p-4")}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 truncate text-lg font-bold">{s.name}</span>
                        <StatusChip finished={s.status === "finished"} />
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {new Date(s.createdAt).toLocaleDateString("vi-VN")} · {s.players.length} người ·{" "}
                        {s.rounds.length} ván
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <BottomBar>
              <Link href="/new" className={cn(btnPrimary, "w-full")}>
                + Tạo phiên mới
              </Link>
            </BottomBar>
          </>
        )}
      </StoreGate>
    </Shell>
  );
}
