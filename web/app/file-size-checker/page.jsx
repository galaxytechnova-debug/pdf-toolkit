"use client";
import { useState, useCallback } from "react";
import { FileSearch, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

export default function FileSizeCheckerPage() {
  const [files, setFiles] = useState([]); // [{ name, size, type }]
  const [targetKB, setTargetKB] = useState(200);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = Array.from(e.dataTransfer?.files || []);
    addFiles(dropped);
  }, []);

  const onSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
  };

  const addFiles = (newFiles) => {
    const mapped = newFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type || "unknown",
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    }));
    setFiles(prev => [...prev, ...mapped]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const targetBytes = targetKB * 1024;

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">File Size Checker</h1>
        <p className="text-zinc-500">Instantly check if your files meet portal upload limits. No file leaves your browser.</p>
      </div>

      {/* Target Size Selector */}
      <div className="mb-8 max-w-md mx-auto">
        <label className="text-sm font-medium text-zinc-700 block mb-2">Portal Size Limit</label>
        <div className="flex gap-2 flex-wrap">
          {[100, 200, 500, 1024, 2048, 5120].map(kb => (
            <button
              key={kb}
              onClick={() => setTargetKB(kb)}
              className={`rounded-xl px-4 py-2 text-sm font-medium border transition-all ${targetKB === kb ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"}`}
            >
              {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
            </button>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        className="relative mb-8 border-2 border-dashed border-zinc-300 rounded-2xl p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer"
      >
        <input type="file" multiple onChange={onSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
        <Upload className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-700">Drop files here or click to select</p>
        <p className="text-xs text-zinc-500 mt-1">Check any file type — PDF, images, documents</p>
      </div>

      {/* Results */}
      {files.length > 0 && (
        <div className="animate-slide-up space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">{files.length} file{files.length !== 1 && "s"} checked</h2>
            <button onClick={() => setFiles([])} className="text-sm text-zinc-500 hover:text-zinc-700 font-medium">Clear all</button>
          </div>

          {files.map(f => {
            const isUnder = f.size <= targetBytes;
            return (
              <div key={f.id} className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${isUnder ? "bg-emerald-50/50 border-emerald-200" : "bg-red-50/50 border-red-200"}`}>
                <div className={`h-10 w-10 flex items-center justify-center rounded-lg shrink-0 ${isUnder ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                  {isUnder ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{f.name}</p>
                  <p className="text-xs text-zinc-500">{f.type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${isUnder ? "text-emerald-700" : "text-red-700"}`}>{formatSize(f.size)}</p>
                  <p className={`text-xs ${isUnder ? "text-emerald-600" : "text-red-600"}`}>
                    {isUnder ? `✓ Under ${targetKB >= 1024 ? `${targetKB / 1024} MB` : `${targetKB} KB`}` : `✗ Over by ${formatSize(f.size - targetBytes)}`}
                  </p>
                </div>
                <button onClick={() => removeFile(f.id)} className="text-zinc-400 hover:text-zinc-600 shrink-0">✕</button>
              </div>
            );
          })}

          {/* Summary */}
          <div className="mt-6 rounded-xl bg-zinc-50 border border-zinc-200 p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-zinc-900">{files.length}</p>
              <p className="text-xs text-zinc-500">Total Files</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{files.filter(f => f.size <= targetBytes).length}</p>
              <p className="text-xs text-zinc-500">Under Limit</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{files.filter(f => f.size > targetBytes).length}</p>
              <p className="text-xs text-zinc-500">Over Limit</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
