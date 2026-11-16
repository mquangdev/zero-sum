"use client";

import { useRef, useState } from "react";
import { exportAllText, importAll } from "@/lib/store";
import { ConfirmDialog, ErrorText, btnSecondary, cardCls, cn } from "./ui";

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function backupFilename(): string {
  return `zero-sum-${new Date().toISOString().slice(0, 10)}.json`;
}

export function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onFile(file: File | undefined) {
    setError("");
    setDone(false);
    if (!file) return;
    try {
      setPending(await file.text());
    } catch {
      setError("Không đọc được tệp");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function confirmImport() {
    if (pending === null) return;
    const result = importAll(pending);
    setPending(null);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  return (
    <section className={cn(cardCls, "p-4")}>
      <h2 className="text-lg font-bold">Dữ liệu</h2>
      <p className="mt-1 text-sm text-muted">
        Dữ liệu chỉ nằm trên trình duyệt này. Xuất ra tệp JSON để sao lưu hoặc chuyển sang máy khác.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={cn(btnSecondary, "flex-1")}
          onClick={() => downloadText(backupFilename(), exportAllText())}
        >
          Xuất JSON
        </button>
        <button type="button" className={cn(btnSecondary, "flex-1")} onClick={() => fileRef.current?.click()}>
          Nhập JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      <ErrorText>{error}</ErrorText>
      {done && <p className="mt-2 text-sm font-medium text-pos">Đã khôi phục dữ liệu.</p>}
      <ConfirmDialog
        open={pending !== null}
        title="Ghi đè dữ liệu?"
        message="Toàn bộ phiên hiện tại sẽ bị thay bằng dữ liệu trong tệp."
        confirmLabel="Ghi đè"
        danger
        onConfirm={confirmImport}
        onCancel={() => setPending(null)}
      />
    </section>
  );
}
