const express = require('express');
const { PDFDocument } = require('pdf-lib');
const { getPageBox } = require('../lib/pdfSizes');

const router = express.Router();

/**
 * meta: { target: 'a4'|'a3'|'letter'|'legal', mode?: 'fit'|'stretch', landscape?: boolean }
 */
router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.file) return res.status(400).json({ error: 'Provide a PDF in field "file"' });

      let meta = {};
      try {
        meta = JSON.parse(req.body.meta || '{}');
      } catch {
        meta = {};
      }
      const key = ['a4', 'a3', 'letter', 'legal'].includes(meta.target) ? meta.target : 'a4';
      const landscape = Boolean(meta.landscape);
      const mode = meta.mode === 'stretch' ? 'stretch' : 'fit';
      const { width: tw, height: th } = getPageBox(key, landscape);

      const src = await PDFDocument.load(req.file.buffer);
      const out = await PDFDocument.create();
      const n = src.getPageCount();

      for (let i = 0; i < n; i++) {
        const [embedded] = await out.embedPdf(src, [i]);
        const ew = embedded.width;
        const eh = embedded.height;
        const page = out.addPage([tw, th]);
        let w = tw;
        let h = th;
        let x = 0;
        let y = 0;
        if (mode === 'fit') {
          const scale = Math.min(tw / ew, th / eh);
          w = ew * scale;
          h = eh * scale;
          x = (tw - w) / 2;
          y = (th - h) / 2;
        }
        page.drawPage(embedded, { x, y, width: w, height: h });
      }

      const bytes = await out.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="resized.pdf"');
      return res.send(Buffer.from(bytes));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to resize PDF' });
    }
  });
});

module.exports = router;
