const express = require('express');
const { PDFDocument } = require('pdf-lib');

const router = express.Router();

// Naive compression: re-save PDF; optionally remove metadata and use object streams
router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.file) return res.status(400).json({ error: 'Provide a PDF file in field "file"' });

      const level = (req.body && req.body.level) || 'recommended';
      const src = await PDFDocument.load(req.file.buffer);
      // Remove metadata that can bloat size
      src.setTitle('');
      src.setAuthor('');
      src.setSubject('');
      src.setProducer('');
      src.setCreator('');

      let bytes;
      if (level === 'extreme') {
        const fresh = await PDFDocument.create();
        const idx = src.getPageIndices();
        const pages = await fresh.copyPages(src, idx);
        pages.forEach((p) => fresh.addPage(p));
        bytes = await fresh.save({ useObjectStreams: true });
      } else {
        bytes = await src.save({ useObjectStreams: true });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="compressed.pdf"');
      res.send(Buffer.from(bytes));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to compress PDF' });
    }
  });
});

module.exports = router;
