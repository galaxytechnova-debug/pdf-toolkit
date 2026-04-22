"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
import { parsePageSpec } from "@/lib/pageSpec";
import { getPdfJs } from "@/lib/pdfjsClient";
const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

import { SplitSquareVertical } from "lucide-react";

export default function SplitPdfPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("extract");
  const [numPages, setNumPages] = useState(0);
  const [rangeSpec, setRangeSpec] = useState("1");
  const [rangeOutput, setRangeOutput] = useState("zip");

  useEffect(() => {
    let cancelled = false;
    async function count() {
      if (!file) {
        setNumPages(0);
        return;
      }
      try {
        const pdfjs = await getPdfJs();
        const buf = await file.arrayBuffer();
        const task = pdfjs.getDocument({ data: buf.slice(0) });
        const pdf = await task.promise;
        if (!cancelled) setNumPages(pdf.numPages);
      } catch {
        if (!cancelled) setNumPages(0);
      }
    }
    count();
    return () => {
      cancelled = true;
    };
  }, [file]);

  function onFiles(files) {
    setError("");
    if (!files || files.length !== 1) {
      setError("Please select a single PDF file.");
      return;
    }
    setFile(files[0]);
  }

  async function handleSplit() {
    if (!file) return;
    setBusy(true);
    try {
      if (mode === "extract") {
        const blob = await postMultipart("split-pdf", { file });
        downloadBlob(blob, "split-pages.zip");
        setFile(null);
        return;
      }
      const pages = parsePageSpec(rangeSpec, numPages);
      if (!pages || pages.length === 0) {
        setError(`Enter valid page numbers (1–${numPages || "?"}), e.g. 1,3-5`);
        return;
      }
      const meta = JSON.stringify({
        pages,
        output: rangeOutput === "single" ? "single" : "zip",
      });
      const blob = await postMultipart("split-pdf", { file }, { meta });
      downloadBlob(blob, rangeOutput === "single" ? "selected-pages.pdf" : "selected-pages.zip");
      setFile(null);
    } catch (e) {
      setError(e.message || "Failed to split PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Split PDF Document</h1>
        <p className="text-zinc-500">Extract pages or split by page numbers.</p>
      </div>

      {!file ? (
        <UploadArea
          onFiles={onFiles}
          icon={SplitSquareVertical}
          title="Select PDF to Split"
          description="Drag & drop a PDF to configure split options"
          color="orange"
        />
      ) : (
        <div className="animate-slide-up">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <SplitSquareVertical className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{file.name}</p>
                <p className="text-xs text-zinc-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                  {numPages > 0 ? ` · ${numPages} pages` : ""}
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-sm font-medium text-zinc-400 hover:text-zinc-600 underline decoration-zinc-300 underline-offset-4"
              >
                Change File
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="text-sm font-medium text-zinc-700 block mb-2">Split mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("extract")}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    mode === "extract" ? "border-orange-500 bg-orange-50/50 ring-1 ring-orange-200" : "border-zinc-200 hover:border-orange-200 hover:bg-zinc-50"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                      mode === "extract" ? "border-orange-600" : "border-zinc-300"
                    }`}
                  >
                    {mode === "extract" && <div className="h-2.5 w-2.5 rounded-full bg-orange-600" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-zinc-900">All pages (ZIP)</div>
                    <div className="text-xs text-zinc-500">One PDF per page in a ZIP file</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("range")}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    mode === "range" ? "border-orange-500 bg-orange-50/50 ring-1 ring-orange-200" : "border-zinc-200 hover:border-orange-200 hover:bg-zinc-50"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                      mode === "range" ? "border-orange-600" : "border-zinc-300"
                    }`}
                  >
                    {mode === "range" && <div className="h-2.5 w-2.5 rounded-full bg-orange-600" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-zinc-900">Custom pages</div>
                    <div className="text-xs text-zinc-500">Choose page numbers or ranges (1-based)</div>
                  </div>
                </button>
              </div>

              {mode === "range" && (
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-zinc-700">Pages (e.g. 1,3-5,8)</label>
                  <input
                    value={rangeSpec}
                    onChange={(e) => setRangeSpec(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                    placeholder="1,2,4-6"
                  />
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={rangeOutput === "zip"} onChange={() => setRangeOutput("zip")} />
                      ZIP (one PDF per selected page)
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={rangeOutput === "single"} onChange={() => setRangeOutput("single")} />
                      Single PDF (selected pages combined)
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-zinc-50/50 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleSplit}
                disabled={busy}
                className="w-full rounded-xl bg-linear-to-r from-orange-500 to-amber-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {busy ? "Working…" : "Run split"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-shake">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 001 1 1 1 0 001-1V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}
    </main>
  );
}
