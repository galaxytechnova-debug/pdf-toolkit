"use client";

export default function Loader({ label = "Processing..." }) {
  return (
    <div className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-700" role="status" aria-live="polite">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      <span>{label}</span>
    </div>
  );
}
