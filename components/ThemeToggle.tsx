"use client";

import { setTheme, useTheme } from "@/lib/theme";
import type { ThemePreference } from "@/lib/storage";

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};
const LABEL: Record<ThemePreference, string> = {
  system: "Tự động",
  light: "Sáng",
  dark: "Tối",
};
const ICON: Record<ThemePreference, string> = { system: "🖥️", light: "☀️", dark: "🌙" };

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const theme = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Giao diện: ${LABEL[theme]}. Bấm để đổi`}
      className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-2 text-base"
    >
      <span aria-hidden>{ICON[theme]}</span>
      {withLabel && <span className="font-semibold">{LABEL[theme]}</span>}
    </button>
  );
}
