"use client";
import { useCallback, useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
import { PinCurrentToolButton } from "@/components/PinnedToolsBar";
import { useI18n } from "@/components/I18nProvider";
import { Image as ImageIcon, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

export default function JpgToPdfPage() {
  const { t } = useI18n();
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orientation, setOrientation] = useState("portrait");
  const [pageSize, setPageSize] = useState("a4");

  const move = useCallback((idx, dir) => {
    setFiles((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }, []);

  const removeAt = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  async function convert() {
    if (files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const meta = JSON.stringify({
        orientation,
        pageSize,
      });
      const blob = await postMultipart(
        "jpg-to-pdf",
        { files },
        { meta }
      );
      downloadBlob(blob, "images.pdf");
      setFiles([]);
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t("jpgToPdf")}</h1>
          <p className="text-zinc-500">Photos and scans → one print-ready PDF (A4 / Letter).</p>
        </div>
        <PinCurrentToolButton href="/jpg-to-pdf" label={t("jpgToPdf")} />
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-sm">
        <label className="flex items-center gap-2">
          Orientation
          <select className="border rounded-lg px-2 py-1 bg-white" value={orientation} onChange={(e) => setOrientation(e.target.value)}>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Page size
          <select className="border rounded-lg px-2 py-1 bg-white" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
            <option value="a4">A4</option>
            <option value="a3">A3</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-yellow-400 bg-yellow-50/40 p-8 text-center cursor-pointer hover:bg-yellow-50/70">
        <ImageIcon className="h-10 w-10 mx-auto text-yellow-600" />
        <span className="font-medium text-zinc-800">Add images (JPG, PNG, WebP)</span>
        <span className="text-xs text-zinc-500">Multiple files · reorder below</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            setError("");
            const list = Array.from(e.target.files || []);
            if (list.length) setFiles((f) => [...f, ...list]);
            e.target.value = "";
          }}
        />
      </label>

      {files.length > 0 && (
        <ul className="mt-6 divide-y rounded-xl border border-zinc-200 bg-white">
          {files.map((f, idx) => (
            <li key={`${f.name}-${idx}`} className="flex items-center gap-3 p-3 text-sm">
              <span className="w-6 text-zinc-400 font-mono text-xs">{idx + 1}</span>
              <span className="flex-1 truncate">{f.name}</span>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1 rounded hover:bg-zinc-100" aria-label="Up" onClick={() => move(idx, -1)}>
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 rounded hover:bg-zinc-100" aria-label="Down" onClick={() => move(idx, 1)}>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 rounded hover:bg-red-50 text-red-600" aria-label="Remove" onClick={() => removeAt(idx)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={convert}
          disabled={busy || files.length === 0}
          className="rounded-xl bg-yellow-600 text-white px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Building…" : "Build PDF"}
        </button>
        {files.length > 0 && (
          <button type="button" className="text-sm text-zinc-500 underline" onClick={() => setFiles([])}>
            {t("clear")}
          </button>
        )}
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
