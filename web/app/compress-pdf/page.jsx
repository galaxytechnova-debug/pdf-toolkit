"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

import { Archive, Zap, BarChart3, Feather } from "lucide-react";
import FileSizeHint from "@/components/FileSizeHint";

export default function CompressPdfPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState("recommended");

  function onFiles(files) {
    setError("");
    if (!files || files.length !== 1) {
      setError("Please select a single PDF file.");
      return;
    }
    setFile(files[0]);
  }

  async function handleCompress() {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await postMultipart("compress-pdf", { file }, { level: compressionLevel });
      downloadBlob(blob, "compressed.pdf");
      setFile(null);
    } catch (e) {
      setError(e.message || "Failed to compress PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Compress PDF</h1>
        <p className="text-zinc-500">Reduce file size while preserving quality.</p>
      </div>

      {!file ? (
        <UploadArea
          onFiles={onFiles}
          icon={Archive}
          title="Select PDF to Compress"
          description="Drag & drop a PDF to optimize file size"
          color="emerald"
        />
      ) : (
        <div className="animate-slide-up">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Archive className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => setFile(null)} className="text-sm font-medium text-zinc-400 hover:text-zinc-600 underline decoration-zinc-300 underline-offset-4">Change File</button>
            </div>
            <div className="px-6 pb-2">
              <FileSizeHint file={file} tool="compress" />
            </div>

            <div className="p-6">
              <label className="text-sm font-medium text-zinc-700 block mb-4">Compression Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "extreme", label: "Extreme", desc: "Low quality, smallest size", icon: Zap },
                  { id: "recommended", label: "Recommended", desc: "Good quality & compression", icon: BarChart3 },
                  { id: "low", label: "Low", desc: "High quality, less compression", icon: Feather },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setCompressionLevel(opt.id)}
                    className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${compressionLevel === opt.id ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-200" : "border-zinc-200 hover:border-emerald-200 hover:bg-zinc-50"}`}
                  >
                    <opt.icon className={`h-6 w-6 mb-3 ${compressionLevel === opt.id ? "text-emerald-600" : "text-zinc-400"}`} />
                    <div className="font-medium text-sm text-zinc-900 mb-1">{opt.label}</div>
                    <div className="text-[11px] text-zinc-500 leading-tight">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-zinc-50/50 border-t border-zinc-100">
              <button
                onClick={handleCompress}
                disabled={busy}
                className="w-full rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {busy ? "Compressing PDF..." : "Compress PDF Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-shake">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 001 1 1 1 0 001-1V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        {error}
      </div>}
    </main>
  );
}
