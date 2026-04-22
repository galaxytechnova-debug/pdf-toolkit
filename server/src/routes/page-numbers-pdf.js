const express = require('express');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const router = express.Router();

/**
 * file + meta JSON: { position, startAt?, prefix?, fontSize?, color? }
 * position: bottom-center | bottom-left | bottom-right | top-left | top-right
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
      const position = meta.position || 'bottom-center';
      const startAt = Number.isFinite(meta.startAt) ? meta.startAt : 1;
      const fontSize = Number.isFinite(meta.fontSize) ? meta.fontSize : 10;

      const pdf = await PDFDocument.load(req.file.buffer);
      const helv = await pdf.embedFont(StandardFonts.Helvetica);
      const total = pdf.getPageCount();
      const color = rgb(0.2, 0.2, 0.2);

      for (let i = 0; i < total; i++) {
        const page = pdf.getPage(i);
        const { width, height } = page.getSize();
        const num = String(startAt + i);
        const textWidth = helv.widthOfTextAtSize(num, fontSize);
        const margin = 36;
        let x = margin;
        let y = margin;
        if (position === 'bottom-center') {
          x = (width - textWidth) / 2;
          y = margin;
        } else if (position === 'bottom-left') {
          x = margin;
          y = margin;
        } else if (position === 'bottom-right') {
          x = width - textWidth - margin;
          y = margin;
        } else if (position === 'top-left') {
          x = margin;
          y = height - margin - fontSize;
        } else if (position === 'top-right') {
          x = width - textWidth - margin;
          y = height - margin - fontSize;
        } else {
          x = (width - textWidth) / 2;
          y = height / 2 - fontSize / 2;
        }
        page.drawText(num, { x, y, size: fontSize, font: helv, color });
      }

      const bytes = await pdf.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="numbered.pdf"');
      return res.send(Buffer.from(bytes));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to add page numbers' });
    }
  });
});

module.exports = router;
