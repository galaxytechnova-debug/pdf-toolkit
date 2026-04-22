import Link from "next/link";
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
  Printer,
  PenLine,
  Hash,
  LockKeyholeOpen,
  LockKeyhole,
  Layers,
  Droplets,
  Maximize2,
} from "lucide-react";

const tools = [
  { href: "/merge-pdf", label: "Merge PDF", Icon: Files, desc: "Combine multiple PDFs into one.", bg: "bg-rose-50", fg: "text-rose-600" },
  { href: "/split-pdf", label: "Split PDF", Icon: SplitSquareVertical, desc: "Extract pages or split by ranges.", bg: "bg-orange-50", fg: "text-orange-600" },
  { href: "/compress-pdf", label: "Compress PDF", Icon: Archive, desc: "Reduce file size without losing quality.", bg: "bg-emerald-50", fg: "text-emerald-600" },
  { href: "/pdf-to-image", label: "PDF to Image", Icon: ImageIcon, desc: "Convert pages into PNG/JPG images.", bg: "bg-sky-50", fg: "text-sky-600" },
  { href: "/html-to-pdf", label: "HTML to PDF", Icon: Globe, desc: "Turn web pages into PDFs.", bg: "bg-indigo-50", fg: "text-indigo-600" },
  { href: "/word-to-pdf", label: "Word to PDF", Icon: FileText, desc: "Convert DOCX files to PDF.", bg: "bg-fuchsia-50", fg: "text-fuchsia-600" },
  { href: "/pdf-to-word", label: "PDF to Word", Icon: FileText, desc: "Edit PDFs by converting to DOCX.", bg: "bg-fuchsia-50", fg: "text-fuchsia-600" },
  { href: "/ppt-to-pdf", label: "PPT to PDF", Icon: Presentation, desc: "Export presentations as PDFs.", bg: "bg-violet-50", fg: "text-violet-600" },
  { href: "/pdf-to-ppt", label: "PDF to PPT", Icon: Presentation, desc: "Make slides from a PDF.", bg: "bg-violet-50", fg: "text-violet-600" },
  { href: "/excel-to-pdf", label: "Excel to PDF", Icon: FileSpreadsheet, desc: "Save spreadsheets as PDFs.", bg: "bg-lime-50", fg: "text-lime-600" },
  { href: "/pdf-to-excel", label: "PDF to Excel", Icon: FileSpreadsheet, desc: "Extract tables into XLSX.", bg: "bg-lime-50", fg: "text-lime-600" },
  { href: "/compress-image", label: "Compress Image", Icon: ImageIcon, desc: "Shrink PNG/JPG files smartly.", bg: "bg-cyan-50", fg: "text-cyan-600" },
];

const cafeTools = [
  { href: "/pdf-print-preview", label: "Print preview", Icon: Printer, desc: "Pick pages before printing — saves paper.", bg: "bg-slate-50", fg: "text-slate-700" },
  { href: "/fill-pdf", label: "Type on PDF", Icon: PenLine, desc: "Add text for forms without Acrobat.", bg: "bg-sky-50", fg: "text-sky-700" },
  { href: "/add-page-numbers", label: "Page numbers", Icon: Hash, desc: "Number pages for submissions.", bg: "bg-zinc-50", fg: "text-zinc-700" },
  { href: "/jpg-to-pdf", label: "Images to PDF", Icon: ImageIcon, desc: "Scans and phone photos to one PDF.", bg: "bg-yellow-50", fg: "text-yellow-700" },
  { href: "/unlock-pdf", label: "Unlock PDF", Icon: LockKeyholeOpen, desc: "Remove open password for printing.", bg: "bg-green-50", fg: "text-green-700" },
  { href: "/lock-pdf", label: "Lock PDF", Icon: LockKeyhole, desc: "Add an open password before sharing.", bg: "bg-amber-50", fg: "text-amber-800" },
  { href: "/organize-pdf", label: "Organize pages", Icon: Layers, desc: "Reorder, rotate, delete pages.", bg: "bg-orange-50", fg: "text-orange-800" },
  { href: "/watermark-pdf", label: "Watermark", Icon: Droplets, desc: "Draft / confidential stamp.", bg: "bg-cyan-50", fg: "text-cyan-800" },
  { href: "/resize-pdf", label: "Resize pages", Icon: Maximize2, desc: "A4, Letter, Legal fit or stretch.", bg: "bg-violet-50", fg: "text-violet-800" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
      {/* Hero Section */}
      <section className="text-center mb-12 sm:mb-20 animate-fade-in">
        <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50/50 px-3 py-1 text-sm font-medium text-indigo-600 mb-6 backdrop-blur-sm">
          <span>✨ The Ultimate PDF Toolkit</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="block text-zinc-900">All your PDF tools</span>
          <span className="block bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent pb-2">
            in one beautiful place.
          </span>
        </h1>
        <p className="mx-auto max-w-xl sm:max-w-2xl text-base sm:text-lg text-zinc-600 mb-8 sm:mb-10 leading-relaxed px-2">
          The most elegant and powerful way to manage your documents.
          Merge, split, compress, and convert—all locally or securely processing.
        </p>

        {/* Abstract decorative blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[300px] h-[300px] sm:w-[800px] sm:h-[800px] bg-indigo-500/10 rounded-full blur-3xl opacity-50 pointer-events-none mix-blend-multiply animate-pulse" />
        <div className="absolute top-20 right-0 -z-10 w-[250px] h-[250px] sm:w-[600px] sm:h-[600px] bg-violet-500/10 rounded-full blur-3xl opacity-50 pointer-events-none mix-blend-multiply" />
      </section>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {tools.map((t, i) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative overflow-hidden rounded-3xl border-2 border-violet-500/70 bg-white/70 backdrop-blur-md p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white hover:border-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          >
            <div className="flex items-start gap-6">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner shrink-0`}>
                <t.Icon className={`h-7 w-7 ${t.fg}`} aria-hidden />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-2 group-hover:text-indigo-900 transition-colors">{t.label}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4 group-hover:text-zinc-600">{t.desc}</p>
                <div className="flex items-center text-sm font-medium text-indigo-600 opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                  Try it <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </div>
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-indigo-50/0 via-transparent to-violet-50/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
          </Link>
        ))}
      </div>

      <section className="mt-16 sm:mt-24">
        <h2 className="text-center text-2xl font-bold text-zinc-900 mb-2">Internet cafe essentials</h2>
        <p className="text-center text-zinc-500 mb-10 max-w-2xl mx-auto text-sm sm:text-base">
          Walk-in friendly tools: print-ready preview, forms, page numbers, scans to PDF, lock/unlock, and more. Pin your favourites from any tool page.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cafeTools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-2xl border border-indigo-200/60 bg-white/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${t.bg} mb-3`}>
                <t.Icon className={`h-5 w-5 ${t.fg}`} aria-hidden />
              </div>
              <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-800">{t.label}</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
