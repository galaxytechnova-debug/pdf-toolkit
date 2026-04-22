"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Image as ImageIcon } from "lucide-react";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function PdfToImagePage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function renderPdfToImages(file) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
    const array = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: array });
    const pdf = await loadingTask.promise;
    const zip = new JSZip();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.92));
      const arrayBuf = await blob.arrayBuffer();
      zip.file(`page-${i}.png`, arrayBuf);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'pdf-images.zip');
  }

  async function onFiles(files) {
    setError("");
    if (!files || files.length !== 1) { setError("Select a single PDF file."); return; }
    setBusy(true);
    try { await renderPdfToImages(files[0]); }
    catch (e) { setError(e.message || 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">PDF to Image</h1>
        <p className="text-zinc-500">Convert each PDF page into high-quality images.</p>
      </div>

      <UploadArea
        onFiles={onFiles}
        icon={ImageIcon}
        title="Select PDF File"
        description="Drag & drop a PDF to convert to images"
        color="sky"
      />
      {busy && <div className="mt-8 text-center animate-pulse text-sky-600 font-medium">Rendering Pages...</div>}
      {error && <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-shake">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 001 1 1 1 0 001-1V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        {error}
      </div>}
    </main>
  );
}
