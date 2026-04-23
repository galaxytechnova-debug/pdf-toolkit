"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Files,
  SplitSquareVertical,
  Archive,
  Pencil,
  Image as ImageIcon,
  Globe,
  FileText,
  Presentation,
  FileSpreadsheet,
  Hash,
  RotateCw,
  Droplet,
  Maximize,
  Lock,
  Unlock,
  Target,
  Images,
  AlignVerticalSpaceAround,
  PenTool,
  Type,
  EyeOff,
  FileSearch,
  Scissors,
} from "lucide-react";
import { useLanguage } from "@/lib/i18nContext";

const groups = [
  {
    label: "nav.pdftools",
    items: [
      { href: "/merge-pdf", label: "Merge PDF", Icon: Files, bg: "bg-rose-50", fg: "text-rose-600" },
      { href: "/split-pdf", label: "Split PDF", Icon: SplitSquareVertical, bg: "bg-orange-50", fg: "text-orange-600" },
      { href: "/compress-pdf", label: "Compress PDF", Icon: Archive, bg: "bg-emerald-50", fg: "text-emerald-600" },
      { href: "/compress-to-size", label: "Compress to Size", Icon: Target, bg: "bg-amber-50", fg: "text-amber-600" },
      { href: "/extract-pages", label: "Extract Pages", Icon: Scissors, bg: "bg-orange-50", fg: "text-orange-600" },
      { href: "/organize-pdf", label: "Organize PDF", Icon: Hash, bg: "bg-teal-50", fg: "text-teal-600" },
      { href: "/add-header-footer", label: "Header & Footer", Icon: AlignVerticalSpaceAround, bg: "bg-violet-50", fg: "text-violet-600" },
      { href: "/watermark-pdf", label: "Watermark", Icon: Droplet, bg: "bg-cyan-50", fg: "text-cyan-600" },
      { href: "/resize-pdf", label: "Resize PDF", Icon: Maximize, bg: "bg-indigo-50", fg: "text-indigo-600" },
      { href: "/rotate-pdf", label: "Rotate PDF", Icon: RotateCw, bg: "bg-sky-50", fg: "text-sky-600" },
      { href: "/file-size-checker", label: "Size Checker", Icon: FileSearch, bg: "bg-indigo-50", fg: "text-indigo-600" },
    ],
  },
  {
    label: "nav.fillsign",
    items: [
      { href: "/sign-pdf", label: "E-Sign PDF", Icon: PenTool, bg: "bg-blue-50", fg: "text-blue-600" },
      { href: "/redact-pdf", label: "Redact PDF", Icon: EyeOff, bg: "bg-zinc-100", fg: "text-zinc-700" },
      { href: "/edit-pdf", label: "Edit PDF", Icon: Pencil, bg: "bg-blue-50", fg: "text-blue-600" },
    ],
  },
  {
    label: "nav.security",
    items: [
      { href: "/lock-pdf", label: "Lock PDF", Icon: Lock, bg: "bg-red-50", fg: "text-red-600" },
      { href: "/unlock-pdf", label: "Unlock PDF", Icon: Unlock, bg: "bg-green-50", fg: "text-green-600" },
    ],
  },
  {
    label: "nav.convert",
    sections: [
      {
        title: "Convert to PDF",
        items: [
          { href: "/images-to-pdf", label: "Images to PDF", Icon: Images, bg: "bg-pink-50", fg: "text-pink-600" },
          { href: "/jpg-to-pdf", label: "JPG to PDF", Icon: ImageIcon, bg: "bg-yellow-50", fg: "text-yellow-600" },
          { href: "/word-to-pdf", label: "Word to PDF", Icon: FileText, bg: "bg-fuchsia-50", fg: "text-fuchsia-600" },
          { href: "/ppt-to-pdf", label: "PowerPoint to PDF", Icon: Presentation, bg: "bg-violet-50", fg: "text-violet-600" },
          { href: "/excel-to-pdf", label: "Excel to PDF", Icon: FileSpreadsheet, bg: "bg-lime-50", fg: "text-lime-600" },
          { href: "/html-to-pdf", label: "HTML to PDF", Icon: Globe, bg: "bg-indigo-50", fg: "text-indigo-600" },
        ],
      },
      {
        title: "Convert from PDF",
        items: [
          { href: "/pdf-to-jpg", label: "PDF to JPG", Icon: ImageIcon, bg: "bg-yellow-50", fg: "text-yellow-600" },
          { href: "/pdf-to-word", label: "PDF to Word", Icon: FileText, bg: "bg-fuchsia-50", fg: "text-fuchsia-600" },
          { href: "/pdf-to-ppt", label: "PDF to PowerPoint", Icon: Presentation, bg: "bg-violet-50", fg: "text-violet-600" },
          { href: "/pdf-to-excel", label: "PDF to Excel", Icon: FileSpreadsheet, bg: "bg-lime-50", fg: "text-lime-600" },
          { href: "/pdf-to-pdfa", label: "PDF to PDF/A", Icon: FileText, bg: "bg-blue-50", fg: "text-blue-600" },
        ],
      },
    ],
  },
  {
    label: "nav.images",
    items: [
      { href: "/compress-image", label: "Compress Image", Icon: ImageIcon, bg: "bg-cyan-50", fg: "text-cyan-600" },
    ],
  },
];

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0, width: 0 });

  function openDropdown(label, triggerEl) {
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const pad = 16; // viewport padding
    const group = groups.find((g) => g.label === label);
    const count = group?.sections ? group.sections.length : (group?.items?.length ?? 0);
    const idealCols = group?.sections ? group.sections.length : Math.min(3, Math.max(1, count));
    const colWidth = 180; // width per column
    const gutter = 12 * (idealCols - 1);
    const padding = 24; // panel inner padding estimate
    const desired = Math.max(280, Math.min(560, idealCols * colWidth + gutter + padding));
    const width = Math.min(desired, Math.max(280, vw - pad * 2));
    const center = rect.left + rect.width / 2;
    const left = Math.min(Math.max(pad, center - width / 2), vw - width - pad);
    const top = rect.bottom + 8; // gap under trigger
    setMenuPos({ left, top, width });
    setOpenMenu(label);
  }

  useEffect(() => {
    function close() {
      setOpenMenu("");
    }
    if (openMenu) {
      window.addEventListener("scroll", close, { passive: true });
      window.addEventListener("resize", close);
      return () => {
        window.removeEventListener("scroll", close);
        window.removeEventListener("resize", close);
      };
    }
  }, [openMenu]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    const original = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original || "";
    }
    return () => {
      document.body.style.overflow = original || "";
    };
  }, [mobileOpen]);
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Left side: Logo */}
            <div className="flex items-center md:w-[200px]">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <FileText className="h-6 w-6 text-indigo-600" strokeWidth={2.5} />
                    <div className="absolute -right-1 -bottom-1 bg-white rounded-full">
                        <svg className="h-3 w-3 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                  </div>
                  <span className="text-lg font-bold tracking-tight text-violet-600">Pro PDF Toolkit</span>
                </Link>
            </div>

            {/* Center: Nav */}
            <nav className="relative hidden md:flex flex-1 items-center justify-center gap-1 text-sm">
              {groups.map((g) => (
                <div
                  key={g.label}
                  className="relative"
                  onMouseEnter={(e) => openDropdown(g.label, e.currentTarget)}
                >
                  <button
                    className={`inline-flex items-center gap-1 rounded-full px-4 py-2 font-medium transition-all duration-200 hover:bg-zinc-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${openMenu === g.label ? "text-indigo-600 bg-indigo-50/50" : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setOpenMenu("");
                    }}
                    aria-expanded={openMenu === g.label}
                    onClick={(e) =>
                      openMenu === g.label
                        ? setOpenMenu("")
                        : openDropdown(g.label, e.currentTarget.parentElement)
                    }
                    aria-haspopup="menu"
                  >
                    {t(g.label)}
                    <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${openMenu === g.label ? 'rotate-180 text-indigo-500' : 'text-zinc-400'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" /></svg>
                  </button>
                  {openMenu === g.label && (
                    <div
                      className="fixed z-[60] rounded-2xl border border-zinc-200/60 bg-white/90 backdrop-blur-xl p-4 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
                      style={{ left: menuPos.left, top: menuPos.top, width: menuPos.width, maxHeight: 'min(70vh, 560px)' }}
                      onMouseLeave={() => setOpenMenu("")}
                      onMouseEnter={() => setOpenMenu(g.label)}
                    >
                      {/* caret */}
                      <div className="pointer-events-none absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm bg-white border-l border-t border-zinc-200" />

                      {g.sections ? (
                        <div className="grid gap-6 md:grid-cols-2">
                          {g.sections.map((sec) => (
                            <div key={sec.title}>
                              <div className="px-1 pb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">{sec.title}</div>
                              <div className="grid gap-2">
                                {sec.items.map((l) => (
                                  <Link
                                    key={l.href}
                                    href={l.href}
                                    className="group/item flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-indigo-50/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                                  >
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${l.bg} transition-transform duration-200 group-hover/item:scale-110 group-hover/item:rotate-3`}>
                                      {l.Icon && <l.Icon className={`h-5 w-5 ${l.fg}`} aria-hidden />}
                                    </div>
                                    <span className="flex-1 text-sm font-medium text-zinc-700 group-hover/item:text-indigo-900">{t(l.label)}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="grid gap-2 overflow-auto"
                          style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, g.items.length))}, minmax(0, 1fr))` }}
                        >
                          {g.items.map((l) => (
                            <Link
                              key={l.href}
                              href={l.href}
                              className="group/item flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-indigo-50/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                            >
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${l.bg} transition-transform duration-200 group-hover/item:scale-110 group-hover/item:rotate-3`}>
                                {l.Icon && <l.Icon className={`h-5 w-5 ${l.fg}`} aria-hidden />}
                              </div>
                              <span className="flex-1 text-sm font-medium text-zinc-700 group-hover/item:text-indigo-900">{t(l.label)}</span>
                              <svg className="h-4 w-4 text-indigo-400 opacity-0 -translate-x-2 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:translate-x-0" viewBox="0 0 20 20" fill="currentColor"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right side: Language & Mobile Toggle */}
            <div className="flex items-center justify-end gap-2 md:w-[200px]">
              <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="mr">मराठी</option>
              </select>

              {!mobileOpen && (
                <button
                  onClick={() => setMobileOpen(true)}
                  aria-expanded={mobileOpen}
                  className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                >
                  <span className="sr-only">Menu</span>
                  <svg className="h-5 w-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {openMenu && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpenMenu("")} />
      )}

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white/95 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5 transition-transform duration-300 ease-out will-change-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-6 bg-white/50 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <FileText className="h-6 w-6 text-indigo-600" strokeWidth={2.5} />
              <div className="absolute -right-1 -bottom-1 bg-white rounded-full">
                <svg className="h-3 w-3 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-violet-600">Pro PDF Toolkit</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <nav className="px-4 py-4 overflow-y-auto h-[calc(100vh-64px)] scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
          {groups.map((g) => (
            <div key={g.label} className="mb-6 last:mb-0">
              <div className="px-2 pb-3 text-[11px] font-bold tracking-wider text-indigo-900/40 uppercase">{g.label}</div>
              {g.sections ? (
                <div className="space-y-4">
                  {g.sections.map((sec) => (
                    <div key={sec.title}>
                      <div className="px-2 pb-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">{sec.title}</div>
                      <div className="grid gap-1">
                        {sec.items.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            onClick={() => setMobileOpen(false)}
                            className="group flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-indigo-50/60 active:bg-indigo-100/50"
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${l.bg} transition-transform duration-200 group-hover:scale-105 shadow-sm ring-1 ring-black/5`}>
                              {l.Icon && <l.Icon className={`h-4 w-4 ${l.fg}`} aria-hidden />}
                            </div>
                            <span className="flex-1 text-sm font-medium text-zinc-600 group-hover:text-indigo-900 transition-colors">{l.label}</span>
                            <svg className="h-4 w-4 text-indigo-300 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-1">
                  {g.items.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="group flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-indigo-50/60 active:bg-indigo-100/50"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${l.bg} transition-transform duration-200 group-hover:scale-105 shadow-sm ring-1 ring-black/5`}>
                        {l.Icon && <l.Icon className={`h-4 w-4 ${l.fg}`} aria-hidden />}
                      </div>
                      <span className="flex-1 text-sm font-medium text-zinc-600 group-hover:text-indigo-900 transition-colors">{l.label}</span>
                      <svg className="h-4 w-4 text-indigo-300 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="mt-8 pt-6 border-t border-zinc-100">
            <div className="flex justify-center gap-4 text-zinc-400">
              <span className="text-xs">© 2026 Pro PDF Toolkit</span>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
