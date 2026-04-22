"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getPdfJs } from "@/lib/pdfjsClient";
import { PinCurrentToolButton } from "@/components/PinnedToolsBar";
import { useI18n } from "@/components/I18nProvider";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

const MAX_PREVIEW = 48;

export default function PdfPrintPreviewPage() {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [bytes, setBytes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [thumbs, setThumbs] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [numPages, setNumPages] = useState(0);

  const toggle = useCallback((i) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(Array.from({ length: numPages }, (_, i) => i)));
  }, [numPages]);

  const selectNone = useCallback(() => setSelected(new Set()), []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!file) {
        setThumbs([]);
        setNumPages(0);
        setBytes(null);
        setSelected(new Set());
        return;
      }
      setBusy(true);
      setError("");
      try {
        const ab = await file.arrayBuffer();
        const u8 = new Uint8Array(ab);
        if (cancelled) return;
        setBytes(u8);
        const pdfjs = await getPdfJs();
        const pdf = await pdfjs.getDocument({ data: u8.slice() }).promise;
        const n = pdf.numPages;
        if (cancelled) return;
        setNumPages(n);
        const limit = Math.min(n, MAX_PREVIEW);
        const urls = [];
        for (let p = 1; p <= limit; p++) {
          const page = await pdf.getPage(p);
          const vp = page.getViewport({ scale: 0.22 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = vp.width;
          canvas.height = vp.height;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          urls.push(canvas.toDataURL("image/jpeg", 0.72));
          if (cancelled) return;
        }
        if (cancelled) return;
        setThumbs(urls);
        setSelected(new Set(Array.from({ length: limit }, (_, i) => i)));
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not read PDF");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const canDownload = useMemo(() => selected.size > 0 && bytes, [selected, bytes]);

  async function downloadSelected() {
    if (!bytes || selected.size === 0) return;
    setBusy(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      const indices = Array.from(selected).sort((a, b) => a - b);
      const copied = await out.copyPages(src, indices);
      copied.forEach((pg) => out.addPage(pg));
      const outBytes = await out.save({ useObjectStreams: true });
      const blob = new Blob([outBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "print-selection.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">{t("printPreview")}</h1>
          <p className="text-zinc-500 max-w-2xl">
            Preview pages and download only what you need for printing — saves paper at the shop.
          </p>
        </div>
        <PinCurrentToolButton href="/pdf-print-preview" label={t("printPreview")} />
      </div>

      {!file ? (
        <UploadArea
          onFiles={(fs) => {
            setError("");
            if (!fs?.[0]) return;
            setFile(fs[0]);
          }}
          title="Choose PDF"
          description="One file — thumbnails load in your browser"
          color="slate"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-zinc-600 truncate max-w-[200px] sm:max-w-md font-medium">{file.name}</span>
            <button type="button" className="text-indigo-600 font-medium hover:underline" onClick={() => setFile(null)}>
              Change file
            </button>
            <button type="button" className="text-zinc-600 hover:text-zinc-900" onClick={selectAll}>
              Select all
            </button>
            <button type="button" className="text-zinc-600 hover:text-zinc-900" onClick={selectNone}>
              Clear
            </button>
            <button
              type="button"
              disabled={!canDownload || busy}
              onClick={downloadSelected}
              className="ml-auto rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-semibold shadow disabled:opacity-50"
            >
              {t("download")} ({selected.size} pg)
            </button>
          </div>
          {numPages > MAX_PREVIEW && (
            <p className="text-amber-700 text-sm bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Showing first {MAX_PREVIEW} of {numPages} pages in preview. Selection is limited to visible pages — split the file first if needed.
            </p>
          )}
          {busy && <p className="text-sm text-zinc-500">Loading preview…</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {thumbs.map((src, i) => (
              <button
                type="button"
                key={i}
                onClick={() => toggle(i)}
                className={`rounded-xl border-2 overflow-hidden text-left transition ring-offset-2 ${
                  selected.has(i) ? "border-indigo-600 ring-2 ring-indigo-300" : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL thumbnails from PDF.js */}
                <img src={src} alt="" className="w-full h-auto bg-zinc-100" loading="lazy" />
                <div className="px-2 py-1.5 text-xs font-medium bg-white flex justify-between">
                  <span>Page {i + 1}</span>
                  <span>{selected.has(i) ? "✓" : ""}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
