const express = require('express');
const { PDFDocument } = require('pdf-lib');
const archiver = require('archiver');

const router = express.Router();

// Split into single-page PDFs and return a zip
router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.file) return res.status(400).json({ error: 'Provide a PDF file in field "file"' });

      const src = await PDFDocument.load(req.file.buffer);
      const total = src.getPageCount();

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="split-pages.zip"');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (e) => {
        console.error(e);
        res.status(500).end();
      });
      archive.pipe(res);

      for (let i = 0; i < total; i++) {
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
