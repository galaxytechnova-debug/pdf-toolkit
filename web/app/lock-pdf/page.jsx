"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
import { PinCurrentToolButton } from "@/components/PinnedToolsBar";
import { useI18n } from "@/components/I18nProvider";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function LockPdfPage() {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!file || password.length < 4) {
      setError("Choose a PDF and a new password (min 4 characters).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fields = { password: password.trim() };
      if (currentPassword.trim()) fields.currentPassword = currentPassword.trim();
      const blob = await postMultipart("lock-pdf", { file }, fields);
      downloadBlob(blob, "locked.pdf");
      setFile(null);
      setPassword("");
      setCurrentPassword("");
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t("lockPdf")}</h1>
          <p className="text-zinc-500">Protect a PDF with an open password. If the file is already locked, enter the current password too.</p>
        </div>
        <PinCurrentToolButton href="/lock-pdf" label={t("lockPdf")} />
      </div>

      <div className="grid gap-4 mb-6 max-w-lg">
        <label className="text-sm font-medium text-zinc-700">
          New password (min 4 chars)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border rounded-xl px-3 py-2"
            autoComplete="new-password"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Current password (only if PDF is already locked)
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full border rounded-xl px-3 py-2"
            autoComplete="new-password"
          />
        </label>
      </div>

      <UploadArea
        onFiles={(fs) => {
          setError("");
          if (fs?.[0]) setFile(fs[0]);
        }}
        title="PDF to lock"
        description="Single file"
        color="amber"
      />

      {file && (
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="mt-6 rounded-xl bg-amber-800 text-white px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Working…" : "Lock and download"}
        </button>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
