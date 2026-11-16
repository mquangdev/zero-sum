"use client";

import { useSyncExternalStore } from "react";
import { loadTheme, saveTheme } from "./storage";
import type { ThemePreference } from "./storage";

const listeners = new Set<() => void>();
let current: ThemePreference | null = null;

function read(): ThemePreference {
  if (current === null) current = loadTheme();
  return current;
}

export function applyTheme(pref: ThemePreference) {
  const dark =
    pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(pref: ThemePreference) {
  current = pref;
  saveTheme(pref);
  applyTheme(pref);
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (read() === "system") applyTheme("system");
  };
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onChange);
  };
}

export function useTheme(): ThemePreference {
  return useSyncExternalStore(subscribe, read, () => "system" as ThemePreference);
}

/** Runs before first paint to avoid a light flash. Mirrors loadTheme()/applyTheme(). */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("zero-sum:theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
