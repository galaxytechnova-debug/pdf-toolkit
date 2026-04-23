"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18nContext";
import {
  Files,
  SplitSquareVertical,
  Archive,
  Image as ImageIcon,
  Pencil,
  Globe,
  FileText,
  Presentation,
  FileSpreadsheet,
  ArrowRight,
  Hash,
  RotateCw,
  Droplet,
  Maximize,
  Lock,
  Unlock,
  Pin,
  PinOff,
  Target,
  Images,
  AlignVerticalSpaceAround,
  PenTool,
  Type,
  EyeOff,
  FileSearch,
  Scissors,
  Sparkles,
  Bookmark,
  Wifi,
  Keyboard,
} from "lucide-react";

/* ── Category Definitions ────────────────────────── */
const categories = [
  {
    id: "popular",
    title: "Popular Tools",
    subtitle: "Most used by students, offices & cafes",
    gradient: "from-rose-500 to-orange-500",
    tools: [
      { href: "/merge-pdf", label: "Merge PDF", Icon: Files, desc: "Combine multiple PDFs into one.", bg: "bg-rose-50", fg: "text-rose-600" },
      { href: "/split-pdf", label: "Split PDF", Icon: SplitSquareVertical, desc: "Extract pages or split by ranges.", bg: "bg-orange-50", fg: "text-orange-600" },
      { href: "/compress-pdf", label: "Compress PDF", Icon: Archive, desc: "Reduce file size without losing quality.", bg: "bg-emerald-50", fg: "text-emerald-600" },
      { href: "/compress-to-size", label: "Compress to Size", Icon: Target, desc: "Set target KB and download guaranteed-size file.", bg: "bg-amber-50", fg: "text-amber-600" },
      { href: "/extract-pages", label: "Extract Pages", Icon: Scissors, desc: "Select & download only the pages you need.", bg: "bg-orange-50", fg: "text-orange-600" },
      { href: "/file-size-checker", label: "File Size Checker", Icon: FileSearch, desc: "Instantly check if files meet portal limits.", bg: "bg-indigo-50", fg: "text-indigo-600" },
    ],
  },
  {
    id: "edit",
    title: "Edit & Organize",
    subtitle: "Page numbers, headers, rotate, reorder",
    gradient: "from-violet-500 to-purple-500",
    tools: [
      { href: "/organize-pdf", label: "Organize PDF", Icon: Hash, desc: "Add numbers, rotate, and arrange pages.", bg: "bg-teal-50", fg: "text-teal-600" },
      { href: "/add-header-footer", label: "Header & Footer", Icon: AlignVerticalSpaceAround, desc: "Add custom header/footer on every page.", bg: "bg-violet-50", fg: "text-violet-600" },
      { href: "/watermark-pdf", label: "Watermark PDF", Icon: Droplet, desc: "Add text watermark to your PDF.", bg: "bg-cyan-50", fg: "text-cyan-600" },
      { href: "/resize-pdf", label: "Resize PDF", Icon: Maximize, desc: "Scale PDF pages to A4/A3.", bg: "bg-indigo-50", fg: "text-indigo-600" },
      { href: "/rotate-pdf", label: "Rotate PDF", Icon: RotateCw, desc: "Fix upside-down or sideways scans.", bg: "bg-sky-50", fg: "text-sky-600" },
    ],
  },
  {
    id: "fillsign",
    title: "Fill & Sign",
    subtitle: "Sign documents, fill forms, redact info",
    gradient: "from-blue-500 to-indigo-500",
    tools: [
      { href: "/sign-pdf", label: "E-Sign PDF", Icon: PenTool, desc: "Draw and place your signature on any page.", bg: "bg-blue-50", fg: "text-blue-600" },
      { href: "/redact-pdf", label: "Redact PDF", Icon: EyeOff, desc: "Black out Aadhaar, salary, sensitive info.", bg: "bg-zinc-100", fg: "text-zinc-700" },
      { href: "/edit-pdf", label: "Edit PDF", Icon: Pencil, desc: "Advanced PDF editing tools.", bg: "bg-blue-50", fg: "text-blue-600" },
    ],
  },
  {
    id: "convert",
    title: "Convert",
    subtitle: "PDF ⇄ Word, Excel, PowerPoint, Images",
    gradient: "from-fuchsia-500 to-pink-500",
    tools: [
      { href: "/images-to-pdf", label: "Images to PDF", Icon: Images, desc: "Combine multiple scans into one PDF.", bg: "bg-pink-50", fg: "text-pink-600" },
      { href: "/jpg-to-pdf", label: "JPG to PDF", Icon: ImageIcon, desc: "Convert single image to PDF.", bg: "bg-yellow-50", fg: "text-yellow-600" },
      { href: "/pdf-to-image", label: "PDF to Image", Icon: ImageIcon, desc: "Convert pages into PNG/JPG images.", bg: "bg-sky-50", fg: "text-sky-600" },
      { href: "/word-to-pdf", label: "Word to PDF", Icon: FileText, desc: "Convert DOCX files to PDF.", bg: "bg-fuchsia-50", fg: "text-fuchsia-600" },
      { href: "/pdf-to-word", label: "PDF to Word", Icon: FileText, desc: "Edit PDFs by converting to DOCX.", bg: "bg-fuchsia-50", fg: "text-fuchsia-600" },
      { href: "/ppt-to-pdf", label: "PPT to PDF", Icon: Presentation, desc: "Export presentations as PDFs.", bg: "bg-violet-50", fg: "text-violet-600" },
      { href: "/pdf-to-ppt", label: "PDF to PPT", Icon: Presentation, desc: "Make slides from a PDF.", bg: "bg-violet-50", fg: "text-violet-600" },
      { href: "/excel-to-pdf", label: "Excel to PDF", Icon: FileSpreadsheet, desc: "Save spreadsheets as PDFs.", bg: "bg-lime-50", fg: "text-lime-600" },
      { href: "/pdf-to-excel", label: "PDF to Excel", Icon: FileSpreadsheet, desc: "Extract tables into XLSX.", bg: "bg-lime-50", fg: "text-lime-600" },
      { href: "/html-to-pdf", label: "HTML to PDF", Icon: Globe, desc: "Turn web pages into PDFs.", bg: "bg-indigo-50", fg: "text-indigo-600" },
      { href: "/compress-image", label: "Compress Image", Icon: ImageIcon, desc: "Shrink PNG/JPG files smartly.", bg: "bg-cyan-50", fg: "text-cyan-600" },
    ],
  },
  {
    id: "security",
    title: "Security & Utility",
    subtitle: "Lock, unlock, and utility tools",
    gradient: "from-red-500 to-rose-500",
    tools: [
      { href: "/lock-pdf", label: "Lock PDF", Icon: Lock, desc: "Password protect your PDF.", bg: "bg-red-50", fg: "text-red-600" },
      { href: "/unlock-pdf", label: "Unlock PDF", Icon: Unlock, desc: "Remove PDF password.", bg: "bg-green-50", fg: "text-green-600" },
    ],
  },
];

/* Coming soon features */
const comingSoon = [
  { label: "Batch Convert", Icon: Sparkles, desc: "Convert multiple files at once." },
  { label: "PDF Bookmarks", Icon: Bookmark, desc: "Add bookmarks & table of contents." },
  { label: "Offline Mode", Icon: Wifi, desc: "Work without internet." },
  { label: "Keyboard Shortcuts", Icon: Keyboard, desc: "Power-user shortcuts for every tool." },
];

/* Flatten all tools for pinning */
const allTools = categories.flatMap(c => c.tools);

export default function Home() {
  const { t } = useLanguage();
  const [pinned, setPinned] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("pinnedTools") || "[]");
      setPinned(stored);
    } catch (e) {
      setPinned([]);
    }
  }, []);

  const togglePin = (e, tool) => {
    e.preventDefault();
    e.stopPropagation();
    let newPinned = [...pinned];
    if (newPinned.some(p => p.href === tool.href)) {
      newPinned = newPinned.filter(p => p.href !== tool.href);
    } else {
      if (newPinned.length >= 6) newPinned.shift();
      newPinned.push({ href: tool.href, label: tool.label });
    }
    setPinned(newPinned);
    localStorage.setItem("pinnedTools", JSON.stringify(newPinned));
    window.dispatchEvent(new Event("pinnedToolsUpdate"));
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12 sm:pt-10 sm:pb-20">
      {/* Hero Section */}
      <section className="text-center mb-10 sm:mb-16 animate-fade-in">
        <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50/50 px-3 py-1 text-sm font-medium text-indigo-600 mb-5 backdrop-blur-sm">
          <span>✨ The Ultimate PDF Toolkit</span>
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
          <span className="block text-zinc-900">{t('hero.title')}</span>
          <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent pb-2">
            {t('hero.subtitle')}
          </span>
        </h1>
        <p className="mx-auto max-w-xl sm:max-w-2xl text-base sm:text-lg text-zinc-600 mb-8 sm:mb-10 leading-relaxed px-2">
          {t('hero.desc')}
        </p>

        {/* Abstract decorative blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[300px] h-[300px] sm:w-[800px] sm:h-[800px] bg-indigo-500/10 rounded-full blur-3xl opacity-50 pointer-events-none mix-blend-multiply animate-pulse" />
        <div className="absolute top-20 right-0 -z-10 w-[250px] h-[250px] sm:w-[600px] sm:h-[600px] bg-violet-500/10 rounded-full blur-3xl opacity-50 pointer-events-none mix-blend-multiply" />
      </section>

      {/* Categorized Tools */}
      <div className="space-y-16">
        {categories.map((cat, catIdx) => (
          <section key={cat.id} className="animate-slide-up" style={{ animationDelay: `${catIdx * 0.1}s` }}>
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`h-1 w-10 rounded-full bg-gradient-to-r ${cat.gradient}`} />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">{cat.title}</h2>
                <p className="text-sm text-zinc-500">{cat.subtitle}</p>
              </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[...cat.tools].sort((a, b) => {
                const ap = pinned.some(p => p.href === a.href);
                const bp = pinned.some(p => p.href === b.href);
                if (ap && !bp) return -1;
                if (!ap && bp) return 1;
                return 0;
              }).map((tool, i) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-md p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-white hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tool.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner shrink-0`}>
                      <tool.Icon className={`h-5.5 w-5.5 ${tool.fg}`} aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold tracking-tight text-zinc-900 mb-1 group-hover:text-indigo-900 transition-colors">{t(tool.label)}</h3>
                      <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-600 line-clamp-2">{t(tool.desc)}</p>
                    </div>
                    <button
                      onClick={(e) => togglePin(e, tool)}
                      className={`p-1.5 rounded-full transition-all z-10 cursor-pointer ${pinned.some(p => p.href === tool.href) ? "bg-indigo-100 text-indigo-600 opacity-100" : "text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-500"}`}
                      title={pinned.some(p => p.href === tool.href) ? "Unpin" : "Pin to bar"}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-transparent to-violet-50/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* Coming Soon Section */}
        <section className="animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 w-10 rounded-full bg-gradient-to-r from-zinc-400 to-zinc-500" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Coming Soon</h2>
              <p className="text-sm text-zinc-500">Advanced features in development</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {comingSoon.map(item => (
              <div
                key={item.label}
                className="relative rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-5 opacity-60 cursor-default"
              >
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-semibold uppercase tracking-wider">
                  Soon
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 shrink-0">
                    <item.Icon className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700">{item.label}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
