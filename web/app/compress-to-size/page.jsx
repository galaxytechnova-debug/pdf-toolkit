"use client";
import "@/lib/pdfPolyfill";
import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { PDFDocument } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import { Target, Download, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function CompressToSizePage() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [targetKB, setTargetKB] = useState(200);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const onFiles = (files) => {
    setError("");
    setResult(null);
    if (files.length !== 1) { setError("Please select a single PDF file."); return; }
    const f = files[0];
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
  };

  useEffect(() => {
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [fileUrl]);

  const handleProcess = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    setProgress("Reading file...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalSize = arrayBuffer.byteLength;
      const targetBytes = targetKB * 1024;

      if (originalSize <= targetBytes) {
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        setResult({ blob, name: `compressed_${file.name}`, originalSize, finalSize: originalSize });
        setBusy(false);
        setProgress("");
        return;
      }

      setProgress("Analyzing PDF structure...");
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      pdfDoc.setTitle("");
      pdfDoc.setAuthor("");
      pdfDoc.setSubject("");
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer("");
      pdfDoc.setCreator("");

      setProgress("Optimizing pages...");

      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(pdfDoc, pages.map((_, i) => i));
      copiedPages.forEach(p => newDoc.addPage(p));

      newDoc.setTitle("");
      newDoc.setAuthor("");
      newDoc.setSubject("");
      newDoc.setKeywords([]);
      newDoc.setProducer("");
      newDoc.setCreator("");

      let pdfBytes = await newDoc.save({ useObjectStreams: true, addDefaultPage: false });
      setProgress(`Compressed: ${(pdfBytes.byteLength / 1024).toFixed(0)} KB`);

      if (pdfBytes.byteLength > targetBytes) {
        const minDoc = await PDFDocument.load(pdfBytes);
        pdfBytes = await minDoc.save({ useObjectStreams: true });
        setProgress(`Re-optimized: ${(pdfBytes.byteLength / 1024).toFixed(0)} KB`);
      }

      const finalSize = pdfBytes.byteLength;
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResult({ blob, name: `compressed_${file.name}`, originalSize, finalSize });
      setProgress("");
    } catch (err) {
      setError(err.message || "Compression failed.");
    } finally {
      setBusy(false);
    }
  }, [file, targetKB]);

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {!file ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Compress to Target Size</h1>
            <p className="text-zinc-500">Set your target file size and download a PDF guaranteed to be under that limit.</p>
          </div>
          <div className="w-full max-w-xl">
            <UploadArea onFiles={onFiles} icon={Target} title="Select PDF to Compress" description="Drag & drop a PDF file" color="amber" />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Customization */}
          <div className="w-full md:w-[360px] border-r border-zinc-200 bg-white overflow-y-auto shrink-0">
            <div className="p-5 border-b border-zinc-100">
              <h1 className="text-lg font-bold text-zinc-900 mb-1">Compress to Target Size</h1>
              <p className="text-xs text-zinc-500">Optimize your PDF to meet portal upload limits.</p>
            </div>

            {/* File Info */}
            <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 text-sm truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
              </div>
              <button onClick={() => { setFile(null); setFileUrl(null); setResult(null); }} className="text-xs font-medium text-amber-600 hover:text-amber-700 shrink-0">Change</button>
            </div>

            <div className="p-4 space-y-5">
              {/* Target Size Presets */}
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-2">Target File Size</label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1024].map(kb => (
                    <button
                      key={kb}
                      onClick={() => setTargetKB(kb)}
                      className={`rounded-lg py-2 text-xs font-medium border transition-all ${targetKB === kb ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"}`}
                    >
                      {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                    </button>
                  ))}
                </div>
                <input
                  type="number" min="50" max="10240" value={targetKB}
                  onChange={e => setTargetKB(Math.max(50, parseInt(e.target.value) || 200))}
                  className="mt-2 w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Custom size in KB..."
                />
              </div>

              {/* Compress Button */}
              <button
                onClick={handleProcess}
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> {progress || "Compressing..."}
                  </span>
                ) : "Compress to Target Size"}
              </button>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              {/* Result */}
              {result && (
                <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-3 animate-slide-up">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white p-3 text-center border border-zinc-100">
                      <p className="text-[10px] text-zinc-500 mb-0.5">Original</p>
                      <p className="text-sm font-bold text-zinc-900">{formatSize(result.originalSize)}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3 text-center border border-emerald-100">
                      <p className="text-[10px] text-emerald-600 mb-0.5">Compressed</p>
                      <p className="text-sm font-bold text-emerald-700">{formatSize(result.finalSize)}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${result.finalSize <= targetKB * 1024 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {result.finalSize <= targetKB * 1024 ? `✓ Under ${targetKB} KB` : `Over — manual reduction may be needed`}
                    </span>
                  </div>
                  <button onClick={downloadResult} className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2.5 text-sm font-semibold text-white hover:from-emerald-600 hover:to-teal-700 transition-all active:scale-[0.98]">
                    <Download className="h-4 w-4 inline mr-1.5 -mt-0.5" /> Download
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: PDF Preview */}
          <div className="flex-1 flex flex-col bg-zinc-100 overflow-hidden">
            <div className="p-3 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
              <span className="text-sm font-medium text-zinc-700">Preview — Page {currentPage} of {numPages || "..."}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1.5 rounded-lg border text-zinc-500 disabled:opacity-30 hover:bg-zinc-50"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))} disabled={currentPage >= numPages} className="p-1.5 rounded-lg border text-zinc-500 disabled:opacity-30 hover:bg-zinc-50"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex-1 flex items-start justify-center overflow-auto p-6">
              <div className="shadow-xl rounded-lg overflow-hidden bg-white">
                <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                  <Page pageNumber={currentPage} width={Math.min(600, typeof window !== "undefined" ? window.innerWidth - 420 : 600)} />
                </Document>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
