"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSession, defaultSessionName, validatePlayerName } from "@/lib/sessions";
import { formatVnd } from "@/lib/settlement";
import { addSession } from "@/lib/store";
import type { UnitLabel } from "@/lib/types";
import { StoreGate } from "./StoreGate";
import { BottomBar, ErrorText, PageHeader, Shell, btnPrimary, btnSecondary, cardCls, cn, inputCls } from "./ui";

const PRESETS = [1000, 2000, 5000, 10000, 20000];

export function NewSessionView() {
  const router = useRouter();
  const [unit, setUnit] = useState<UnitLabel>("bi");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("5000");
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const priceNumber = Number(price.replace(/\D/g, "")) || 0;

  function addDraft(): boolean {
    if (draft.trim() === "") return true;
    const check = validatePlayerName(draft, names.map((n, i) => ({ id: String(i), name: n })));
    if (!check.ok) {
      setError(check.error);
      return false;
    }
    setNames([...names, check.value]);
    setDraft("");
    setError("");
    return true;
  }

  function submit() {
    const pending = draft.trim() === "" ? names : [...names, draft];
    const result = createSession({ name, unitLabel: unit, unitPrice: priceNumber, playerNames: pending });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    addSession(result.value);
    router.replace(`/session/${result.value.id}`);
  }

  return (
    <Shell>
      <PageHeader title="Tạo phiên mới" backHref="/" />
      <StoreGate>
        {() => (
          <div className="space-y-5 px-4">
            <section className={cn(cardCls, "p-4")}>
              <label className="block text-sm font-semibold" htmlFor="name">
                Tên phiên
              </label>
              <input
                id="name"
                className={cn(inputCls, "mt-1")}
                value={name}
                placeholder={defaultSessionName(unit)}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
              />

              <p className="mt-4 text-sm font-semibold">Đơn vị tính</p>
              <div className="mt-1 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Đơn vị tính">
                {(["bi", "lá"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="radio"
                    aria-checked={unit === u}
                    onClick={() => setUnit(u)}
                    className={unit === u ? btnPrimary : btnSecondary}
                  >
                    {u === "bi" ? "Bi (bi-a)" : "Lá (bài)"}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-sm font-semibold" htmlFor="price">
                Giá mỗi {unit} (VND)
              </label>
              <input
                id="price"
                className={cn(inputCls, "mt-1")}
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 9))}
              />
              <p className="mt-1 text-sm text-muted">
                {priceNumber > 0 ? `${formatVnd(priceNumber)} / ${unit}` : "Nhập giá lớn hơn 0"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrice(String(p))}
                    className={cn(
                      "min-h-11 rounded-xl border px-3 text-sm font-semibold",
                      priceNumber === p ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface",
                    )}
                  >
                    {formatVnd(p)}
                  </button>
                ))}
              </div>
            </section>

            <section className={cn(cardCls, "p-4")}>
              <label className="block text-sm font-semibold" htmlFor="player">
                Người chơi (tối thiểu 2)
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="player"
                  className={inputCls}
                  value={draft}
                  placeholder="Tên người chơi"
                  enterKeyHint="done"
                  maxLength={30}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDraft();
                    }
                  }}
                />
                <button type="button" className={btnSecondary} onClick={addDraft}>
                  Thêm
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {names.map((n, i) => (
                  <li key={n} className="flex min-h-11 items-center justify-between rounded-xl border border-border px-3">
                    <span className="truncate font-medium">{n}</span>
                    <button
                      type="button"
                      aria-label={`Xoá ${n}`}
                      className="flex size-11 items-center justify-center text-xl text-neg"
                      onClick={() => setNames(names.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <ErrorText>{error}</ErrorText>
            </section>
          </div>
        )}
      </StoreGate>
      <BottomBar>
        <button type="button" className={cn(btnPrimary, "w-full")} onClick={submit}>
          Bắt đầu chơi
        </button>
      </BottomBar>
    </Shell>
  );
}
