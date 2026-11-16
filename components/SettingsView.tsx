"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  addPlayer,
  isValidPrice,
  playerHasRounds,
  removePlayer,
  setPlayerArchived,
  setStatus,
  updateSettings,
} from "@/lib/sessions";
import { formatVnd } from "@/lib/settlement";
import { deleteSession, replaceSession } from "@/lib/store";
import type { Session, UnitLabel } from "@/lib/types";
import { DataSection } from "./DataSection";
import { SessionGate } from "./StoreGate";
import { ThemeToggle } from "./ThemeToggle";
import { ConfirmDialog, ErrorText, PageHeader, Shell, btnDanger, btnPrimary, btnSecondary, cardCls, cn, inputCls } from "./ui";

function SettingsForm({ session }: { session: Session }) {
  const [name, setName] = useState(session.name);
  const [unit, setUnit] = useState<UnitLabel>(session.unitLabel);
  const [price, setPrice] = useState(String(session.unitPrice));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const priceNumber = Number(price) || 0;

  function save() {
    const result = updateSettings(session, { name, unitLabel: unit, unitPrice: priceNumber });
    if (!result.ok) {
      setError(result.error);
      setSaved(false);
      return;
    }
    replaceSession(result.value);
    setError("");
    setSaved(true);
  }

  return (
    <section className={cn(cardCls, "p-4")}>
      <h2 className="text-lg font-bold">Thông tin phiên</h2>
      <label className="mt-3 block text-sm font-semibold" htmlFor="s-name">
        Tên phiên
      </label>
      <input id="s-name" className={cn(inputCls, "mt-1")} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      <p className="mt-3 text-sm font-semibold">Đơn vị tính</p>
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
            {u}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-sm font-semibold" htmlFor="s-price">
        Giá mỗi {unit} (VND)
      </label>
      <input
        id="s-price"
        className={cn(inputCls, "mt-1")}
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 9))}
      />
      <p className="mt-1 text-sm text-muted">
        {isValidPrice(priceNumber) ? formatVnd(priceNumber) : "Giá phải lớn hơn 0"}. Giá mới chỉ áp dụng cho ván
        tiếp theo.
      </p>
      <ErrorText>{error}</ErrorText>
      <button type="button" className={cn(btnPrimary, "mt-3 w-full")} onClick={save}>
        {saved ? "Đã lưu ✓" : "Lưu thay đổi"}
      </button>
    </section>
  );
}

function PlayersSection({ session }: { session: Session }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function add() {
    if (draft.trim() === "") return;
    const result = addPlayer(session, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    replaceSession(result.value);
    setDraft("");
    setError("");
  }

  return (
    <section className={cn(cardCls, "p-4")}>
      <h2 className="text-lg font-bold">Người chơi</h2>
      <ul className="mt-2 divide-y divide-border">
        {session.players.map((p) => {
          const used = playerHasRounds(session, p.id);
          return (
            <li key={p.id} className="flex min-h-12 items-center justify-between gap-2">
              <span className={cn("truncate font-medium", p.archived && "text-muted line-through")}>{p.name}</span>
              <span className="flex gap-1">
                <button
                  type="button"
                  className={cn(btnSecondary, "min-h-11 px-3 text-sm")}
                  onClick={() => replaceSession(setPlayerArchived(session, p.id, !p.archived))}
                >
                  {p.archived ? "Hiện" : "Ẩn"}
                </button>
                {!used && (
                  <button
                    type="button"
                    aria-label={`Xoá ${p.name}`}
                    disabled={session.players.length <= 2}
                    className={cn(btnDanger, "min-h-11 px-3 text-sm")}
                    onClick={() => {
                      const r = removePlayer(session, p.id);
                      if (r.ok) replaceSession(r.value);
                      else setError(r.error);
                    }}
                  >
                    Xoá
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">Người đã có ván chỉ có thể ẩn, số dư cũ vẫn được giữ.</p>
      <div className="mt-3 flex gap-2">
        <input
          className={inputCls}
          aria-label="Tên người chơi mới"
          placeholder="Thêm người chơi"
          value={draft}
          maxLength={30}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className={btnSecondary} onClick={add}>
          Thêm
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
    </section>
  );
}

function Settings({ session }: { session: Session }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const finished = session.status === "finished";

  return (
    <>
      <PageHeader title="Cài đặt phiên" backHref={`/session/${session.id}`} />
      <div className="space-y-5 px-4">
        <SettingsForm key={session.id} session={session} />
        <PlayersSection session={session} />

        <section className={cn(cardCls, "p-4")}>
          <h2 className="text-lg font-bold">Giao diện</h2>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted">Sáng / tối / theo hệ thống</span>
            <ThemeToggle withLabel />
          </div>
        </section>

        <section className={cn(cardCls, "space-y-2 p-4")}>
          <h2 className="text-lg font-bold">Trạng thái</h2>
          <button
            type="button"
            className={cn(btnSecondary, "w-full")}
            onClick={() => replaceSession(setStatus(session, finished ? "active" : "finished"))}
          >
            {finished ? "Mở lại phiên" : "Kết thúc phiên"}
          </button>
          <button type="button" className={cn(btnDanger, "w-full")} onClick={() => setConfirmDelete(true)}>
            Xoá phiên
          </button>
        </section>

        <DataSection />
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Xoá phiên?"
        message={`Phiên "${session.name}" và toàn bộ ${session.rounds.length} ván sẽ bị xoá vĩnh viễn.`}
        confirmLabel="Xoá phiên"
        danger
        onConfirm={() => {
          router.replace("/");
          deleteSession(session.id);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

export function SettingsView() {
  const { id } = useParams<{ id: string }>();
  return (
    <Shell>
      <SessionGate id={id}>{(session) => <Settings session={session} />}</SessionGate>
    </Shell>
  );
}
