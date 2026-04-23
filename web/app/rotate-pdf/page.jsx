"use client";
import "@/lib/pdfPolyfill";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, degrees } from "pdf-lib";
import { RotateCw, GripVertical, Trash2, Download } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function RotatePdfPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  
  // pages state: array of { id, pageIndex, rotation }
  const [pages, setPages] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);

  const onFiles = (files) => {
    setError("");
    if (files.length !== 1) {
      setError("Please select a single PDF file.");
      return;
    }
    setFile(files[0]);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    const initialPages = Array.from({ length: numPages }, (_, i) => ({
      id: Math.random().toString(36).substring(7),
      pageIndex: i + 1,
      rotation: 0
    }));
    setPages(initialPages);
  };

  const rotatePage = (id) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const removePage = (id) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const newPages = [...pages];
    const draggedPage = newPages[draggedIdx];
    newPages.splice(draggedIdx, 1);
    newPages.splice(index, 0, draggedPage);
    setDraggedIdx(index);
    setPages(newPages);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleProcess = async () => {
    if (!file || !pages.length) return;
    setBusy(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      for (const pageInfo of pages) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [pageInfo.pageIndex - 1]);
        const currentRotation = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(currentRotation + pageInfo.rotation));
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reordered_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err.message || "Failed to process PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Rotate & Reorder PDF</h1>
        <p className="text-zinc-500">Drag to reorder pages. Click the rotate icon to turn them. Delete unneeded pages.</p>
      </div>

      {!file ? (
        <UploadArea
          onFiles={onFiles}
          icon={RotateCw}
          title="Select PDF"
          description="Drag & drop a PDF file"
          color="amber"
        />
      ) : (
        <div className="animate-slide-up space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 flex items-center justify-between sticky top-20 z-10 backdrop-blur-md bg-white/90">
             <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-amber-50 text-amber-600 flex items-center justify-center rounded-xl">
                     <RotateCw className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="font-semibold text-zinc-900 max-w-xs truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">{pages.length} pages</p>
                 </div>
             </div>
             <div className="flex items-center gap-4">
                 <button onClick={() => {setFile(null); setPages([]);}} className="text-sm text-zinc-500 font-medium hover:text-zinc-700">Cancel</button>
                 <button
                   onClick={handleProcess}
                   disabled={busy || !pages.length}
                   className="rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 transition-all flex items-center gap-2"
                 >
                   {busy ? "Processing..." : <><Download className="h-4 w-4" /> Save PDF</>}
                 </button>
             </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="bg-zinc-100 p-8 rounded-2xl border border-zinc-200 min-h-[500px]">
            <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="text-center text-zinc-500 p-20 animate-pulse">Loading pages...</div>}
                error={<div className="text-center text-red-500 p-20">Failed to load PDF.</div>}
                className="hidden" // We just use it to trigger onLoadSuccess
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {pages.map((p, idx) => (
                    <div 
                        key={p.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`relative group bg-white p-2 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing shadow-sm flex flex-col ${draggedIdx === idx ? "opacity-50 scale-95 border-amber-400" : "border-transparent hover:border-amber-300"}`}
                    >
                        <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-zinc-500">
                           <span className="flex items-center gap-1"><GripVertical className="h-3 w-3" /> {idx + 1}</span>
                           <span>(p.{p.pageIndex})</span>
                        </div>
                        <div className="flex-1 bg-zinc-50 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-100 aspect-[3/4] relative pointer-events-none">
                            <div style={{ transform: `rotate(${p.rotation}deg)`, transition: 'transform 0.3s' }}>
                                <Document file={file}>
                                    <Page pageNumber={p.pageIndex} width={120} renderTextLayer={false} renderAnnotationLayer={false} />
                                </Document>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-xl pointer-events-auto">
                            <button onClick={() => rotatePage(p.id)} className="p-2.5 bg-white text-zinc-900 rounded-full hover:bg-amber-50 hover:text-amber-600 transition-colors shadow-lg" title="Rotate 90°">
                                <RotateCw className="h-5 w-5" />
                            </button>
                            <button onClick={() => removePage(p.id)} className="p-2.5 bg-white text-red-600 rounded-full hover:bg-red-50 hover:text-red-700 transition-colors shadow-lg" title="Remove Page">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
