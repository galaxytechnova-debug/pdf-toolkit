const express = require('express');
const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');

const router = express.Router();

/**
 * meta: { text, opacity?, fontSize?, placement?: 'diagonal'|'center'|'footer' }
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
      const text = (meta.text || 'DRAFT').trim().slice(0, 80);
      if (!text) return res.status(400).json({ error: 'Watermark text is required' });
      const opacity = Math.min(1, Math.max(0.05, Number(meta.opacity) || 0.25));
      const fontSize = Math.min(120, Math.max(8, Number(meta.fontSize) || 36));
      const placement = ['diagonal', 'center', 'footer'].includes(meta.placement) ? meta.placement : 'diagonal';

      const pdf = await PDFDocument.load(req.file.buffer);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pages = pdf.getPages();
      const gray = rgb(0.5, 0.5, 0.5);

      for (const page of pages) {
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(text, fontSize);
        if (placement === 'footer') {
          page.drawText(text, {
            x: (width - tw) / 2,
            y: 24,
            size: fontSize * 0.5,
            font,
            color: gray,
            opacity,
          });
        } else if (placement === 'center') {
          page.drawText(text, {
            x: (width - tw) / 2,
            y: height / 2 - fontSize / 3,
            size: fontSize,
            font,
            color: gray,
            opacity,
          });
        } else {
          page.drawText(text, {
            x: width / 2 - tw / 2,
            y: height / 2,
            size: fontSize,
            font,
            color: gray,
            opacity,
            rotate: degrees(-35),
          });
        }
      }

      const bytes = await pdf.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="watermarked.pdf"');
      return res.send(Buffer.from(bytes));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to watermark PDF' });
    }
  });
});

module.exports = router;
