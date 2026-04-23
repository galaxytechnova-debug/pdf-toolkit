"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { Lock, EyeOff } from "lucide-react";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function LockPdfPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");

  const onFiles = (files) => {
    setError("");
    if (files.length !== 1) {
      setError("Please select a single PDF file.");
      return;
    }
    setFile(files[0]);
  };

  const handleProcess = async () => {
    if (!file || !password) return;
    setBusy(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const pdfBytes = new Uint8Array(arrayBuffer);
      const encryptedBytes = await encryptPDF(pdfBytes, password, {
          ownerPassword: password,
          algorithm: 'AES-256',
          allowPrinting: true,
          allowCopying: false,
          allowModifying: false
      });

      const blob = new Blob([encryptedBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `locked_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err.message || "Failed to lock PDF. Ensure it is not already locked.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Lock PDF</h1>
        <p className="text-zinc-500">Protect your PDF file with a strong password.</p>
      </div>

      {!file ? (
        <UploadArea
          onFiles={onFiles}
          icon={Lock}
          title="Select PDF to Lock"
          description="Drag & drop a PDF file"
          color="red"
        />
      ) : (
        <div className="animate-slide-up bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden max-w-xl mx-auto">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Lock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => setFile(null)} className="text-sm font-medium text-red-600 hover:text-red-700">Change</button>
            </div>

            <div className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Set Password</label>
                  <div className="relative">
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter secure password..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">This password will be required to open the document.</p>
                </div>

                <button
                  onClick={handleProcess}
                  disabled={busy || !password}
                  className="w-full rounded-xl bg-linear-to-r from-red-500 to-rose-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {busy ? "Locking PDF..." : "Lock PDF"}
                </button>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
        </div>
      )}
    </main>
  );
}
