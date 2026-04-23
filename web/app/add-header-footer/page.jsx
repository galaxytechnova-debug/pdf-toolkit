"use client";
import "@/lib/pdfPolyfill";
import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { PDFDocument, rgb } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import { AlignVerticalSpaceAround, ChevronLeft, ChevronRight, Download } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function AddHeaderFooterPage() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [headerAlign, setHeaderAlign] = useState("center");
  const [footerAlign, setFooterAlign] = useState("center");
  const [fontSize, setFontSize] = useState(10);
  const [fontColor, setFontColor] = useState("#4d4d4d");

  const onFiles = (files) => {
    setError("");
    if (files.length !== 1) { setError("Please select a single PDF file."); return; }
    const f = files[0];
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
  };

  useEffect(() => {
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [fileUrl]);

  const getX = (align, width, textWidth, margin) => {
    if (align === "left") return margin;
    if (align === "right") return width - margin - textWidth;
    return width / 2 - textWidth / 2;
  };

  // Build preview overlay text
  const getPreviewHeader = () => {
    if (!headerText) return "";
    return headerText.replace("{page}", currentPage).replace("{total}", numPages || "?").replace("{date}", new Date().toLocaleDateString());
  };
  const getPreviewFooter = () => {
    if (!footerText) return "";
    return footerText.replace("{page}", currentPage).replace("{total}", numPages || "?").replace("{date}", new Date().toLocaleDateString());
  };

  const handleProcess = useCallback(async () => {
    if (!file || (!headerText && !footerText)) return;
    setBusy(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const margin = 36;

      const hex = fontColor.replace("#", "");
      const cr = parseInt(hex.slice(0, 2), 16) / 255;
      const cg = parseInt(hex.slice(2, 4), 16) / 255;
      const cb = parseInt(hex.slice(4, 6), 16) / 255;

      pages.forEach((page, idx) => {
        const { width, height } = page.getSize();
        const totalPages = pages.length;
        if (headerText) {
          let text = headerText.replace("{page}", idx + 1).replace("{total}", totalPages).replace("{date}", new Date().toLocaleDateString());
          const tw = text.length * fontSize * 0.5;
          page.drawText(text, { x: getX(headerAlign, width, tw, margin), y: height - margin, size: fontSize, color: rgb(cr, cg, cb) });
        }
        if (footerText) {
          let text = footerText.replace("{page}", idx + 1).replace("{total}", totalPages).replace("{date}", new Date().toLocaleDateString());
          const tw = text.length * fontSize * 0.5;
          page.drawText(text, { x: getX(footerAlign, width, tw, margin), y: margin - fontSize, size: fontSize, color: rgb(cr, cg, cb) });
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `headered_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to add header/footer.");
    } finally {
      setBusy(false);
    }
  }, [file, headerText, footerText, headerAlign, footerAlign, fontSize, fontColor]);

  const alignClass = (a) => a === "left" ? "text-left" : a === "right" ? "text-right" : "text-center";

  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {!file ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Add Header & Footer</h1>
            <p className="text-zinc-500">Insert custom header/footer text on every page. Placeholders: {"{page}"}, {"{total}"}, {"{date}"}.</p>
          </div>
          <div className="w-full max-w-xl">
            <UploadArea onFiles={onFiles} icon={AlignVerticalSpaceAround} title="Select PDF" description="Drag & drop a PDF file" color="violet" />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Controls */}
          <div className="w-full md:w-[360px] border-r border-zinc-200 bg-white overflow-y-auto shrink-0">
            <div className="p-5 border-b border-zinc-100">
              <h1 className="text-lg font-bold text-zinc-900 mb-1">Header & Footer</h1>
              <p className="text-xs text-zinc-500">Preview updates live as you type.</p>
            </div>

            <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 shrink-0">
                <AlignVerticalSpaceAround className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 text-sm truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => { setFile(null); setFileUrl(null); }} className="text-xs font-medium text-violet-600 hover:text-violet-700 shrink-0">Change</button>
            </div>

            <div className="p-4 space-y-5">
              {/* Header */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800 block">Header Text</label>
                <input type="text" value={headerText} onChange={e => setHeaderText(e.target.value)}
                  placeholder='"CONFIDENTIAL" or "Page {page} of {total}"'
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                <div className="flex gap-1.5">
                  {["left", "center", "right"].map(a => (
                    <button key={a} onClick={() => setHeaderAlign(a)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${headerAlign === a ? "bg-violet-50 border-violet-300 text-violet-700" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"}`}
                    >{a}</button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800 block">Footer Text</label>
                <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)}
                  placeholder='"Client: Acme Corp" or "{date}"'
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                <div className="flex gap-1.5">
                  {["left", "center", "right"].map(a => (
                    <button key={a} onClick={() => setFooterAlign(a)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${footerAlign === a ? "bg-violet-50 border-violet-300 text-violet-700" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"}`}
                    >{a}</button>
                  ))}
                </div>
              </div>

              {/* Font Options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1">Font Size: {fontSize}pt</label>
                  <input type="range" min="6" max="24" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full accent-violet-600" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1">Color</label>
                  <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)} className="h-9 w-full rounded-lg cursor-pointer border border-zinc-200" />
                </div>
              </div>

              {/* Process */}
              <button onClick={handleProcess} disabled={busy || (!headerText && !footerText)}
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all active:scale-[0.98]">
                {busy ? "Processing..." : "Download with Header & Footer"}
              </button>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="flex-1 flex flex-col bg-zinc-100 overflow-hidden">
            <div className="p-3 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
              <span className="text-sm font-medium text-zinc-700">Preview — Page {currentPage} of {numPages || "..."}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1.5 rounded-lg border text-zinc-500 disabled:opacity-30 hover:bg-zinc-50"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))} disabled={currentPage >= numPages} className="p-1.5 rounded-lg border text-zinc-500 disabled:opacity-30 hover:bg-zinc-50"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex-1 flex items-start justify-center overflow-auto p-6">
              <div className="relative shadow-xl rounded-lg overflow-hidden bg-white">
                <Document file={fileUrl} onLoadSuccess={({ numPages: n }) => setNumPages(n)}>
                  <Page pageNumber={currentPage} width={Math.min(600, typeof window !== "undefined" ? window.innerWidth - 420 : 600)} />
                </Document>
                {/* Header Overlay */}
                {getPreviewHeader() && (
                  <div className={`absolute top-0 left-0 right-0 px-6 py-2 pointer-events-none ${alignClass(headerAlign)}`}
                    style={{ fontSize: `${fontSize}px`, color: fontColor, fontFamily: "serif" }}>
                    {getPreviewHeader()}
                  </div>
                )}
                {/* Footer Overlay */}
                {getPreviewFooter() && (
                  <div className={`absolute bottom-0 left-0 right-0 px-6 py-2 pointer-events-none ${alignClass(footerAlign)}`}
                    style={{ fontSize: `${fontSize}px`, color: fontColor, fontFamily: "serif" }}>
                    {getPreviewFooter()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
