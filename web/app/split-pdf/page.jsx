"use client";
import "@/lib/pdfPolyfill";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import { postMultipart, downloadBlob } from "@/lib/api";
import { SplitSquareVertical, CheckCircle2, Download } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function SplitPdfPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("extract"); // 'extract' or 'range'
  
  const [numPages, setNumPages] = useState(null);
  const [selectedPages, setSelectedPages] = useState(new Set());

  function onFiles(files) {
    setError("");
    if (!files || files.length !== 1) {
      setError("Please select a single PDF file.");
      return;
    }
    setFile(files[0]);
    setSelectedPages(new Set());
    setNumPages(null);
  }

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    // By default, select all pages
    const initialSet = new Set();
    for (let i = 1; i <= numPages; i++) initialSet.add(i);
    setSelectedPages(initialSet);
  };

  const togglePage = (pageNum) => {
    const newSet = new Set(selectedPages);
    if (newSet.has(pageNum)) {
      newSet.delete(pageNum);
    } else {
      newSet.add(pageNum);
    }
    setSelectedPages(newSet);
  };

  async function handleSplit() {
    if (!file) return;
    setBusy(true);
    try {
      if (mode === "extract") {
        // Use existing backend for extract all
        const blob = await postMultipart("split-pdf", { file });
        downloadBlob(blob, "split-pages.zip");
        setFile(null);
      } else {
        // Custom Range - Frontend generation of a new PDF with selected pages
        if (selectedPages.size === 0) {
            throw new Error("Please select at least one page to extract.");
        }
        const arrayBuffer = await file.arrayBuffer();
        const originalPdf = await PDFDocument.load(arrayBuffer);
        const newPdf = await PDFDocument.create();
        
        // Convert to array and sort
        const pagesToExtract = Array.from(selectedPages).sort((a, b) => a - b);
        
        const copiedPages = await newPdf.copyPages(
            originalPdf,
            pagesToExtract.map(p => p - 1)
        );
        
        copiedPages.forEach(p => newPdf.addPage(p));
        
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `print_ready_${file.name}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      setError(e.message || "Failed to split PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Split PDF Document</h1>
        <p className="text-zinc-500">Extract all pages or select exactly which pages you want to print.</p>
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
        <div className="animate-slide-up grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6 sticky top-20">
                <div className="p-6 border-b border-zinc-100 flex items-center gap-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
                    <SplitSquareVertical className="h-6 w-6" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-zinc-900 truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="p-6 space-y-4 border-b border-zinc-100">
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Split Mode</label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => setMode("extract")}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${mode === "extract" ? "border-orange-500 bg-orange-50/50 ring-1 ring-orange-200" : "border-zinc-200 hover:border-orange-200 hover:bg-zinc-50"}`}
                    >
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${mode === "extract" ? "border-orange-600" : "border-zinc-300"}`}>
                        {mode === "extract" && <div className="h-2.5 w-2.5 rounded-full bg-orange-600" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-zinc-900">Extract All Pages</div>
                        <div className="text-xs text-zinc-500">Save every page separately (ZIP)</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setMode("range")}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${mode === "range" ? "border-orange-500 bg-orange-50/50 ring-1 ring-orange-200" : "border-zinc-200 hover:border-orange-200 hover:bg-zinc-50"}`}
                    >
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${mode === "range" ? "border-orange-600" : "border-zinc-300"}`}>
                        {mode === "range" && <div className="h-2.5 w-2.5 rounded-full bg-orange-600" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-zinc-900">Print-Ready Select</div>
                        <div className="text-xs text-zinc-500">Select specific pages visually</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-zinc-50/50">
                  <button
                    onClick={handleSplit}
                    disabled={busy || (mode === 'range' && selectedPages.size === 0)}
                    className="w-full rounded-xl bg-linear-to-r from-orange-500 to-amber-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {busy ? "Processing..." : (mode === 'range' ? <><Download className="h-4 w-4" /> Download Selected</> : "Extract Pages")}
                  </button>
                  <button onClick={() => setFile(null)} className="w-full text-center mt-4 text-sm font-medium text-zinc-500 hover:text-zinc-700">Cancel</button>
                </div>
              </div>
          </div>
          
          <div className="lg:col-span-2">
              {mode === "range" ? (
                  <div className="bg-zinc-100 p-6 rounded-2xl border border-zinc-200">
                      <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-zinc-900">Select Pages</h3>
                          <div className="text-sm text-zinc-500">
                              {selectedPages.size} of {numPages} selected
                          </div>
                      </div>
                      <Document
                        file={file}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="text-center text-zinc-500 p-20 animate-pulse">Loading pages...</div>}
                        error={<div className="text-center text-red-500 p-20">Failed to load PDF.</div>}
                        className="hidden"
                      />
                      
                      {numPages && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-300">
                              {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => {
                                  const isSelected = selectedPages.has(pageNum);
                                  return (
                                      <div 
                                        key={pageNum}
                                        onClick={() => togglePage(pageNum)}
                                        className={`relative group bg-white p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col ${isSelected ? "border-orange-500 ring-2 ring-orange-200" : "border-transparent hover:border-orange-300"}`}
                                      >
                                          <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-zinc-500">
                                            <span>Page {pageNum}</span>
                                            {isSelected && <CheckCircle2 className="h-4 w-4 text-orange-500" />}
                                          </div>
                                          <div className={`flex-1 bg-zinc-50 rounded-lg overflow-hidden flex items-center justify-center border aspect-[3/4] relative pointer-events-none transition-colors ${isSelected ? "border-orange-200" : "border-zinc-100"}`}>
                                              <Document file={file}>
                                                  <Page pageNumber={pageNum} width={120} renderTextLayer={false} renderAnnotationLayer={false} />
                                              </Document>
                                              {!isSelected && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]" />}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="bg-white p-12 rounded-2xl border border-zinc-200 flex flex-col items-center justify-center text-center h-full border-dashed">
                      <div className="h-16 w-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mb-4">
                          <SplitSquareVertical className="h-8 w-8" />
                      </div>
                      <h3 className="font-semibold text-zinc-900 mb-2">Ready to Extract</h3>
                      <p className="text-zinc-500 text-sm max-w-sm">Every page in this document will be saved as an individual PDF inside a ZIP archive.</p>
                  </div>
              )}

              {error && <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-shake">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 001 1 1 1 0 001-1V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>}
          </div>
        </div>
      )}
    </main>
  );
}
