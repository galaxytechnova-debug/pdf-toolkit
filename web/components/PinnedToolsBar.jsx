"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X, GripVertical } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

const STORAGE_KEY = "pdf-toolkit-pinned-tools";
const MAX = 4;

export function readPinned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => x && x.href && x.label).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function writePinned(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {}
}

export function pinTool(item) {
  const cur = readPinned();
  if (cur.some((x) => x.href === item.href)) return cur;
  const next = [...cur, { href: item.href, label: item.label }].slice(-MAX);
  writePinned(next);
  return next;
}

export function unpinTool(href) {
  const next = readPinned().filter((x) => x.href !== href);
  writePinned(next);
  return next;
}

export default function PinnedToolsBar() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);

  useEffect(() => {
    queueMicrotask(() => setItems(readPinned()));
    function onStorage(e) {
      if (!e || e.key === STORAGE_KEY || e.key === null) queueMicrotask(() => setItems(readPinned()));
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("pdf-pinned-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pdf-pinned-changed", onStorage);
    };
  }, []);

  if (!items.length) return null;

  return (
    <div className="border-b border-indigo-100/80 bg-indigo-50/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1 text-indigo-800/80 font-medium shrink-0">
          <GripVertical className="h-4 w-4 opacity-60" aria-hidden />
          {t("pinBar")}
        </span>
        <div className="flex flex-wrap gap-2">
          {items.map((it, idx) => (
            <span
              key={it.href}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("application/x-pin-index", String(idx));
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number(e.dataTransfer.getData("application/x-pin-index"));
                if (Number.isNaN(from) || from === idx) return;
                const cur = readPinned();
                const next = [...cur];
                const [moved] = next.splice(from, 1);
                next.splice(idx, 0, moved);
                writePinned(next);
                setItems(readPinned());
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white/90 border border-indigo-200/60 px-2.5 py-1 shadow-sm cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-3.5 w-3.5 text-zinc-400 shrink-0" aria-hidden />
              <Link href={it.href} className="text-indigo-800 hover:text-indigo-950 font-medium" onClick={(e) => e.stopPropagation()}>
                {it.label}
              </Link>
              <button
                type="button"
                className="p-0.5 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                aria-label={t("unpin")}
                onClick={() => {
                  unpinTool(it.href);
                  setItems(readPinned());
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PinCurrentToolButton({ href, label }) {
  const { t } = useI18n();
  const [rev, setRev] = useState(0);
  useEffect(() => {
    function bump() {
      setRev((x) => x + 1);
    }
    window.addEventListener("pdf-pinned-changed", bump);
    return () => window.removeEventListener("pdf-pinned-changed", bump);
  }, []);
  void rev;
  const pinned = readPinned().some((x) => x.href === href);

  return (
    <button
      type="button"
      onClick={() => {
        if (pinned) unpinTool(href);
        else pinTool({ href, label });
        window.dispatchEvent(new Event("pdf-pinned-changed"));
        setRev((x) => x + 1);
      }}
      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline"
    >
      {pinned ? t("unpin") : t("pinThis")}
    </button>
  );
}
