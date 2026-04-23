"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Files, SplitSquareVertical, Archive, Pencil, Image as ImageIcon, 
  Globe, FileText, Presentation, FileSpreadsheet, Hash, RotateCw, Droplet, Maximize, Lock, Unlock, PinOff, Pin,
  Target, Images, AlignVerticalSpaceAround, PenTool, Type, EyeOff, FileSearch, Scissors
} from "lucide-react";

// Map slugs to icons
const iconMap = {
  "/merge-pdf": Files, "/split-pdf": SplitSquareVertical, "/compress-pdf": Archive,
  "/compress-to-size": Target, "/extract-pages": Scissors,
  "/edit-pdf": Pencil, "/organize-pdf": Hash,
  "/add-header-footer": AlignVerticalSpaceAround,
  "/watermark-pdf": Droplet, "/resize-pdf": Maximize, "/rotate-pdf": RotateCw,
  "/lock-pdf": Lock, "/unlock-pdf": Unlock,
  "/sign-pdf": PenTool, "/redact-pdf": EyeOff,
  "/file-size-checker": FileSearch, "/images-to-pdf": Images,
  "/jpg-to-pdf": ImageIcon, "/word-to-pdf": FileText,
  "/ppt-to-pdf": Presentation, "/excel-to-pdf": FileSpreadsheet, "/html-to-pdf": Globe,
  "/pdf-to-jpg": ImageIcon, "/pdf-to-word": FileText, "/pdf-to-ppt": Presentation,
  "/pdf-to-excel": FileSpreadsheet, "/compress-image": ImageIcon, "/pdf-to-image": ImageIcon
};

export default function PinnedToolsBar() {
  const [pinned, setPinned] = useState([]);

  useEffect(() => {
    // Load pinned from localStorage
    const loadPinned = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("pinnedTools") || "[]");
        setPinned(stored);
      } catch (e) {
        setPinned([]);
      }
    };
    
    loadPinned();
    
    // Listen for changes from other tabs or same page
    window.addEventListener("storage", loadPinned);
    window.addEventListener("pinnedToolsUpdate", loadPinned);
    
    return () => {
      window.removeEventListener("storage", loadPinned);
      window.removeEventListener("pinnedToolsUpdate", loadPinned);
    };
  }, []);

  const unpin = (href) => {
    const newPinned = pinned.filter(t => t.href !== href);
    setPinned(newPinned);
    localStorage.setItem("pinnedTools", JSON.stringify(newPinned));
    window.dispatchEvent(new Event("pinnedToolsUpdate"));
  };

  if (!pinned || pinned.length === 0) return null;

  return (
    <div className="bg-zinc-900 text-zinc-300 py-1.5 px-4 sm:px-6 lg:px-8 flex items-center gap-4 overflow-x-auto scrollbar-none text-xs font-medium z-50">
      <span className="flex items-center gap-1.5 shrink-0 text-zinc-400">
        <Pin className="h-3 w-3" /> Pinned
      </span>
      <div className="w-px h-4 bg-zinc-700 shrink-0" />
      <div className="flex items-center gap-2">
        {pinned.map(t => {
          const Icon = iconMap[t.href] || FileText;
          return (
            <div key={t.href} className="group relative flex items-center bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors shrink-0">
              <Link href={t.href} className="flex items-center gap-1.5 px-3 py-1 text-zinc-100">
                <Icon className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white" />
                {t.label}
              </Link>
              <button 
                onClick={() => unpin(t.href)}
                className="pr-2 pl-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all focus:outline-none"
                title="Unpin"
              >
                <PinOff className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
