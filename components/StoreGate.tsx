"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { resetAll, useStore } from "@/lib/store";
import type { Session } from "@/lib/types";
import { backupFilename, downloadText } from "./DataSection";
import { btnPrimary, btnSecondary, cardCls, cn } from "./ui";

function Skeleton() {
  return (
    <div className="space-y-3 px-4 pt-2" aria-busy="true" aria-label="Đang tải">
      <div className="h-20 animate-pulse rounded-2xl bg-border" />
      <div className="h-20 animate-pulse rounded-2xl bg-border" />
    </div>
  );
}

export function StoreGate({ children }: { children: (sessions: Session[]) => ReactNode }) {
  const store = useStore();
  if (store.status === "loading") return <Skeleton />;
  if (store.status === "corrupt") {
    return (
      <div className={cn(cardCls, "m-4 p-4")} role="alert">
        <h2 className="text-lg font-bold">Dữ liệu bị lỗi</h2>
        <p className="mt-2 text-muted">
          Không đọc được dữ liệu đã lưu ({store.error}). Bạn có thể tải dữ liệu thô về để kiểm tra,
          hoặc bắt đầu lại từ đầu.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={() => downloadText(backupFilename(), store.raw)}
          >
            Tải dữ liệu thô
          </button>
          <button type="button" className={btnPrimary} onClick={resetAll}>
            Bắt đầu lại
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      {store.writeError && (
        <div role="alert" className="mx-4 mb-3 rounded-xl border border-neg p-3 text-sm font-medium text-neg">
          {store.writeError}
        </div>
      )}
      {children(store.sessions)}
    </>
  );
}

export function NotFoundSession() {
  return (
    <div className="px-4 pt-10 text-center">
      <p className="text-xl font-bold">Không tìm thấy phiên</p>
      <p className="mt-2 text-muted">Phiên này không tồn tại hoặc đã bị xoá.</p>
      <Link href="/" className={cn(btnPrimary, "mt-6")}>
        Về danh sách phiên
      </Link>
    </div>
  );
}

export function SessionGate({
  id,
  children,
}: {
  id: string;
  children: (session: Session) => ReactNode;
}) {
  return (
    <StoreGate>
      {(sessions) => {
        const session = sessions.find((s) => s.id === id);
        return session ? children(session) : <NotFoundSession />;
      }}
    </StoreGate>
  );
}
