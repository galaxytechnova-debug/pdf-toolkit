"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { postMultipart, downloadBlob } from "@/lib/api";
import { PinCurrentToolButton } from "@/components/PinnedToolsBar";
import { useI18n } from "@/components/I18nProvider";

const UploadArea = dynamic(() => import("@/components/UploadArea"), { ssr: false });

export default function UnlockPdfPage() {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!file || !password.trim()) {
      setError("PDF and password are required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const blob = await postMultipart("unlock-pdf", { file }, { password: password.trim() });
      downloadBlob(blob, "unlocked.pdf");
      setFile(null);
      setPassword("");
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
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t("unlockPdf")}</h1>
          <p className="text-zinc-500">Remove open password so the file can be printed or merged.</p>
        </div>
        <PinCurrentToolButton href="/unlock-pdf" label={t("unlockPdf")} />
      </div>

      <label className="block text-sm font-medium text-zinc-700 mb-2">Open password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 mb-6 max-w-md"
        placeholder="Password from customer"
        autoComplete="new-password"
      />

      <UploadArea
        onFiles={(fs) => {
          setError("");
          if (fs?.[0]) setFile(fs[0]);
        }}
        title="Locked PDF"
        description="We never store your file"
        color="green"
      />

      {file && (
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="mt-6 rounded-xl bg-green-700 text-white px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Unlocking…" : "Unlock and download"}
        </button>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
