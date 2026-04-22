"use client";

/** Rough hint: re-saved PDF is often similar size; extreme path may trim slightly */
export default function FileSizeHint({ file, tool = "compress" }) {
  if (!file) return null;
  const mb = file.size / 1024 / 1024;
  const estLow = mb * 0.92;
  const estHigh = mb * 1.02;
  return (
    <p className="text-xs text-zinc-500 mt-2">
      {tool === "compress" && (
        <>
          Original ~{mb.toFixed(2)} MB. Typical output after re-save is often in the{" "}
          <span className="font-medium text-zinc-700">
            {estLow.toFixed(2)}–{estHigh.toFixed(2)} MB
          </span>{" "}
          range (depends on images inside the PDF). <strong>Extreme</strong> rebuilds the file and may help
          slightly on some documents.
        </>
      )}
    </p>
  );
}
