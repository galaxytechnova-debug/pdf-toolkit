"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getPdfJs } from "@/lib/pdfjsClient";
import { PinCurrentToolButton } from "@/components/PinnedToolsBar";
import { useI18n } from "@/components/I18nProvider";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });
const FillPdfStage = dynamic(() => import("@/components/FillPdfStage"), { ssr: false });

export default function FillPdfPage() {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [bytes, setBytes] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bg, setBg] = useState(null);
  const [stageSize, setStageSize] = useState({ w: 600, h: 800 });
  /** Per 1-based page: canvas size when user edited that page */
  const [pageDims, setPageDims] = useState({});
  /** @type {Record<number, Array<{id:number,x:number,y:number,text:string,fontSize:number}>>} */
  const [byPage, setByPage] = useState({});

  const items = useMemo(() => byPage[page] || [], [byPage, page]);

  const setItems = useCallback(
    (next) => {
      setByPage((prev) => ({ ...prev, [page]: typeof next === "function" ? next(prev[page] || []) : next }));
    },
    [page]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadFile() {
      if (!file) {
        setBytes(null);
        setNumPages(0);
        setBg(null);
        setByPage({});
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
        if (cancelled) return;
        setNumPages(pdf.numPages);
        setPage(1);
        setByPage({});
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to read PDF");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    loadFile();
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    let cancelled = false;
    async function renderPage() {
      if (!bytes || !numPages) {
        setBg(null);
        return;
      }
      setBusy(true);
      try {
        const pdfjs = await getPdfJs();
        const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
        const p = await pdf.getPage(page);
        const base = 1.4;
        const vp = p.getViewport({ scale: base });
        const maxW = typeof window !== "undefined" ? Math.min(720, window.innerWidth - 48) : 720;
        const scale = maxW / vp.width;
        const v = p.getViewport({ scale: base * scale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = v.width;
        canvas.height = v.height;
        await p.render({ canvasContext: ctx, viewport: v }).promise;
        if (cancelled) return;
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = canvas.toDataURL("image/png");
        });
        if (cancelled) return;
        setBg(img);
        const dims = { w: v.width, h: v.height };
        setStageSize(dims);
        setPageDims((d) => ({ ...d, [page]: dims }));
      } catch (e) {
        if (!cancelled) setError(e.message || "Render failed");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    renderPage();
    return () => {
      cancelled = true;
    };
  }, [bytes, page, numPages]);

  async function downloadFilled() {
    if (!bytes) return;
    setBusy(true);
    setError("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const src = await PDFDocument.load(bytes);
      const font = await src.embedFont(StandardFonts.Helvetica);
      const pages = src.getPages();

      for (let pi = 0; pi < pages.length; pi++) {
        const list = byPage[pi + 1];
        if (!list || !list.length) continue;
        const pdfPage = pages[pi];
        const { width: pw, height: ph } = pdfPage.getSize();
        const dim = pageDims[pi + 1] || stageSize;
        const sw = dim.w;
        const sh = dim.h;
        for (const it of list) {
          const xPdf = (it.x / sw) * pw;
          const yPdf = ph - (it.y / sh) * ph - it.fontSize * 0.85;
          pdfPage.drawText(it.text, {
            x: xPdf,
            y: Math.max(0, yPdf),
            size: Math.max(6, (it.fontSize / sh) * ph * 0.28),
            font,
            color: rgb(0.1, 0.1, 0.15),
          });
        }
      }

      const out = await src.save({ useObjectStreams: true });
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "filled.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">{t("fillPdf")}</h1>
          <p className="text-zinc-500">Double-click to place text, then download a new PDF. Runs in your browser.</p>
        </div>
        <PinCurrentToolButton href="/fill-pdf" label={t("fillPdf")} />
      </div>

      {!file ? (
        <UploadArea
          onFiles={(fs) => {
            setError("");
            if (fs?.[0]) setFile(fs[0]);
          }}
          title="Upload PDF"
          description="Forms and applications — add typed text on each page"
          color="sky"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button type="button" className="text-indigo-600 font-medium" onClick={() => setFile(null)}>
              Change file
            </button>
            {numPages > 0 && (
              <label className="flex items-center gap-2">
                Page
                <select
                  className="border rounded-lg px-2 py-1"
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                >
                  {Array.from({ length: numPages }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <span className="text-zinc-500">/ {numPages}</span>
              </label>
            )}
            <button
              type="button"
              onClick={downloadFilled}
              disabled={busy}
              className="ml-auto rounded-xl bg-sky-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {t("download")} PDF
            </button>
          </div>
          {bg && (
            <FillPdfStage
              bgImage={bg}
              width={stageSize.w}
              height={stageSize.h}
              items={items}
              onItemsChange={setItems}
            />
          )}
          {busy && !bg && <p className="text-sm text-zinc-500">Preparing…</p>}
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
