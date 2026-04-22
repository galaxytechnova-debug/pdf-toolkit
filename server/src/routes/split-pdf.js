const express = require('express');
const { PDFDocument } = require('pdf-lib');
const archiver = require('archiver');

const router = express.Router();

function parseMeta(body) {
  try {
    return JSON.parse(body.meta || '{}');
  } catch {
    return {};
  }
}

/**
 * Default: all pages → zip of single-page PDFs.
 * Optional body.meta JSON:
 * { pages: number[] (0-based indices), output?: 'zip'|'single' }
 */
router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.file) return res.status(400).json({ error: 'Provide a PDF file in field "file"' });

      const src = await PDFDocument.load(req.file.buffer);
      const total = src.getPageCount();
      const meta = parseMeta(req.body);

      let indices = Array.from({ length: total }, (_, i) => i);
      if (Array.isArray(meta.pages) && meta.pages.length > 0) {
        const picked = meta.pages
          .map((x) => parseInt(x, 10))
          .filter((i) => Number.isInteger(i) && i >= 0 && i < total);
        if (picked.length === 0) {
          return res.status(400).json({ error: 'No valid page indices in meta.pages' });
        }
        indices = picked;
      }

      const output = meta.output === 'single' ? 'single' : 'zip';

      if (output === 'single') {
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, indices);
        copied.forEach((p) => out.addPage(p));
        const bytes = await out.save({ useObjectStreams: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="selected-pages.pdf"');
        return res.send(Buffer.from(bytes));
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="split-pages.zip"');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (e) => {
        console.error(e);
        if (!res.headersSent) res.status(500).end();
      });
      archive.pipe(res);

      for (let j = 0; j < indices.length; j++) {
        const i = indices[j];
        const out = await PDFDocument.create();
        const [page] = await out.copyPages(src, [i]);
        out.addPage(page);
        const bytes = await out.save({ useObjectStreams: true });
        archive.append(Buffer.from(bytes), { name: `page-${i + 1}.pdf` });
      }

      await archive.finalize();
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to split PDF' });
    }
  });
});

module.exports = router;
