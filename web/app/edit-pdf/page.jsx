"use client";
import "@/lib/pdfPolyfill";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, rgb } from "pdf-lib";
import { Pencil, Download, ChevronLeft, ChevronRight, Plus, Type, Trash2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function EditPdfPage() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Texts state: { pageNum: [{ id, x, y, text, fontSize, color }] }
  const [texts, setTexts] = useState({});
  const [activeTextId, setActiveTextId] = useState(null);

  // Reference to the rendered page element to calculate coordinates
  const pageRef = useRef(null);
  const [scale, setScale] = useState(1.5); // Adjust for visual quality

  const onFiles = (files) => {
    setError("");
    if (files.length !== 1) {
      setError("Please select a single PDF file.");
      return;
    }
    setFile(files[0]);
    setTexts({});
    setPageNumber(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const addText = (e) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    // Calculate percentage coordinates relative to the page
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newId = Math.random().toString(36).substring(7);
    const newText = {
      id: newId,
      x,
      y,
      text: "New Text",
      fontSize: 16,
      color: "#000000",
    };

    setTexts((prev) => ({
      ...prev,
      [pageNumber]: [...(prev[pageNumber] || []), newText],
    }));
    setActiveTextId(newId);
  };

  const updateText = (id, newProps) => {
    setTexts((prev) => ({
      ...prev,
      [pageNumber]: prev[pageNumber].map((t) => (t.id === id ? { ...t, ...newProps } : t)),
    }));
  };

  const removeText = (id) => {
    setTexts((prev) => ({
      ...prev,
      [pageNumber]: prev[pageNumber].map(t => t).filter((t) => t.id !== id),
    }));
    setActiveTextId(null);
  };

  const handleDownload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Apply texts to each page
      Object.keys(texts).forEach((pageNumStr) => {
        const pageIdx = parseInt(pageNumStr, 10) - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) return;
        const page = pages[pageIdx];
        const { width, height } = page.getSize();
        
        const pageTexts = texts[pageNumStr] || [];
        pageTexts.forEach((t) => {
          // Convert percentage back to PDF points
          // pdf-lib's y-axis goes from bottom to top, whereas HTML goes top to bottom
          const pdfX = (t.x / 100) * width;
          const pdfY = height - (t.y / 100) * height;

          // Convert hex color to rgb
          const r = parseInt(t.color.substring(1, 3), 16) / 255;
          const g = parseInt(t.color.substring(3, 5), 16) / 255;
          const b = parseInt(t.color.substring(5, 7), 16) / 255;

          page.drawText(t.text, {
            x: pdfX,
            y: pdfY - t.fontSize, // Adjust for baseline
            size: t.fontSize,
            color: rgb(r, g, b),
          });
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_${file.name}`;
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Edit PDF</h1>
        <p className="text-zinc-500">Add text anywhere on your PDF. Works entirely in your browser.</p>
      </div>

      {!file ? (
        <UploadArea
          onFiles={onFiles}
          icon={Pencil}
          title="Select PDF to Edit"
          description="Drag & drop a PDF file"
          color="blue"
        />
      ) : (
        <div className="animate-slide-up grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Workspace */}
          <div className="lg:col-span-3 bg-zinc-100 rounded-2xl border border-zinc-200 overflow-hidden relative flex flex-col items-center p-6 shadow-inner min-h-[600px]">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-zinc-200/50">
              <button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                className="p-1 rounded-full hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-zinc-700 w-24 text-center">
                {pageNumber} / {numPages || "-"}
              </span>
              <button
                onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
                disabled={pageNumber >= (numPages || 1)}
                className="p-1 rounded-full hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              <div className="w-px h-6 bg-zinc-300 mx-2" />
              
              <div className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                 <Type className="h-4 w-4" /> Click anywhere to add text
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="mt-12 shadow-2xl relative select-none" ref={pageRef} onClick={(e) => {
                if (e.target === pageRef.current || e.target.closest('.react-pdf__Page__canvas')) {
                    addText(e);
                }
            }}>
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="p-20 text-zinc-500 animate-pulse">Loading PDF...</div>}
                error={<div className="p-20 text-red-500">Failed to load PDF.</div>}
              >
                <Page 
                    pageNumber={pageNumber} 
                    scale={scale} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false} 
                    className="border border-zinc-200 bg-white"
                />
              </Document>

              {/* Text Overlays */}
              {(texts[pageNumber] || []).map((t) => (
                <div
                  key={t.id}
                  className={`absolute group px-2 py-1 border-2 transition-colors cursor-text ${
                    activeTextId === t.id ? "border-blue-500 bg-blue-50/20" : "border-transparent hover:border-blue-300 hover:bg-blue-50/10"
                  }`}
                  style={{
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    transform: "translate(0, -100%)", // approximate baseline
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTextId(t.id);
                  }}
                >
                  <input
                    autoFocus={activeTextId === t.id}
                    value={t.text}
                    onChange={(e) => updateText(t.id, { text: e.target.value })}
                    className="bg-transparent border-none outline-none whitespace-nowrap"
                    style={{ fontSize: `${t.fontSize * scale}px`, color: t.color, minWidth: '50px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {/* Delete button (shows on hover/active) */}
                  {(activeTextId === t.id) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeText(t.id); }}
                        className="absolute -top-6 -right-6 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 z-50"
                      >
                          <Trash2 className="h-3 w-3" />
                      </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <Type className="h-5 w-5 text-blue-500" /> Text Properties
              </h3>

              {activeTextId ? (() => {
                const activeText = (texts[pageNumber] || []).find((t) => t.id === activeTextId);
                if (!activeText) return <p className="text-sm text-zinc-500">Select a text object to edit properties.</p>;
                return (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 block mb-1">Color</label>
                      <div className="flex gap-2">
                        {['#000000', '#EF4444', '#3B82F6', '#10B981'].map(color => (
                            <button 
                                key={color}
                                onClick={() => updateText(activeTextId, { color })}
                                className={`w-8 h-8 rounded-full border-2 ${activeText.color === color ? 'border-zinc-900 scale-110' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <input
                            type="color"
                            value={activeText.color}
                            onChange={(e) => updateText(activeTextId, { color: e.target.value })}
                            className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 overflow-hidden"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 block mb-1">Size ({activeText.fontSize}px)</label>
                      <input
                        type="range"
                        min="8" max="72"
                        value={activeText.fontSize}
                        onChange={(e) => updateText(activeTextId, { fontSize: parseInt(e.target.value) })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                );
              })() : (
                <p className="text-sm text-zinc-500">Click on the document to add text, or select existing text to change its properties.</p>
              )}
            </div>

            <button
              onClick={handleDownload}
              disabled={busy}
              className="w-full rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {busy ? "Applying Changes..." : <><Download className="h-5 w-5" /> Download PDF</>}
            </button>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-shake">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 001 1 1 1 0 001-1V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}
            
            <button onClick={() => {setFile(null); setTexts({});}} className="w-full text-sm font-medium text-zinc-500 hover:text-zinc-700 py-2">
                Start Over
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
