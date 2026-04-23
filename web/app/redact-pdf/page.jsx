"use client";
import "@/lib/pdfPolyfill";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { PDFDocument, rgb } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import { EyeOff, Plus, Trash2 } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function RedactPdfPage() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Redaction areas: { id, page, x%, y%, w%, h% }
  const [redactions, setRedactions] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [redactColor, setRedactColor] = useState("#000000");

  const onFiles = (files) => {
    setError("");
    if (files.length !== 1) { setError("Please select a single PDF."); return; }
    const f = files[0];
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setRedactions([]);
  };

  const addRedaction = () => {
    const r = { id: nextId, page: currentPage, x: 20, y: 20, w: 30, h: 5 };
    setRedactions(prev => [...prev, r]);
    setNextId(prev => prev + 1);
  };

  const updateRedaction = (id, updates) => {
    setRedactions(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRedaction = (id) => {
    setRedactions(prev => prev.filter(r => r.id !== id));
  };

  const currentRedactions = redactions.filter(r => r.page === currentPage);

  const handleProcess = useCallback(async () => {
    if (!file || redactions.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Parse color
      const hex = redactColor.replace("#", "");
      const cr = parseInt(hex.slice(0, 2), 16) / 255;
      const cg = parseInt(hex.slice(2, 4), 16) / 255;
      const cb = parseInt(hex.slice(4, 6), 16) / 255;

      redactions.forEach(red => {
        if (red.page > pages.length) return;
        const page = pages[red.page - 1];
        const { width, height } = page.getSize();

        const x = (red.x / 100) * width;
        const y = height - ((red.y + red.h) / 100) * height;
        const w = (red.w / 100) * width;
        const h = (red.h / 100) * height;

        page.drawRectangle({
          x, y, width: w, height: h,
          color: rgb(cr, cg, cb),
          borderWidth: 0,
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redacted_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Redaction failed.");
    } finally {
      setBusy(false);
    }
  }, [file, redactions, redactColor]);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Redact PDF</h1>
        <p className="text-zinc-500">Black out sensitive information — Aadhaar numbers, salaries, addresses — before sharing.</p>
      </div>

      {!file ? (
        <UploadArea onFiles={onFiles} icon={EyeOff} title="Select PDF to Redact" description="Drag & drop a PDF file" color="slate" />
      ) : (
        <div className="animate-slide-up grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
          {/* Preview */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700">Page {currentPage} of {numPages || "..."}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="px-3 py-1 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-zinc-50">Prev</button>
                <button onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))} disabled={currentPage >= numPages} className="px-3 py-1 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-zinc-50">Next</button>
              </div>
            </div>
            <div className="relative flex justify-center p-4 bg-zinc-50 min-h-[500px] overflow-auto">
              <div className="relative">
                <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                  <Page pageNumber={currentPage} width={520} />
                </Document>
                {currentRedactions.map(red => (
                  <div
                    key={red.id}
                    className="absolute border-2 border-red-400 rounded"
                    style={{
                      left: `${red.x}%`,
                      top: `${red.y}%`,
                      width: `${red.w}%`,
                      height: `${red.h}%`,
                      backgroundColor: redactColor + "99",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <button onClick={addRedaction} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-all">
              <Plus className="h-4 w-4" /> Add Redaction Area
            </button>

            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Redaction Color</label>
              <div className="flex gap-2">
                {["#000000", "#ffffff", "#ff0000", "#0000ff"].map(c => (
                  <button key={c} onClick={() => setRedactColor(c)}
                    className={`h-8 w-8 rounded-lg border-2 transition-all ${redactColor === c ? "border-indigo-500 scale-110" : "border-zinc-200"}`}
                    style={{ backgroundColor: c }} />
                ))}
                <input type="color" value={redactColor} onChange={e => setRedactColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border border-zinc-200" />
              </div>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {redactions.map(red => (
                <div key={red.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">Page {red.page}</span>
                    <button onClick={() => removeRedaction(red.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: "X%", key: "x" },
                      { label: "Y%", key: "y" },
                      { label: "W%", key: "w" },
                      { label: "H%", key: "h" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[10px] text-zinc-400">{f.label}</label>
                        <input type="number" min="0" max="100" value={red[f.key]}
                          onChange={e => updateRedaction(red.id, { [f.key]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {redactions.length > 0 && (
              <button
                onClick={handleProcess}
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-zinc-700 to-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg hover:from-zinc-800 hover:to-black disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {busy ? "Redacting..." : "Download Redacted PDF"}
              </button>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
