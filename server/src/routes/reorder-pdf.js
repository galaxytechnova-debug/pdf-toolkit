const express = require('express');
const { PDFDocument, degrees } = require('pdf-lib');

const router = express.Router();

/**
 * meta JSON: { order: number[], rotations?: number[] } — rotations in 0,90,180,270 per output page
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
        return res.status(400).json({ error: 'Invalid meta JSON' });
      }
      const src = await PDFDocument.load(req.file.buffer);
      const total = src.getPageCount();
      const order = Array.isArray(meta.order) ? meta.order : null;
      if (!order || order.length === 0) {
        return res.status(400).json({ error: 'meta.order must be a non-empty array of page indices' });
      }
      for (const i of order) {
        if (typeof i !== 'number' || i < 0 || i >= total || !Number.isInteger(i)) {
          return res.status(400).json({ error: 'Invalid page index in order' });
        }
      }

      const rotations = Array.isArray(meta.rotations) ? meta.rotations : [];
      const out = await PDFDocument.create();
      for (let k = 0; k < order.length; k++) {
        const srcIndex = order[k];
        const [page] = await out.copyPages(src, [srcIndex]);
        out.addPage(page);
        const added = out.getPage(out.getPageCount() - 1);
        const rot = rotations[k] ?? 0;
        const r = ((rot % 360) + 360) % 360;
        if (r === 90 || r === 180 || r === 270 || r === 0) {
          added.setRotation(degrees(r));
        }
      }

      const bytes = await out.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="organized.pdf"');
      return res.send(Buffer.from(bytes));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to reorder PDF' });
    }
  });
});

module.exports = router;
