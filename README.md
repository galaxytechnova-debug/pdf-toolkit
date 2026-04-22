# Pro PDF Toolkit

A fast, no-auth toolkit for PDF and document utilities.

- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: Express.js (Node.js)
- Operations implemented now:
  - Merge PDF
  - Split PDF
  - Compress PDF
  - HTML to PDF
  - Compress Image
- Operations scaffolded with server stubs (return 501 until wired):
  - PDF to Image
  - Word to PDF
  - PDF to Word
  - PPT to PDF
  - PDF to PPT
  - Excel to PDF
  - PDF to Excel

## Getting Started

1. Install Node 18+.
2. In one terminal, start the API:

```
cd server
npm run dev
```
The API will run on http://localhost:4000

3. In another terminal, start the Web app:

```
cd web
npm run dev
```
Open the printed http://localhost:3000 (or next available port shown).

If your API runs on a different host/port, set in `web/.env.local`:

```
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

## Notes
- HTML→PDF uses Puppeteer and will download a compatible Chromium.
- Image compression uses Sharp.
- PDF operations use pdf-lib. Compression is lossless/structural; for aggressive downsampling, a raster workflow (e.g., Ghostscript) can be added later.

## Structure
```
converter project/
├─ server/
│  ├─ src/
│  │  ├─ index.js
│  │  └─ routes/
│  │     ├─ merge-pdf.js
│  │     ├─ split-pdf.js
│  │     ├─ compress-pdf.js
│  │     ├─ html-to-pdf.js
│  │     ├─ compress-image.js
│  │     └─ stub-generic.js
├─ web/
│  ├─ app/
│  │  ├─ page.js
│  │  ├─ merge-pdf/page.jsx
│  │  ├─ split-pdf/page.jsx
│  │  ├─ compress-pdf/page.jsx
│  │  ├─ html-to-pdf/page.jsx
│  │  ├─ compress-image/page.jsx
│  │  ├─ pdf-to-image/page.jsx
│  │  ├─ word-to-pdf/page.jsx
│  │  ├─ pdf-to-word/page.jsx
│  │  ├─ ppt-to-pdf/page.jsx
│  │  ├─ pdf-to-ppt/page.jsx
│  │  ├─ excel-to-pdf/page.jsx
│  │  └─ pdf-to-excel/page.jsx
│  ├─ components/
│  │  ├─ Header.jsx
│  │  ├─ NotImplementedTool.jsx
│  │  └─ UploadArea.jsx
│  └─ lib/api.js
```
