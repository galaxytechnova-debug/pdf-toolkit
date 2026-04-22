"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { getPdfJs } from "@/lib/pdfjsClient";
import { postMultipart, downloadBlob } from "@/lib/api";
import { PinCurrentToolButton } from "@/components/PinnedToolsBar";
import { useI18n } from "@/components/I18nProvider";
import { ChevronUp, ChevronDown, RotateCw, Trash2 } from "lucide-react";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

const MAX_PAGES = 60;

export default function OrganizePdfPage() {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** @type {{srcIndex:number, rotation:number, thumb:string}[]} */
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function thumbs() {
      if (!file) {
        setSlots([]);
        return;
      }
      setBusy(true);
      setError("");
      try {
        const ab = await file.arrayBuffer();
        const u8 = new Uint8Array(ab);
        if (cancelled) return;
        const pdfjs = await getPdfJs();
        const pdf = await pdfjs.getDocument({ data: u8.slice() }).promise;
        const n = Math.min(pdf.numPages, MAX_PAGES);
        if (pdf.numPages > MAX_PAGES) {
          setError(`Only the first ${MAX_PAGES} pages are shown. Split the file first if needed.`);
        }
        const next = [];
        for (let p = 1; p <= n; p++) {
          const page = await pdf.getPage(p);
          const vp = page.getViewport({ scale: 0.18 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = vp.width;
          canvas.height = vp.height;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          next.push({
            srcIndex: p - 1,
            rotation: 0,
            thumb: canvas.toDataURL("image/jpeg", 0.75),
          });
          if (cancelled) return;
        }
        if (!cancelled) setSlots(next);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to read PDF");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    thumbs();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const move = useCallback((idx, dir) => {
    setSlots((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });
  }, []);

  const rotateAt = useCallback((idx) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, rotation: (s.rotation + 90) % 360 } : s))
    );
  }, []);

  const removeAt = useCallback((idx) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  async function submit() {
    if (!file || slots.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const meta = JSON.stringify({
        order: slots.map((s) => s.srcIndex),
        rotations: slots.map((s) => s.rotation),
      });
      const blob = await postMultipart("reorder-pdf", { file }, { meta });
      downloadBlob(blob, "organized.pdf");
      setFile(null);
      setSlots([]);
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t("organizePdf")}</h1>
          <p className="text-zinc-500">Reorder, rotate, or drop pages before saving.</p>
        </div>
        <PinCurrentToolButton href="/organize-pdf" label={t("organizePdf")} />
      </div>

      {!file ? (
        <UploadArea
          onFiles={(fs) => {
            setError("");
            if (fs?.[0]) setFile(fs[0]);
          }}
          title="Upload PDF"
          description="Thumbnails are generated in your browser"
          color="orange"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <button type="button" className="text-indigo-600 font-medium" onClick={() => setFile(null)}>
              Change file
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy || slots.length === 0}
              className="ml-auto rounded-xl bg-orange-600 text-white px-4 py-2 font-semibold disabled:opacity-50"
            >
              {busy ? "…" : t("download")}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((s, idx) => (
              <div key={`${s.srcIndex}-${idx}`} className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
                <div className="relative aspect-[3/4] bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URL thumbnails */}
                  <img
                    src={s.thumb}
                    alt=""
                    className="w-full h-full object-contain"
                    style={{ transform: `rotate(${s.rotation}deg)` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-1 p-2 text-xs border-t border-zinc-100">
                  <span className="text-zinc-500">#{s.srcIndex + 1}</span>
                  <div className="flex gap-1">
                    <button type="button" className="p-1 rounded hover:bg-zinc-100" onClick={() => move(idx, -1)} aria-label="Up">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-zinc-100" onClick={() => move(idx, 1)} aria-label="Down">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-zinc-100" onClick={() => rotateAt(idx)} aria-label="Rotate">
                      <RotateCw className="h-4 w-4" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-red-50 text-red-600" onClick={() => removeAt(idx)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
