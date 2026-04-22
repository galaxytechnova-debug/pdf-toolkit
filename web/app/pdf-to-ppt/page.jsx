import NotImplementedTool from "@/components/NotImplementedTool";

export default function PdfToPptPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">PDF to PowerPoint</h1>
        <p className="text-zinc-500">Turn your PDF documents into editable slides.</p>
      </div>
      <NotImplementedTool endpoint="pdf-to-ppt" title="PDF to PowerPoint" description="Convert PDF to PPTX. Coming soon." />
    </main>
  );
}
