"use client";
import "@/lib/pdfPolyfill";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { Hash, RotateCw, GripVertical, Trash2, Download, Settings2, FileSymlink, Eye, X } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function OrganizePdfPage() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  
  // Pages state for Rotate/Reorder: array of { id, pageIndex, rotation }
  const [pages, setPages] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [numPages, setNumPages] = useState(0);

  // Options for Page Numbers
  const [enablePageNumbers, setEnablePageNumbers] = useState(false);
  const [position, setPosition] = useState("bottom-center");
  const [startNumber, setStartNumber] = useState(1);
  const [format, setFormat] = useState("{n}"); // {n} or Page {n} or {n} of {t}

  const [activeTab, setActiveTab] = useState("organize"); // organize or pagenumbers
  const [previewPage, setPreviewPage] = useState(null); // stores { pageIndex, rotation } for full screen preview

  const onFiles = (files) => {
    setError("");
    if (files.length !== 1) {
      setError("Please select a single PDF file.");
      return;
    }
    const selectedFile = files[0];
    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
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
    // We don't really need dataTransfer data if we use state, but we can set a dummy text
    e.dataTransfer.setData("text/plain", index);
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

      // Organize & Rotate Phase
      for (let i = 0; i < pages.length; i++) {
        const pageInfo = pages[i];
        const [copiedPage] = await newPdf.copyPages(originalPdf, [pageInfo.pageIndex - 1]);
        const currentRotation = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(currentRotation + pageInfo.rotation));
        newPdf.addPage(copiedPage);
      }

      // Add Page Numbers Phase
      if (enablePageNumbers) {
          const finalPages = newPdf.getPages();
          const totalPages = finalPages.length;
          finalPages.forEach((page, index) => {
              const { width, height } = page.getSize();
              const currentNum = startNumber + index;
              let text = format.replace("{n}", currentNum).replace("{t}", totalPages);
              const fontSize = 12;
              const margin = 30;
              const approxTextWidth = text.length * (fontSize * 0.5);
              
              let x = width / 2 - approxTextWidth / 2;
              let y = margin;
              
              if (position.includes("left")) x = margin;
              if (position.includes("right")) x = width - margin - approxTextWidth;
              if (position.includes("top")) y = height - margin - fontSize;
              
              page.drawText(text, {
                x,
                y,
                size: fontSize,
                color: rgb(0, 0, 0),
              });
          });
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `organized_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err.message || "Failed to process PDF.");
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
      return (
          <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Organize PDF</h1>
                <p className="text-zinc-500">Rotate, reorder, delete pages and add page numbers all in one tool.</p>
              </div>
              <UploadArea
                  onFiles={onFiles}
                  icon={FileSymlink}
                  title="Select PDF"
                  description="Drag & drop a PDF file to organize"
                  color="teal"
              />
          </main>
      );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-zinc-50">
        {/* Left Sidebar - Customization */}
        <div className="w-80 shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-zinc-900">Organize PDF</h2>
                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">{file.name}</p>
                </div>
                <button onClick={() => setFile(null)} className="text-xs font-medium text-teal-600 hover:text-teal-700">Change</button>
            </div>

            <div className="flex px-5 pt-4 gap-2">
                <button onClick={() => setActiveTab("organize")} className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'organize' ? 'border-teal-500 text-teal-700' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
                    Pages
                </button>
                <button onClick={() => setActiveTab("pagenumbers")} className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pagenumbers' ? 'border-teal-500 text-teal-700' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
                    Numbers
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                {activeTab === "organize" && (
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-600 mb-4">Drag the pages on the right to reorder them, or click their icons to rotate or remove them.</p>
                        <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">Document Status</h3>
                            <p className="text-sm text-teal-700">{pages.length} pages remaining</p>
                        </div>
                    </div>
                )}

                {activeTab === "pagenumbers" && (
                    <div className="space-y-6">
                        <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors">
                            <input type="checkbox" checked={enablePageNumbers} onChange={e => setEnablePageNumbers(e.target.checked)} className="w-4 h-4 text-teal-600 rounded border-zinc-300 focus:ring-teal-500" />
                            <div className="flex-1">
                                <span className="block text-sm font-medium text-zinc-900">Add Page Numbers</span>
                                <span className="block text-xs text-zinc-500">Stamp numbers on exported PDF</span>
                            </div>
                        </label>

                        {enablePageNumbers && (
                            <div className="space-y-5 animate-fade-in">
                                <div>
                                    <label className="text-sm font-medium text-zinc-700 block mb-2">Position</label>
                                    <select 
                                        value={position} 
                                        onChange={e => setPosition(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="bottom-left">Bottom Left</option>
                                        <option value="bottom-center">Bottom Center</option>
                                        <option value="bottom-right">Bottom Right</option>
                                        <option value="top-left">Top Left</option>
                                        <option value="top-center">Top Center</option>
                                        <option value="top-right">Top Right</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-zinc-700 block mb-2">Format</label>
                                    <select 
                                        value={format} 
                                        onChange={e => setFormat(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="{n}">1, 2, 3...</option>
                                        <option value="Page {n}">Page 1, Page 2...</option>
                                        <option value="{n} of {t}">1 of 10, 2 of 10...</option>
                                        <option value="Page {n} of {t}">Page 1 of 10...</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-zinc-700 block mb-2">Start Number</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={startNumber} 
                                        onChange={e => setStartNumber(parseInt(e.target.value) || 1)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {error && <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 rounded-lg">{error}</p>}
            </div>

            <div className="p-5 border-t border-zinc-100 bg-white">
                <button
                    onClick={handleProcess}
                    disabled={busy || !pages.length}
                    className="w-full rounded-xl bg-linear-to-r from-teal-500 to-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 hover:from-teal-600 hover:to-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    {busy ? "Processing..." : <><Download className="h-4 w-4" /> Export PDF</>}
                </button>
            </div>
        </div>

        {/* Right Area - Realtime Preview Grid */}
        <div className="flex-1 h-full overflow-y-auto p-8 relative scrollbar-thin scrollbar-thumb-zinc-300">
            <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                className="hidden" 
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto pb-20">
                {pages.map((p, idx) => {
                    // Calculate real-time page number format if enabled
                    let numberOverlay = null;
                    if (enablePageNumbers) {
                        const currentNum = startNumber + idx;
                        const text = format.replace("{n}", currentNum).replace("{t}", pages.length);
                        
                        let posClasses = "bottom-4 left-1/2 -translate-x-1/2";
                        if (position === "bottom-left") posClasses = "bottom-4 left-4";
                        if (position === "bottom-right") posClasses = "bottom-4 right-4";
                        if (position === "top-left") posClasses = "top-4 left-4";
                        if (position === "top-center") posClasses = "top-4 left-1/2 -translate-x-1/2";
                        if (position === "top-right") posClasses = "top-4 right-4";

                        numberOverlay = (
                            <div className={`absolute z-20 text-[9px] font-bold text-black drop-shadow-md bg-white/70 px-1 rounded ${posClasses}`}>
                                {text}
                            </div>
                        );
                    }

                    return (
                        <div 
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`relative group bg-white p-2 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing shadow-sm flex flex-col ${draggedIdx === idx ? "opacity-50 scale-95 border-teal-400" : "border-transparent hover:border-teal-300"}`}
                        >
                            <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-zinc-500">
                               <GripVertical className="h-3 w-3 text-zinc-400" /> 
                            </div>
                            <div className="flex-1 bg-zinc-50 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-100 aspect-[3/4] relative pointer-events-none">
                                <div style={{ transform: `rotate(${p.rotation}deg)`, transition: 'transform 0.3s', position: 'relative', width: '100%', height: '100%' }} className="flex items-center justify-center">
                                    <Document file={fileUrl}>
                                        <Page pageNumber={p.pageIndex} width={150} renderTextLayer={false} renderAnnotationLayer={false} className="shadow-sm" />
                                    </Document>
                                </div>
                                {numberOverlay}
                                <div className="absolute bottom-1 right-1 bg-zinc-900/70 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-10 backdrop-blur-md">
                                    {idx + 1}
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl pointer-events-auto">
                                <button onClick={() => rotatePage(p.id)} className="p-2 bg-white text-zinc-900 rounded-full hover:bg-teal-50 hover:text-teal-600 transition-colors shadow-lg" title="Rotate 90°">
                                    <RotateCw className="h-4 w-4" />
                                </button>
                                <button onClick={() => setPreviewPage(p)} className="p-2 bg-white text-zinc-900 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-lg" title="Preview Page">
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button onClick={() => removePage(p.id)} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 hover:text-red-700 transition-colors shadow-lg" title="Remove Page">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Full Screen Preview Modal */}
        {previewPage && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center p-4 sm:p-8 overflow-y-auto animate-fade-in" onClick={() => setPreviewPage(null)}>
                <button onClick={() => setPreviewPage(null)} className="fixed top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
                    <X className="h-6 w-6" />
                </button>
                <div className="relative m-auto flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <div style={{ transform: `rotate(${previewPage.rotation}deg)`, transition: 'transform 0.3s' }} className="flex items-center justify-center bg-white shadow-2xl">
                        <Document file={fileUrl}>
                            <Page 
                              pageNumber={previewPage.pageIndex} 
                              renderTextLayer={false} 
                              renderAnnotationLayer={false} 
                              className="[&>canvas]:!max-w-[95vw] [&>canvas]:!w-auto [&>canvas]:!h-auto"
                            />
                        </Document>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
