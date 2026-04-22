"use client";
import { useState } from "react";
import { postJson, downloadBlob } from "@/lib/api";

export default function HtmlToPdfPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [html, setHtml] = useState("<h1>Hello</h1><p>Export me to PDF</p>");
  const [url, setUrl] = useState("");

  async function convert() {
    setError("");
    if (!html && !url) { setError("Provide HTML or URL"); return; }
    setBusy(true);
    try {
      const blob = await postJson("html-to-pdf", { html: html || undefined, url: url || undefined });
      downloadBlob(blob, "export.pdf");
    } catch (e) { setError(e.message || "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">HTML to PDF</h1>
        <p className="text-zinc-500">Convert web pages or raw HTML code into PDF documents.</p>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-8">
        <div className="grid gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Website URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-sm text-zinc-400 font-medium">OR PASTE HTML</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Raw HTML Code</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={8}
              className="w-full rounded-xl border-zinc-200 font-mono text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all bg-zinc-50"
              placeholder="&lt;h1&gt;Your HTML here&lt;/h1&gt;"
            />
          </div>

          <button
            onClick={convert}
            disabled={busy}
            className="w-full rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {busy ? 'Converting to PDF…' : 'Convert HTML to PDF'}
          </button>
        </div>

        {error && <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-shake">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 001 1 1 1 0 001-1V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>}
      </div>
    </main>
  );
}
