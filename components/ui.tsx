"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
export const btnPrimary = `${btn} bg-primary text-primary-fg`;
export const btnSecondary = `${btn} border border-border bg-surface text-fg`;
export const btnDanger = `${btn} border border-neg bg-surface text-neg`;
export const inputCls =
  "min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-fg placeholder:text-muted focus:outline-2 focus:outline-primary";
export const cardCls = "rounded-2xl border border-border bg-surface";

export function Shell({ children }: { children: ReactNode }) {
  return <main className="mx-auto min-h-dvh w-full max-w-md pb-32">{children}</main>;
}

export function PageHeader({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref?: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-1 bg-bg/90 px-2 backdrop-blur">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Quay lại"
          className="flex size-11 items-center justify-center rounded-xl text-2xl"
        >
          ←
        </Link>
      ) : (
        <span className="w-2" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
    </header>
  );
}

export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div role="alertdialog" aria-modal="true" aria-label={title} className={cn(cardCls, "w-full max-w-sm p-5")}>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-muted">{message}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" className={cn(btnSecondary, "flex-1")} onClick={onCancel}>
            Huỷ
          </button>
          <button
            type="button"
            className={cn(danger ? btnDanger : btnPrimary, "flex-1")}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-2 text-sm font-medium text-neg">
      {children}
    </p>
  );
}

export function balanceClass(amount: number): string {
  if (amount > 0) return "text-pos";
  if (amount < 0) return "text-neg";
  return "text-muted";
}

export function StatusChip({ finished }: { finished: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-semibold",
        finished ? "border-border text-muted" : "border-primary text-primary",
      )}
    >
      {finished ? "Đã kết thúc" : "Đang chơi"}
    </span>
  );
}
