"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function CompressImagePage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState("jpg");

  async function onFiles(files) {
    setError("");
    if (!files || files.length !== 1) { setError("Select a single image file."); return; }
    setBusy(true);
    try {
      const q = new URLSearchParams({ quality: String(quality), format });
      const endpoint = `compress-image?${q.toString()}`;
      const blob = await postMultipart(endpoint, { file: files[0] });
      const ext = format === 'jpg' ? 'jpg' : format;
      downloadBlob(blob, `compressed.${ext}`);
    } catch (e) { setError(e.message || "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold mb-2">Compress Image</h1>
      <p className="text-sm text-zinc-600 mb-6">Optimize JPG/PNG/WebP images.</p>
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-medium text-zinc-700 min-w-[60px]">Quality: {quality}%</label>
          <input type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full sm:w-32 accent-indigo-600" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-medium text-zinc-700">Format:</label>
          <select className="border rounded-lg px-2 py-1.5 text-sm w-full sm:w-auto bg-white" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
      </div>
      <UploadArea onFiles={onFiles} />
      {busy && <p className="mt-3 text-sm">Compressing…</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </main>
  );
}
