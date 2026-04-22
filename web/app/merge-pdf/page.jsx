"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
import Loader from "@/components/Loader";
const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

import { Files } from "lucide-react";

export default function MergePdfPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState(null);

  function onFiles(uploadedFiles) {
    setError("");
    if (!uploadedFiles || uploadedFiles.length < 2) {
      setError("Please select at least two PDF files to merge.");
      return;
    }
    setFiles(uploadedFiles);
  }

  async function handleMerge() {
    if (!files || files.length < 2) return;
    setBusy(true);
    try {
      const blob = await postMultipart("merge-pdf", { files });
      downloadBlob(blob, "merged.pdf");
      setFiles(null);
    } catch (e) {
      setError(e.message || "Failed to merge files. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Merge PDF Files</h1>
        <p className="text-zinc-500">Combine multiple PDF documents into a single file.</p>
      </div>

      <UploadArea
        multiple
        onFiles={onFiles}
        icon={Files}
        title="Select PDFs to Merge"
        description="Drag & drop multiple files here to combine them"
        color="rose"
      />

      {files && files.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <h3 className="font-medium text-zinc-900">Selected Files ({files.length})</h3>
            <button onClick={() => { setFiles(null); setError(""); }} className="text-xs font-medium text-rose-600 hover:text-rose-700">Clear All</button>
          </div>
          <ul className="divide-y divide-zinc-100">
            {files.map((file, i) => (
              <li key={i} className="px-6 py-3 flex items-center gap-4 hover:bg-zinc-50 transition-colors">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <span className="font-bold text-sm">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="p-6 bg-zinc-50/50 border-t border-zinc-100">
            <button
              onClick={handleMerge}
              disabled={busy}
              className="w-full rounded-xl bg-linear-to-r from-rose-500 to-pink-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {busy ? "Merging PDFs..." : "Merge Files Now"}
            </button>
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
