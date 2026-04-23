"use client";
import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { PDFDocument } from "pdf-lib";
import { Images, X, GripVertical, Download } from "lucide-react";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function ImagesToPdfPage() {
  const [images, setImages] = useState([]); // { id, file, preview, name }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pageSize, setPageSize] = useState("a4"); // a4, letter, fit
  const [orientation, setOrientation] = useState("portrait");
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const onFiles = (files) => {
    setError("");
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];
    const newImages = [];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setError(`Skipped "${file.name}" — only JPG, PNG, WebP, GIF, BMP allowed.`);
        continue;
      }
      newImages.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      });
    }
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleDragStart = (idx) => { dragItem.current = idx; };
  const handleDragEnter = (idx) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    const items = [...images];
    const [dragged] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setImages(items);
  };

  const getPageDimensions = () => {
    const sizes = {
      a4: { portrait: [595.28, 841.89], landscape: [841.89, 595.28] },
      letter: { portrait: [612, 792], landscape: [792, 612] },
    };
    if (pageSize === "fit") return null; // Fit to image
    return sizes[pageSize]?.[orientation] || sizes.a4.portrait;
  };

  const handleProcess = useCallback(async () => {
    if (images.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const pdfDoc = await PDFDocument.create();

      for (const img of images) {
        const arrayBuffer = await img.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        let pdfImage;
        if (img.file.type === "image/png") {
          pdfImage = await pdfDoc.embedPng(bytes);
        } else {
          // Convert non-JPEG to JPEG via canvas, or embed JPEG directly
          if (img.file.type === "image/jpeg") {
            pdfImage = await pdfDoc.embedJpg(bytes);
          } else {
            // Convert to PNG via canvas
            const bitmap = await createImageBitmap(img.file);
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(bitmap, 0, 0);
            const pngBlob = await new Promise(r => canvas.toBlob(r, "image/png"));
            const pngBuffer = await pngBlob.arrayBuffer();
            pdfImage = await pdfDoc.embedPng(new Uint8Array(pngBuffer));
          }
        }

        const dims = getPageDimensions();
        if (dims) {
          const [pw, ph] = dims;
          const page = pdfDoc.addPage([pw, ph]);
          const scale = Math.min(pw / pdfImage.width, ph / pdfImage.height);
          const scaledW = pdfImage.width * scale;
          const scaledH = pdfImage.height * scale;
          page.drawImage(pdfImage, {
            x: (pw - scaledW) / 2,
            y: (ph - scaledH) / 2,
            width: scaledW,
            height: scaledH,
          });
        } else {
          // Fit page to image
          const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
          page.drawImage(pdfImage, {
            x: 0, y: 0,
            width: pdfImage.width,
            height: pdfImage.height,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images_combined.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to create PDF.");
    } finally {
      setBusy(false);
    }
  }, [images, pageSize, orientation]);

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Images to PDF</h1>
        <p className="text-zinc-500">Combine multiple images (Aadhaar, marksheets, scans) into a single PDF. Drag to reorder.</p>
      </div>

      <div className="mb-6">
        <UploadArea
          onFiles={onFiles}
          icon={Images}
          title="Add Images"
          description="JPG, PNG, WebP, GIF, BMP — select multiple"
          color="pink"
          multiple
        />
      </div>

      {images.length > 0 && (
        <div className="animate-slide-up space-y-6">
          {/* Thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                className="relative group rounded-xl border-2 border-zinc-200 overflow-hidden bg-white hover:border-indigo-400 transition-all cursor-grab active:cursor-grabbing"
              >
                <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center backdrop-blur-sm">
                  {idx + 1}
                </div>
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-2 right-2 z-10 bg-red-500/80 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/70 backdrop-blur-sm p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-zinc-400 mx-auto" />
                </div>
                <img src={img.preview} alt={img.name} className="w-full h-32 object-cover" />
              </div>
            ))}
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-2">Page Size</label>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="a4">A4</option>
                  <option value="letter">US Letter</option>
                  <option value="fit">Fit to Image</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-2">Orientation</label>
                <select
                  value={orientation}
                  onChange={e => setOrientation(e.target.value)}
                  disabled={pageSize === "fit"}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {busy ? "Creating PDF..." : `Create PDF from ${images.length} Image${images.length !== 1 ? "s" : ""}`}
            </button>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
