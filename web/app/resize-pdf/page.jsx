"use client";
import "@/lib/pdfPolyfill";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import { Maximize, Download } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function ResizePdfPage() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  
  const [targetSize, setTargetSize] = useState("A4");
  const [fitMode, setFitMode] = useState("stretch"); // stretch or fit
  const [numPages, setNumPages] = useState(0);

  // Common sizes in points (72 points per inch)
  const sizes = {
    A4: [595.28, 841.89],
    A3: [841.89, 1190.55],
    Letter: [612, 792],
    Legal: [612, 1008],
  };

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
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const [targetWidth, targetHeight] = sizes[targetSize];
      
      const pages = originalPdf.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        // Embed the original page as an image-like object (PDF embedded page)
        const [embeddedPage] = await newPdf.embedPdf(originalPdf, [i]);
        
        // Add a new blank page of the target size
        const newPage = newPdf.addPage([targetWidth, targetHeight]);
        
        if (fitMode === "stretch") {
            // Stretch to fill completely
            newPage.drawPage(embeddedPage, {
                x: 0,
                y: 0,
                width: targetWidth,
                height: targetHeight,
            });
        } else {
            // Fit proportionally, center it
            const originalWidth = embeddedPage.width;
            const originalHeight = embeddedPage.height;
            const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
            
            const scaledWidth = originalWidth * scale;
            const scaledHeight = originalHeight * scale;
            
            newPage.drawPage(embeddedPage, {
                x: targetWidth / 2 - scaledWidth / 2,
                y: targetHeight / 2 - scaledHeight / 2,
                width: scaledWidth,
                height: scaledHeight,
            });
        }
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resized_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err.message || "Failed to resize PDF.");
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Resize PDF Pages</h1>
          <p className="text-zinc-500">Change the page size of your PDF to A4, A3, Letter, or Legal.</p>
        </div>
        <UploadArea
          onFiles={onFiles}
          icon={Maximize}
          title="Select PDF"
          description="Drag & drop a PDF file"
          color="indigo"
        />
      </main>
    );
  }

  // Calculate dynamic aspect ratio based on selected size
  const [targetWidth, targetHeight] = sizes[targetSize];
  const aspectRatio = targetWidth / targetHeight;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-zinc-50">
        {/* Left Sidebar - Customization */}
        <div className="w-80 shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-zinc-900">Resize PDF</h2>
                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">{file.name}</p>
                </div>
                <button onClick={() => setFile(null)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Change</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-6">
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Target Page Size</label>
                  <select 
                    value={targetSize} 
                    onChange={e => setTargetSize(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.keys(sizes).map(size => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Scaling Mode</label>
                  <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setFitMode('stretch')}
                        className={`text-left p-3 rounded-xl border transition-all ${fitMode === 'stretch' ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-200' : 'bg-white border-zinc-200 hover:border-indigo-200 hover:bg-zinc-50'}`}
                      >
                          <div className={`font-medium text-sm ${fitMode === 'stretch' ? 'text-indigo-700' : 'text-zinc-700'}`}>Stretch (Fill Page)</div>
                          <div className="text-xs text-zinc-500 mt-1">Stretches the content to fill the entire new page size exactly.</div>
                      </button>
                      <button 
                        onClick={() => setFitMode('fit')}
                        className={`text-left p-3 rounded-xl border transition-all ${fitMode === 'fit' ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-200' : 'bg-white border-zinc-200 hover:border-indigo-200 hover:bg-zinc-50'}`}
                      >
                          <div className={`font-medium text-sm ${fitMode === 'fit' ? 'text-indigo-700' : 'text-zinc-700'}`}>Fit (Keep Proportions)</div>
                          <div className="text-xs text-zinc-500 mt-1">Maintains original aspect ratio. Blank margins will be added.</div>
                      </button>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <div className="p-5 border-t border-zinc-100 bg-white">
                <button
                    onClick={handleProcess}
                    disabled={busy}
                    className="w-full rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {busy ? "Resizing..." : <><Download className="h-4 w-4" /> Resize PDF</>}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto pb-20">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                        <div key={pageNum} className="flex flex-col items-center">
                            <span className="text-xs font-semibold text-zinc-500 mb-2">Page {pageNum}</span>
                            <div className="w-full relative shadow-md bg-white border border-zinc-200" style={{ aspectRatio }}>
                                <div className={`absolute inset-0 flex items-center justify-center ${fitMode === 'fit' ? 'p-2' : ''}`}>
                                    <Document file={fileUrl}>
                                        <Page 
                                          pageNumber={pageNum} 
                                          width={fitMode === 'fit' ? 100 : 150} 
                                          renderTextLayer={false} 
                                          renderAnnotationLayer={false} 
                                          className={`transition-all duration-300 ${fitMode === 'stretch' ? 'w-full h-full object-fill' : ''}`}
                                        />
                                    </Document>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
