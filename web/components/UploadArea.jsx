"use client";
import { useState, useCallback, memo } from "react";

function UploadAreaBase({ multiple = false, onFiles, icon: Icon, title, description, color = "indigo" }) {
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDrag(false);
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  const colorClasses = {
    indigo: { border: "border-indigo-500", bg: "bg-indigo-50/50", ring: "ring-indigo-100", text: "text-indigo-600", from: "from-indigo-50", to: "to-violet-50", hoverBorder: "hover:border-indigo-400" },
    rose: { border: "border-rose-500", bg: "bg-rose-50/50", ring: "ring-rose-100", text: "text-rose-600", from: "from-rose-50", to: "to-pink-50", hoverBorder: "hover:border-rose-400" },
    orange: { border: "border-orange-500", bg: "bg-orange-50/50", ring: "ring-orange-100", text: "text-orange-600", from: "from-orange-50", to: "to-amber-50", hoverBorder: "hover:border-orange-400" },
    emerald: { border: "border-emerald-500", bg: "bg-emerald-50/50", ring: "ring-emerald-100", text: "text-emerald-600", from: "from-emerald-50", to: "to-teal-50", hoverBorder: "hover:border-emerald-400" },
    sky: { border: "border-sky-500", bg: "bg-sky-50/50", ring: "ring-sky-100", text: "text-sky-600", from: "from-sky-50", to: "to-cyan-50", hoverBorder: "hover:border-sky-400" },
    violet: { border: "border-violet-500", bg: "bg-violet-50/50", ring: "ring-violet-100", text: "text-violet-600", from: "from-violet-50", to: "to-purple-50", hoverBorder: "hover:border-violet-400" },
    fuchsia: { border: "border-fuchsia-500", bg: "bg-fuchsia-50/50", ring: "ring-fuchsia-100", text: "text-fuchsia-600", from: "from-fuchsia-50", to: "to-pink-50", hoverBorder: "hover:border-fuchsia-400" },
    lime: { border: "border-lime-500", bg: "bg-lime-50/50", ring: "ring-lime-100", text: "text-lime-600", from: "from-lime-50", to: "to-green-50", hoverBorder: "hover:border-lime-400" },
    cyan: { border: "border-cyan-500", bg: "bg-cyan-50/50", ring: "ring-cyan-100", text: "text-cyan-600", from: "from-cyan-50", to: "to-blue-50", hoverBorder: "hover:border-cyan-400" },
    slate: { border: "border-slate-500", bg: "bg-slate-50/50", ring: "ring-slate-100", text: "text-slate-600", from: "from-slate-50", to: "to-zinc-50", hoverBorder: "hover:border-slate-400" },
    zinc: { border: "border-zinc-500", bg: "bg-zinc-50/50", ring: "ring-zinc-100", text: "text-zinc-600", from: "from-zinc-50", to: "to-neutral-50", hoverBorder: "hover:border-zinc-400" },
    green: { border: "border-green-500", bg: "bg-green-50/50", ring: "ring-green-100", text: "text-green-700", from: "from-green-50", to: "to-emerald-50", hoverBorder: "hover:border-green-400" },
    amber: { border: "border-amber-500", bg: "bg-amber-50/50", ring: "ring-amber-100", text: "text-amber-800", from: "from-amber-50", to: "to-yellow-50", hoverBorder: "hover:border-amber-400" },
  };

  const theme = colorClasses[color] || colorClasses.indigo;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`group relative rounded-3xl border-2 border-dashed p-6 sm:p-12 text-center transition-all duration-300 ease-out ` +
        (drag
          ? `${theme.border} ${theme.bg} shadow-xl scale-[1.02]`
          : `${theme.border} bg-white/50 ${theme.hoverBorder} hover:bg-white hover:shadow-lg hover:scale-[1.01]`)}
    >
      <input
        type="file"
        multiple={multiple}
        className="hidden"
        onChange={(e) => onFiles(Array.from(e.target.files || []))}
        id="uploader"
      />
      <label htmlFor="uploader" className="cursor-pointer select-none block">
        <div className={`mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-linear-to-br ${theme.from} ${theme.to} ${theme.text} ring-1 ring-inset ${theme.ring} transition-transform duration-300 ${drag ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
          {Icon ? <Icon className="h-8 w-8 sm:h-10 sm:w-10" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 sm:h-10 sm:w-10">
              <path d="M12 16a1 1 0 0 1-1-1V9.41l-1.3 1.3a1 1 0 1 1-1.4-1.42l3-3a1 1 0 0 1 1.4 0l3 3a1 1 0 0 1-1.4 1.42L13 9.4V15a1 1 0 0 1-1 1Z" />
              <path d="M7 18a5 5 0 0 1-.88-9.94A6.5 6.5 0 0 1 18.5 9h.02A4.5 4.5 0 0 1 18 18H7Z" />
            </svg>
          )}
        </div>
        <div className="text-lg sm:text-xl font-semibold text-zinc-900 mb-2">{title || "Choose files or drag & drop"}</div>
        <div className="text-xs sm:text-sm text-zinc-500">{description || `PDF${multiple ? "s" : ""} • Max 50MB each`}</div>
      </label>
    </div>
  );
}

export default memo(UploadAreaBase);
