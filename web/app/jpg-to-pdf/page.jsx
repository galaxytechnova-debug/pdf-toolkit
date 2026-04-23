"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Image as ImageIcon, Trash2, GripVertical, Plus } from "lucide-react";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function JpgToPdfPage() {
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draggedIdx, setDraggedIdx] = useState(null);
  
  const [pageSize, setPageSize] = useState("a4");
  const [orientation, setOrientation] = useState("portrait");

  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  function onFiles(files) {
    setError("");
    const newImages = files
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        url: URL.createObjectURL(file),
      }));
    setImages((prev) => [...prev, ...newImages]);
  }

  function removeImage(id) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  function handleDragStart(e, index) {
    setDraggedIdx(index);
    // Minimal required for Firefox
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const newImages = [...images];
    const draggedImg = newImages[draggedIdx];
    newImages.splice(draggedIdx, 1);
    newImages.splice(index, 0, draggedImg);
    setDraggedIdx(index);
    setImages(newImages);
  }

  function handleDragEnd() {
    setDraggedIdx(null);
  }

  async function handleConvert() {
    if (!images.length) return;
    setBusy(true);
    setError("");
    try {
      const pdfDoc = await PDFDocument.create();

      for (const img of images) {
        const imgBytes = await img.file.arrayBuffer();
        let pdfImage;
        if (img.file.type === "image/jpeg" || img.file.type === "image/jpg") {
          pdfImage = await pdfDoc.embedJpg(imgBytes);
        } else if (img.file.type === "image/png") {
          pdfImage = await pdfDoc.embedPng(imgBytes);
        } else {
          continue;
        }

        let targetWidth = pdfImage.width;
        let targetHeight = pdfImage.height;
        let page;

        if (pageSize === "a4") {
          const w = orientation === "portrait" ? A4_WIDTH : A4_HEIGHT;
          const h = orientation === "portrait" ? A4_HEIGHT : A4_WIDTH;
          page = pdfDoc.addPage([w, h]);

          const scale = Math.min(w / targetWidth, h / targetHeight);
          targetWidth = targetWidth * scale;
          targetHeight = targetHeight * scale;

          page.drawImage(pdfImage, {
            x: w / 2 - targetWidth / 2,
            y: h / 2 - targetHeight / 2,
            width: targetWidth,
            height: targetHeight,
          });
        } else {
          page = pdfDoc.addPage([targetWidth, targetHeight]);
          page.drawImage(pdfImage, {
            x: 0,
            y: 0,
            width: targetWidth,
            height: targetHeight,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted-images.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError(e.message || "Failed to convert images.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Image to PDF</h1>
        <p className="text-zinc-500">Convert JPG and PNG images to a single PDF document instantly.</p>
      </div>

      {!images.length ? (
        <UploadArea
          onFiles={onFiles}
          icon={ImageIcon}
          title="Select Images to Convert"
          description="Drag & drop JPG or PNG files"
          color="yellow"
          multiple={true}
        />
      ) : (
        <div className="animate-slide-up grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
                <h3 className="font-semibold text-zinc-900">Images ({images.length})</h3>
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-lg transition-colors">
                  <Plus className="h-4 w-4" /> Add More
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => onFiles(Array.from(e.target.files || []))}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-fr">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`relative group rounded-xl border-2 overflow-hidden aspect-[3/4] bg-zinc-100 cursor-grab active:cursor-grabbing transition-transform ${
                      draggedIdx === idx ? "opacity-50 scale-95 border-yellow-400" : "border-zinc-200 hover:border-yellow-300"
                    }`}
                  >
                    <img src={img.url} alt="upload" className="w-full h-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md text-white cursor-grab">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white backdrop-blur-md transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-md">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h3 className="font-semibold text-zinc-900 mb-4">Document Settings</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Page Size</label>
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button
                      onClick={() => setPageSize("fit")}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${pageSize === "fit" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                      Fit Image Size
                    </button>
                    <button
                      onClick={() => setPageSize("a4")}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${pageSize === "a4" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                      A4 Standard
                    </button>
                  </div>
                </div>

                {pageSize === "a4" && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-medium text-zinc-700 block mb-2">Orientation</label>
                    <div className="flex bg-zinc-100 p-1 rounded-xl">
                      <button
                        onClick={() => setOrientation("portrait")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${orientation === "portrait" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                      >
                        Portrait
                      </button>
                      <button
                        onClick={() => setOrientation("landscape")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${orientation === "landscape" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={busy}
              className="w-full rounded-xl bg-linear-to-r from-yellow-500 to-amber-600 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-yellow-500/20 hover:from-yellow-600 hover:to-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {busy ? "Converting..." : "Convert to PDF"}
            </button>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-shake">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 001 1 1 1 0 001-1V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
