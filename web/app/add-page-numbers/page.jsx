"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
import { PinCurrentToolButton } from "@/components/PinnedToolsBar";
import { useI18n } from "@/components/I18nProvider";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

const POSITIONS = [
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
];

export default function AddPageNumbersPage() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState("bottom-center");
  const [startAt, setStartAt] = useState(1);
  const [fontSize, setFontSize] = useState(10);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const meta = JSON.stringify({ position, startAt, fontSize });
      const blob = await postMultipart("page-numbers-pdf", { file }, { meta });
      downloadBlob(blob, "numbered.pdf");
      setFile(null);
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t("pageNumbers")}</h1>
          <p className="text-zinc-500">Add page numbers before printing or submitting.</p>
        </div>
        <PinCurrentToolButton href="/add-page-numbers" label={t("pageNumbers")} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6 bg-zinc-50 border border-zinc-100 rounded-2xl p-4">
        <label className="text-sm">
          <span className="font-medium text-zinc-700">Position</span>
          <select className="mt-1 w-full border rounded-lg px-2 py-2 bg-white" value={position} onChange={(e) => setPosition(e.target.value)}>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium text-zinc-700">Start number</span>
          <input
            type="number"
            min={1}
            className="mt-1 w-full border rounded-lg px-2 py-2 bg-white"
            value={startAt}
            onChange={(e) => setStartAt(Number(e.target.value) || 1)}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-medium text-zinc-700">Font size ({fontSize})</span>
          <input type="range" min={6} max={18} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-indigo-600" />
        </label>
      </div>

      <UploadArea
        onFiles={(fs) => {
          setError("");
          if (fs?.[0]) setFile(fs[0]);
        }}
        title="Upload PDF"
        description="Server adds numbers — fast for large files"
        color="zinc"
      />

      {file && (
        <div className="mt-6 flex items-center gap-4">
          <p className="text-sm text-zinc-600 truncate flex-1">{file.name}</p>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "…" : t("download")}
          </button>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
