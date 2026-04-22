"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

import { Presentation } from "lucide-react";

export default function PptToPdfPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(files) {
    setError("");
    if (!files || files.length !== 1) { setError("Select a single .pptx file."); return; }
    const f = files[0];
    setBusy(true);
    try {
      const blob = await postMultipart("ppt-to-pdf", { file: f });
      downloadBlob(blob, "converted.pdf");
    } catch (e) { setError(e.message || "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">PowerPoint to PDF</h1>
        <p className="text-zinc-500">Convert your presentations to easy-to-share PDFs.</p>
      </div>

      <UploadArea
        onFiles={onFiles}
        icon={Presentation}
        title="Select PowerPoint File"
        description="Drag & drop a .pptx file to convert"
        color="violet"
      />
      {busy && <div className="mt-8 text-center animate-pulse text-violet-600 font-medium">Converting Presentation...</div>}
      {error && <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-shake">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 001 1 1 1 0 001-1V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        {error}
      </div>}
    </main>
  );
}
