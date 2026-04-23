"use client";
import "@/lib/pdfPolyfill";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { Droplet, Download } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function WatermarkPdfPage() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(0);
  
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(50);
  const [fontSize, setFontSize] = useState(60);
  const [position, setPosition] = useState("diagonal"); // diagonal, center, top-left, etc.
  const [color, setColor] = useState("#ff0000"); // Red by default

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
  };

  const handleProcess = async () => {
    if (!file || !watermarkText) return;
    setBusy(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Convert hex to rgb
      const r = parseInt(color.substring(1, 3), 16) / 255;
      const g = parseInt(color.substring(3, 5), 16) / 255;
      const b = parseInt(color.substring(5, 7), 16) / 255;
      const textOpacity = opacity / 100;

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        
        // Rough estimation
        const approxTextWidth = watermarkText.length * (fontSize * 0.5);
        
        let x = width / 2 - approxTextWidth / 2;
        let y = height / 2 - fontSize / 2;
        let rotationAngle = 0;

        if (position === "diagonal") {
             rotationAngle = 45;
             // re-center for diagonal
             x = width / 2 - (approxTextWidth * Math.cos(45 * (Math.PI / 180))) / 2;
             y = height / 2 - (approxTextWidth * Math.sin(45 * (Math.PI / 180))) / 2;
        } else if (position === "top-left") {
             x = 20; y = height - fontSize - 20;
        } else if (position === "bottom-right") {
             x = width - approxTextWidth - 20; y = 20;
        }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          color: rgb(r, g, b),
          opacity: textOpacity,
          rotate: degrees(rotationAngle),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watermarked_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err.message || "Failed to add watermark.");
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Add Watermark</h1>
          <p className="text-zinc-500">Stamp your PDF with custom text overlays like "CONFIDENTIAL" or "DRAFT".</p>
        </div>

        <UploadArea
          onFiles={onFiles}
          icon={Droplet}
          title="Select PDF"
          description="Drag & drop a PDF file"
          color="cyan"
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
                    <h2 className="font-semibold text-zinc-900">Add Watermark</h2>
                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">{file.name}</p>
                </div>
                <button onClick={() => setFile(null)} className="text-xs font-medium text-cyan-600 hover:text-cyan-700">Change</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-5">
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Watermark Text</label>
                  <input 
                    type="text" 
                    value={watermarkText} 
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder="e.g. DRAFT"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 block mb-2">Position</label>
                      <select 
                        value={position} 
                        onChange={e => setPosition(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="diagonal">Diagonal</option>
                        <option value="center">Center</option>
                        <option value="top-left">Top Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 block mb-2">Color</label>
                      <div className="flex h-[46px] items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-2">
                        <input 
                            type="color" 
                            value={color} 
                            onChange={e => setColor(e.target.value)}
                            className="h-8 w-full cursor-pointer border-0 p-0 bg-transparent rounded"
                        />
                      </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 block mb-2">Opacity ({opacity}%)</label>
                      <input 
                        type="range" 
                        min="10" max="100" 
                        value={opacity} 
                        onChange={e => setOpacity(parseInt(e.target.value))}
                        className="w-full accent-cyan-600 mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 block mb-2">Font Size ({fontSize}px)</label>
                      <input 
                        type="range" 
                        min="12" max="120" 
                        value={fontSize} 
                        onChange={e => setFontSize(parseInt(e.target.value))}
                        className="w-full accent-cyan-600 mt-2"
                      />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <div className="p-5 border-t border-zinc-100 bg-white">
                <button
                  onClick={handleProcess}
                  disabled={busy || !watermarkText}
                  className="w-full rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {busy ? "Processing..." : <><Download className="h-4 w-4" /> Add Watermark</>}
                </button>
            </div>
        </div>

        {/* Right Area - Preview Grid */}
        <div className="flex-1 h-full overflow-y-auto p-8 relative scrollbar-thin scrollbar-thumb-zinc-300">
            <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="text-center text-zinc-500 p-20 animate-pulse">Loading preview...</div>}
                className="hidden" 
            />

            {numPages > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto pb-20">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
                        let overlayStyle = {
                            color: color,
                            opacity: opacity / 100,
                            fontSize: `${fontSize * 0.4}px`, // scale down for thumbnail
                            position: 'absolute',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                            fontWeight: 'bold',
                            zIndex: 10
                        };

                        if (position === 'diagonal') {
                            overlayStyle.top = '50%';
                            overlayStyle.left = '50%';
                            overlayStyle.transform = 'translate(-50%, -50%) rotate(-45deg)';
                        } else if (position === 'center') {
                            overlayStyle.top = '50%';
                            overlayStyle.left = '50%';
                            overlayStyle.transform = 'translate(-50%, -50%)';
                        } else if (position === 'top-left') {
                            overlayStyle.top = '10%';
                            overlayStyle.left = '10%';
                        } else if (position === 'bottom-right') {
                            overlayStyle.bottom = '10%';
                            overlayStyle.right = '10%';
                        }

                        return (
                            <div key={pageNum} className="flex flex-col items-center">
                                <span className="text-xs font-semibold text-zinc-500 mb-2">Page {pageNum}</span>
                                <div className="w-full relative shadow-md bg-white border border-zinc-200 rounded-lg overflow-hidden flex items-center justify-center">
                                    <Document file={fileUrl}>
                                        <Page 
                                          pageNumber={pageNum} 
                                          width={250} 
                                          renderTextLayer={false} 
                                          renderAnnotationLayer={false} 
                                          className="w-full h-auto"
                                        />
                                    </Document>
                                    <div style={overlayStyle}>{watermarkText}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
}
