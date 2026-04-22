"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
import { PinCurrentToolButton } from "@/components/PinnedToolsBar";
import { useI18n } from "@/components/I18nProvider";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function ResizePdfPage() {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState("a4");
  const [mode, setMode] = useState("fit");
  const [landscape, setLandscape] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const meta = JSON.stringify({ target, mode, landscape });
      const blob = await postMultipart("resize-pdf", { file }, { meta });
      downloadBlob(blob, "resized.pdf");
      setFile(null);
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
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t("resizePdf")}</h1>
          <p className="text-zinc-500">Fit or stretch every page to a standard paper size.</p>
        </div>
        <PinCurrentToolButton href="/resize-pdf" label={t("resizePdf")} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6 bg-violet-50/50 border border-violet-100 rounded-2xl p-4 text-sm">
        <label className="flex flex-col gap-1 font-medium text-zinc-700">
          Target size
          <select className="border rounded-lg px-2 py-2 bg-white" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="a4">A4</option>
            <option value="a3">A3</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 font-medium text-zinc-700">
          Mode
          <select className="border rounded-lg px-2 py-2 bg-white" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="fit">Fit (keep aspect, letterbox)</option>
            <option value="stretch">Stretch to fill</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 sm:col-span-2 cursor-pointer">
          <input type="checkbox" checked={landscape} onChange={(e) => setLandscape(e.target.checked)} />
          Landscape orientation
        </label>
      </div>

      <UploadArea
        onFiles={(fs) => {
          setError("");
          if (fs?.[0]) setFile(fs[0]);
        }}
        title="PDF to resize"
        description="One file"
        color="violet"
      />

      {file && (
        <button type="button" disabled={busy} onClick={run} className="mt-6 rounded-xl bg-violet-700 text-white px-5 py-3 text-sm font-semibold disabled:opacity-50">
          {busy ? "…" : "Resize and download"}
        </button>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
