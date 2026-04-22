"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
  Printer,
  PenLine,
  Hash,
  LockKeyholeOpen,
  LockKeyhole,
  Layers,
  Droplets,
  Maximize2,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

function navGroupsFromT(t) {
  return [
      {
        label: t("navPdf"),
        items: [
          { href: "/merge-pdf", label: t("merge"), Icon: Files, bg: "bg-rose-50", fg: "text-rose-600" },
          { href: "/split-pdf", label: t("split"), Icon: SplitSquareVertical, bg: "bg-orange-50", fg: "text-orange-600" },
          { href: "/compress-pdf", label: t("compress"), Icon: Archive, bg: "bg-emerald-50", fg: "text-emerald-600" },
          { href: "/edit-pdf", label: t("edit"), Icon: Pencil, bg: "bg-blue-50", fg: "text-blue-600" },
        ],
      },
      {
        label: t("navConvert"),
        sections: [
          {
            title: t("toPdf"),
            items: [
              { href: "/jpg-to-pdf", label: t("jpgToPdf"), Icon: ImageIcon, bg: "bg-yellow-50", fg: "text-yellow-600" },
              { href: "/word-to-pdf", label: t("wordToPdf"), Icon: FileText, bg: "bg-fuchsia-50", fg: "text-fuchsia-600" },
              { href: "/ppt-to-pdf", label: t("pptToPdf"), Icon: Presentation, bg: "bg-violet-50", fg: "text-violet-600" },
              { href: "/excel-to-pdf", label: t("excelToPdf"), Icon: FileSpreadsheet, bg: "bg-lime-50", fg: "text-lime-600" },
              { href: "/html-to-pdf", label: t("htmlToPdf"), Icon: Globe, bg: "bg-indigo-50", fg: "text-indigo-600" },
            ],
          },
          {
            title: t("fromPdf"),
            items: [
              { href: "/pdf-to-jpg", label: t("pdfToJpg"), Icon: ImageIcon, bg: "bg-yellow-50", fg: "text-yellow-600" },
              { href: "/pdf-to-word", label: t("pdfToWord"), Icon: FileText, bg: "bg-fuchsia-50", fg: "text-fuchsia-600" },
              { href: "/pdf-to-ppt", label: t("pdfToPpt"), Icon: Presentation, bg: "bg-violet-50", fg: "text-violet-600" },
              { href: "/pdf-to-excel", label: t("pdfToExcel"), Icon: FileSpreadsheet, bg: "bg-lime-50", fg: "text-lime-600" },
              { href: "/pdf-to-pdfa", label: t("pdfToPdfa"), Icon: FileText, bg: "bg-blue-50", fg: "text-blue-600" },
            ],
          },
        ],
      },
      {
        label: t("navImages"),
        items: [{ href: "/compress-image", label: t("compressImg"), Icon: ImageIcon, bg: "bg-cyan-50", fg: "text-cyan-600" }],
      },
      {
        label: t("navCafe"),
        gridCols: 2,
        items: [
          { href: "/pdf-print-preview", label: t("printPreview"), Icon: Printer, bg: "bg-slate-50", fg: "text-slate-700" },
          { href: "/fill-pdf", label: t("fillPdf"), Icon: PenLine, bg: "bg-sky-50", fg: "text-sky-700" },
          { href: "/add-page-numbers", label: t("pageNumbers"), Icon: Hash, bg: "bg-zinc-50", fg: "text-zinc-700" },
          { href: "/jpg-to-pdf", label: t("jpgToPdf"), Icon: ImageIcon, bg: "bg-yellow-50", fg: "text-yellow-700" },
          { href: "/unlock-pdf", label: t("unlockPdf"), Icon: LockKeyholeOpen, bg: "bg-green-50", fg: "text-green-700" },
          { href: "/lock-pdf", label: t("lockPdf"), Icon: LockKeyhole, bg: "bg-amber-50", fg: "text-amber-800" },
          { href: "/organize-pdf", label: t("organizePdf"), Icon: Layers, bg: "bg-orange-50", fg: "text-orange-800" },
          { href: "/watermark-pdf", label: t("watermarkPdf"), Icon: Droplets, bg: "bg-cyan-50", fg: "text-cyan-800" },
          { href: "/resize-pdf", label: t("resizePdf"), Icon: Maximize2, bg: "bg-violet-50", fg: "text-violet-800" },
        ],
      },
    ];
}

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const groups = useMemo(() => navGroupsFromT(t), [t]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0, width: 0 });

  function openDropdown(label, triggerEl) {
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const pad = 16;
    const group = groups.find((g) => g.label === label);
    const count = group?.sections ? group.sections.length : (group?.items?.length ?? 0);
    const idealCols = group?.sections ? group.sections.length : Math.min(3, Math.max(1, count));
    const colWidth = 180;
    const gutter = 12 * (idealCols - 1);
    const padding = 24;
    const desired = Math.max(280, Math.min(640, idealCols * colWidth + gutter + padding));
    const width = Math.min(desired, Math.max(280, vw - pad * 2));
    const center = rect.left + rect.width / 2;
    const left = Math.min(Math.max(pad, center - width / 2), vw - width - pad);
    const top = rect.bottom + 8;
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
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative h-7 w-7 transition-transform duration-300 group-hover:scale-110">
                <Image src="/logo.svg" alt="logo" width={28} height={28} />
              </div>
              <span className="text-lg font-bold tracking-tight bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hidden sm:inline">
                {t("brand")}
              </span>
            </Link>

            <nav className="relative hidden lg:flex items-center gap-1 text-sm flex-1 justify-center min-w-0">
              {groups.map((g) => (
                <div
                  key={g.label}
                  className="relative"
                  onMouseEnter={(e) => openDropdown(g.label, e.currentTarget)}
                >
                  <button
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-2 font-medium transition-all duration-200 hover:bg-zinc-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                      openMenu === g.label ? "text-indigo-600 bg-indigo-50/50" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setOpenMenu("");
                    }}
                    aria-expanded={openMenu === g.label}
                    onClick={(e) =>
                      openMenu === g.label ? setOpenMenu("") : openDropdown(g.label, e.currentTarget.parentElement)
                    }
                    aria-haspopup="menu"
                  >
                    {g.label}
                    <svg
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        openMenu === g.label ? "rotate-180 text-indigo-500" : "text-zinc-400"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                    </svg>
                  </button>
                  {openMenu === g.label && (
                    <div
                      className="fixed z-[60] rounded-2xl border border-zinc-200/60 bg-white/90 backdrop-blur-xl p-4 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto overflow-y-auto"
                      style={{ left: menuPos.left, top: menuPos.top, width: menuPos.width, maxHeight: "min(75vh, 620px)" }}
                      onMouseLeave={() => setOpenMenu("")}
                      onMouseEnter={() => setOpenMenu(g.label)}
                    >
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
                                    <div
                                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${l.bg} transition-transform duration-200 group-hover/item:scale-110 group-hover/item:rotate-3`}
                                    >
                                      {l.Icon && <l.Icon className={`h-5 w-5 ${l.fg}`} aria-hidden />}
                                    </div>
                                    <span className="flex-1 text-sm font-medium text-zinc-700 group-hover/item:text-indigo-900">{l.label}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="grid gap-2 overflow-auto"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(g.gridCols || 3, Math.max(1, g.items.length))}, minmax(0, 1fr))`,
                          }}
                        >
                          {g.items.map((l) => (
                            <Link
                              key={l.href}
                              href={l.href}
                              className="group/item flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-indigo-50/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                            >
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg ${l.bg} transition-transform duration-200 group-hover/item:scale-110 group-hover/item:rotate-3`}
                              >
                                {l.Icon && <l.Icon className={`h-5 w-5 ${l.fg}`} aria-hidden />}
                              </div>
                              <span className="flex-1 text-sm font-medium text-zinc-700 group-hover/item:text-indigo-900">{l.label}</span>
                              <svg
                                className="h-4 w-4 text-indigo-400 opacity-0 -translate-x-2 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:translate-x-0"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                              </svg>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <label className="hidden md:flex items-center gap-1 text-xs text-zinc-500">
                <span className="sr-only">{t("lang")}</span>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="mr">मराठी</option>
                </select>
              </label>
              <div className="flex items-center gap-2 lg:hidden">
                {!mobileOpen && (
                  <button
                    onClick={() => setMobileOpen(true)}
                    aria-expanded={mobileOpen}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                  >
                    <span className="sr-only">Menu</span>☰
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {openMenu && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpenMenu("")} />}

      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white/95 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5 transition-transform duration-300 ease-out will-change-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-6 bg-white/50 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="relative h-6 w-6 transition-transform duration-300 group-hover:scale-110">
              <Image src="/logo.svg" alt="logo" width={24} height={24} />
            </div>
            <span className="text-base font-bold tracking-tight bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {t("brand")}
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="px-4 py-3 border-b border-zinc-100 md:hidden">
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            {t("lang")}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
            </select>
          </label>
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
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-lg ${l.bg} transition-transform duration-200 group-hover:scale-105 shadow-sm ring-1 ring-black/5`}
                            >
                              {l.Icon && <l.Icon className={`h-4 w-4 ${l.fg}`} aria-hidden />}
                            </div>
                            <span className="flex-1 text-sm font-medium text-zinc-600 group-hover:text-indigo-900 transition-colors">{l.label}</span>
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
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${l.bg} transition-transform duration-200 group-hover:scale-105 shadow-sm ring-1 ring-black/5`}
                      >
                        {l.Icon && <l.Icon className={`h-4 w-4 ${l.fg}`} aria-hidden />}
                      </div>
                      <span className="flex-1 text-sm font-medium text-zinc-600 group-hover:text-indigo-900 transition-colors">{l.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
