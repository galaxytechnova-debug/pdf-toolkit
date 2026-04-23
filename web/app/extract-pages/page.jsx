"use client";
import "@/lib/pdfPolyfill";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { PDFDocument } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import { Scissors, CheckCircle2, Download } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function ExtractPagesPage() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [rangeInput, setRangeInput] = useState("");

  const onFiles = (files) => {
    setError("");
    if (files.length !== 1) { setError("Please select a single PDF."); return; }
    const f = files[0];
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setSelected(new Set());
    setRangeInput("");
  };

  const onDocLoad = ({ numPages }) => {
    setNumPages(numPages);
    const all = new Set();
    for (let i = 1; i <= numPages; i++) all.add(i);
    setSelected(all);
  };

  const togglePage = (p) => {
    const s = new Set(selected);
    s.has(p) ? s.delete(p) : s.add(p);
    setSelected(s);
  };

  const selectAll = () => {
    const s = new Set();
    for (let i = 1; i <= numPages; i++) s.add(i);
    setSelected(s);
  };

  const selectNone = () => setSelected(new Set());

  const applyRange = () => {
    if (!rangeInput.trim()) return;
    const s = new Set();
    rangeInput.split(",").forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [a, b] = trimmed.split("-").map(n => parseInt(n.trim()));
        if (!isNaN(a) && !isNaN(b)) {
          for (let i = Math.max(1, a); i <= Math.min(numPages, b); i++) s.add(i);
        }
      } else {
        const n = parseInt(trimmed);
        if (!isNaN(n) && n >= 1 && n <= numPages) s.add(n);
      }
    });
    setSelected(s);
  };

  const handleProcess = useCallback(async () => {
    if (!file || selected.size === 0) return;
    setBusy(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();

      const pageIndices = Array.from(selected).sort((a, b) => a - b).map(p => p - 1);
      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach(p => newDoc.addPage(p));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `extracted_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Extraction failed.");
    } finally {
      setBusy(false);
    }
  }, [file, selected]);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Extract Pages</h1>
        <p className="text-zinc-500">Select specific pages to extract from a PDF — perfect for printing only what you need.</p>
      </div>

      {!file ? (
        <UploadArea onFiles={onFiles} icon={Scissors} title="Select PDF" description="Drag & drop a PDF file" color="orange" />
      ) : (
        <div className="animate-slide-up space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-zinc-900">{file.name}</p>
              <p className="text-xs text-zinc-500">{numPages || "..."} pages · {selected.size} selected</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={rangeInput}
                onChange={e => setRangeInput(e.target.value)}
                placeholder="e.g. 1-5, 8, 12-15"
                className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button onClick={applyRange} className="px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium hover:bg-orange-100 transition-all">Apply</button>
              <button onClick={selectAll} className="px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-all">All</button>
              <button onClick={selectNone} className="px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-all">None</button>
              <button onClick={() => { setFile(null); setFileUrl(null); }} className="text-sm text-orange-600 font-medium hover:text-orange-700">Change File</button>
              <button
                onClick={handleProcess}
                disabled={busy || selected.size === 0}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {busy ? "Extracting..." : `Extract ${selected.size} Page${selected.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>

          {/* Hidden doc loader */}
          <Document file={fileUrl} onLoadSuccess={onDocLoad} className="hidden" />

          {/* Pages Grid */}
          {numPages && (
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                <div
                  key={pageNum}
                  onClick={() => togglePage(pageNum)}
                  className={`relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all hover:shadow-md shrink-0 ${selected.has(pageNum) ? "border-orange-400 ring-2 ring-orange-200 bg-orange-50/30" : "border-zinc-200 hover:border-zinc-300 bg-white"}`}
                  style={{ width: 140 }}
                >
                  <Document file={fileUrl}>
                    <Page pageNumber={pageNum} width={140} renderTextLayer={false} renderAnnotationLayer={false} />
                  </Document>
                  <div className={`absolute top-1.5 left-1.5 h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold ${selected.has(pageNum) ? "bg-orange-500 text-white" : "bg-zinc-200 text-zinc-600"}`}>
                    {pageNum}
                  </div>
                  {selected.has(pageNum) && (
                    <div className="absolute top-1.5 right-1.5">
                      <CheckCircle2 className="h-4 w-4 text-orange-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}


          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>
      )}
    </main>
  );
}
