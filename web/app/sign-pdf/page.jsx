"use client";
import "@/lib/pdfPolyfill";
import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { PDFDocument } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import { PenTool, Undo2, ChevronLeft, ChevronRight } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function SignPdfPage() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Signature drawing
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [sigColor, setSigColor] = useState("#000000");
  const [sigWidth, setSigWidth] = useState(2);
  const [step, setStep] = useState("draw"); // draw | place

  // Placement
  const [sigPosition, setSigPosition] = useState({ x: 60, y: 85 });
  const [sigScale, setSigScale] = useState(0.5);

  // Apply mode: "single" | "all" | "custom"
  const [applyMode, setApplyMode] = useState("single");
  const [singlePage, setSinglePage] = useState(1);
  const [customPagesInput, setCustomPagesInput] = useState(""); // e.g. "1,3,5-8"

  const onFiles = (files) => {
    setError("");
    if (files.length !== 1) { setError("Please select a single PDF file."); return; }
    const f = files[0];
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setStep("draw");
    setSignatureData(null);
  };

  useEffect(() => {
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [fileUrl]);

  // Canvas drawing
  useEffect(() => {
    if (step !== "draw" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = sigColor;
    ctx.lineWidth = sigWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [step, sigColor, sigWidth]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = sigColor;
    ctx.lineWidth = sigWidth;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const confirmSignature = () => {
    if (!canvasRef.current) return;
    setSignatureData(canvasRef.current.toDataURL("image/png"));
    setStep("place");
    setSinglePage(currentPage);
  };

  // Parse custom pages string like "1,3,5-8" into a Set
  const parseCustomPages = () => {
    const s = new Set();
    if (!customPagesInput.trim()) return s;
    customPagesInput.split(",").forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [a, b] = trimmed.split("-").map(n => parseInt(n.trim()));
        if (!isNaN(a) && !isNaN(b)) {
          for (let i = Math.max(1, a); i <= Math.min(numPages || 1, b); i++) s.add(i);
        }
      } else {
        const n = parseInt(trimmed);
        if (!isNaN(n) && n >= 1 && n <= (numPages || 1)) s.add(n);
      }
    });
    return s;
  };

  // Check if current preview page should show the signature
  const shouldShowSigOnPage = (pageNum) => {
    if (applyMode === "all") return true;
    if (applyMode === "single") return pageNum === singlePage;
    if (applyMode === "custom") return parseCustomPages().has(pageNum);
    return false;
  };

  // Get list of target page indices (0-based)
  const getTargetPageIndices = () => {
    if (applyMode === "all") return Array.from({ length: numPages }, (_, i) => i);
    if (applyMode === "single") return [singlePage - 1];
    if (applyMode === "custom") return Array.from(parseCustomPages()).sort((a, b) => a - b).map(p => p - 1);
    return [];
  };

  const handleProcess = useCallback(async () => {
    if (!file || !signatureData) return;
    setBusy(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const sigResponse = await fetch(signatureData);
      const sigBlob = await sigResponse.blob();
      const sigBuffer = await sigBlob.arrayBuffer();
      const sigImage = await pdfDoc.embedPng(new Uint8Array(sigBuffer));

      const targetIndices = getTargetPageIndices();
      const allPages = pdfDoc.getPages();

      targetIndices.forEach(idx => {
        if (idx < 0 || idx >= allPages.length) return;
        const page = allPages[idx];
        const { width, height } = page.getSize();

        const sigW = 200 * sigScale;
        const sigH = (sigImage.height / sigImage.width) * sigW;
        const x = (sigPosition.x / 100) * (width - sigW);
        const y = height - (sigPosition.y / 100) * (height - sigH) - sigH;

        page.drawImage(sigImage, { x, y, width: sigW, height: sigH });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to sign PDF.");
    } finally {
      setBusy(false);
    }
  }, [file, signatureData, sigPosition, sigScale, applyMode, singlePage, customPagesInput, numPages]);

  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {!file ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">E-Sign PDF</h1>
            <p className="text-zinc-500">Draw your signature and place it on any page. No account needed.</p>
          </div>
          <div className="w-full max-w-xl">
            <UploadArea onFiles={onFiles} icon={PenTool} title="Select PDF to Sign" description="Drag & drop a PDF file" color="blue" />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Controls */}
          <div className="w-full md:w-[360px] border-r border-zinc-200 bg-white overflow-y-auto shrink-0">
            <div className="p-5 border-b border-zinc-100">
              <h1 className="text-lg font-bold text-zinc-900 mb-1">E-Sign PDF</h1>
              <p className="text-xs text-zinc-500">Draw, position, and apply your signature.</p>
            </div>

            {/* File Info */}
            <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <PenTool className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 text-sm truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB · {numPages || "..."} pages</p>
              </div>
              <button onClick={() => { setFile(null); setFileUrl(null); setSignatureData(null); setStep("draw"); }} className="text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0">Change</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Step 1: Draw Signature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-800">1. Your Signature</label>
                  {signatureData && (
                    <button onClick={() => { setStep("draw"); setSignatureData(null); }} className="text-xs text-blue-600 font-medium hover:text-blue-700">Redraw</button>
                  )}
                </div>

                {!signatureData ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <input type="color" value={sigColor} onChange={e => setSigColor(e.target.value)} className="h-7 w-7 rounded cursor-pointer border border-zinc-200" />
                      <select value={sigWidth} onChange={e => setSigWidth(parseInt(e.target.value))} className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs flex-1">
                        <option value="1">Thin</option>
                        <option value="2">Medium</option>
                        <option value="4">Thick</option>
                        <option value="6">Bold</option>
                      </select>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={140}
                      className="w-full rounded-lg border-2 border-dashed border-zinc-300 bg-white cursor-crosshair touch-none"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                    <div className="flex gap-2">
                      <button onClick={clearCanvas} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-all">
                        <Undo2 className="h-3.5 w-3.5" /> Clear
                      </button>
                      <button onClick={confirmSignature} className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 py-2 text-xs font-semibold text-white hover:from-blue-600 hover:to-indigo-700 transition-all">
                        Confirm →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200 flex items-center justify-center">
                    <img src={signatureData} alt="Your signature" className="max-h-12" />
                  </div>
                )}
              </div>

              {signatureData && (
                <>
                  {/* Step 2: Apply To */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 block">2. Apply Signature To</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { mode: "single", label: "One Page" },
                        { mode: "all", label: "All Pages" },
                        { mode: "custom", label: "Custom" },
                      ].map(opt => (
                        <button
                          key={opt.mode}
                          onClick={() => setApplyMode(opt.mode)}
                          className={`py-2 rounded-lg text-xs font-medium border transition-all ${applyMode === opt.mode ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {applyMode === "single" && (
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Page Number</label>
                        <input type="number" min="1" max={numPages || 1} value={singlePage}
                          onChange={e => setSinglePage(Math.max(1, Math.min(numPages || 1, parseInt(e.target.value) || 1)))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}

                    {applyMode === "custom" && (
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Pages (e.g. 1,3,5-8)</label>
                        <input type="text" value={customPagesInput}
                          onChange={e => setCustomPagesInput(e.target.value)}
                          placeholder="1,3,5-8"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {customPagesInput && (
                          <p className="text-[10px] text-zinc-400 mt-1">
                            Will apply to {parseCustomPages().size} page{parseCustomPages().size !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    )}

                    {applyMode === "all" && (
                      <p className="text-[10px] text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                        ✓ Signature will be placed on all {numPages || "..."} pages at the same position.
                      </p>
                    )}
                  </div>

                  {/* Step 3: Position */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 block">3. Position & Size</label>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Horizontal: {sigPosition.x}%</label>
                      <input type="range" min="0" max="100" value={sigPosition.x} onChange={e => setSigPosition(p => ({ ...p, x: parseInt(e.target.value) }))} className="w-full accent-blue-600" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Vertical: {sigPosition.y}%</label>
                      <input type="range" min="0" max="100" value={sigPosition.y} onChange={e => setSigPosition(p => ({ ...p, y: parseInt(e.target.value) }))} className="w-full accent-blue-600" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Size: {Math.round(sigScale * 100)}%</label>
                      <input type="range" min="10" max="200" value={sigScale * 100} onChange={e => setSigScale(parseInt(e.target.value) / 100)} className="w-full accent-blue-600" />
                    </div>
                  </div>

                  {/* Download */}
                  <button onClick={handleProcess} disabled={busy}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]">
                    {busy ? "Signing PDF..." : `Download Signed PDF (${applyMode === "all" ? "all pages" : applyMode === "custom" ? `${parseCustomPages().size} pages` : `page ${singlePage}`})`}
                  </button>
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                </>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex-1 flex flex-col bg-zinc-100 overflow-hidden">
            <div className="p-3 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
              <span className="text-sm font-medium text-zinc-700">
                Preview — Page {currentPage} of {numPages || "..."}
                {shouldShowSigOnPage(currentPage) && signatureData && (
                  <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold">Signed</span>
                )}
              </span>
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
                {/* Signature Overlay */}
                {shouldShowSigOnPage(currentPage) && signatureData && (
                  <img
                    src={signatureData}
                    alt="Signature preview"
                    className="absolute pointer-events-none border border-blue-300/50 rounded shadow-sm"
                    style={{
                      width: `${Math.round(200 * sigScale)}px`,
                      left: `${sigPosition.x}%`,
                      top: `${sigPosition.y}%`,
                      transform: "translate(-50%, -50%)",
                      opacity: 0.85,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
