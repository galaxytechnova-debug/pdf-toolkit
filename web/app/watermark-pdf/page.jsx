"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
import { PinCurrentToolButton } from "@/components/PinnedToolsBar";
import { useI18n } from "@/components/I18nProvider";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function WatermarkPdfPage() {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [text, setText] = useState("DRAFT");
  const [opacity, setOpacity] = useState(0.25);
  const [fontSize, setFontSize] = useState(36);
  const [placement, setPlacement] = useState("diagonal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!file || !text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const meta = JSON.stringify({ text: text.trim(), opacity, fontSize, placement });
      const blob = await postMultipart("watermark-pdf", { file }, { meta });
      downloadBlob(blob, "watermarked.pdf");
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
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t("watermarkPdf")}</h1>
          <p className="text-zinc-500">Text watermark on every page.</p>
        </div>
        <PinCurrentToolButton href="/watermark-pdf" label={t("watermarkPdf")} />
      </div>

      <div className="grid gap-4 mb-6 bg-cyan-50/50 border border-cyan-100 rounded-2xl p-4">
        <label className="text-sm font-medium text-zinc-700">
          Text
          <input className="mt-1 w-full border rounded-lg px-2 py-2 bg-white" value={text} onChange={(e) => setText(e.target.value)} maxLength={80} />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Opacity ({opacity.toFixed(2)})
          <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-cyan-700" />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Font size ({fontSize})
          <input type="range" min={10} max={72} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-cyan-700" />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Placement
          <select className="mt-1 w-full border rounded-lg px-2 py-2 bg-white" value={placement} onChange={(e) => setPlacement(e.target.value)}>
            <option value="diagonal">Diagonal</option>
            <option value="center">Center</option>
            <option value="footer">Footer</option>
          </select>
        </label>
      </div>

      <UploadArea
        onFiles={(fs) => {
          setError("");
          if (fs?.[0]) setFile(fs[0]);
        }}
        title="PDF file"
        description="Server applies watermark"
        color="cyan"
      />

      {file && (
        <button type="button" disabled={busy} onClick={run} className="mt-6 rounded-xl bg-cyan-700 text-white px-5 py-3 text-sm font-semibold disabled:opacity-50">
          {busy ? "…" : "Apply watermark"}
        </button>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
