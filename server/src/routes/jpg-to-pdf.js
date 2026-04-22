const express = require('express');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const { getPageBox } = require('../lib/pdfSizes');

const router = express.Router();

/**
 * multipart: files[] (images), body.meta JSON:
 * { order?: number[], orientation?: 'portrait'|'landscape', pageSize?: 'a4'|'a3'|'letter'|'legal' }
 */
router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.array('files', 40)(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Provide at least one image in field "files"' });
      }

      let meta = {};
      try {
        meta = JSON.parse(req.body.meta || '{}');
      } catch {
        meta = {};
      }
      const orientation = meta.orientation === 'landscape' ? 'landscape' : 'portrait';
      const pageKey = ['a4', 'a3', 'letter', 'legal'].includes(meta.pageSize) ? meta.pageSize : 'a4';
      const { width: pw, height: ph } = getPageBox(pageKey, orientation === 'landscape');

      const n = req.files.length;
      let order = Array.from({ length: n }, (_, i) => i);
      if (Array.isArray(meta.order) && meta.order.length === n) {
        const valid = meta.order.every((x) => typeof x === 'number' && x >= 0 && x < n);
        if (valid) order = meta.order;
      }

      const pdf = await PDFDocument.create();
      for (const idx of order) {
        const file = req.files[idx];
        if (!file) continue;
        const buf = file.buffer;
        const pipeline = sharp(buf).rotate(); // respect EXIF
        const img = await pipeline.png().toBuffer();
        const png = await pdf.embedPng(img);
        const page = pdf.addPage([pw, ph]);
        const iw = png.width;
        const ih = png.height;
        const scale = Math.min(pw / iw, ph / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const x = (pw - dw) / 2;
        const y = (ph - dh) / 2;
        page.drawImage(png, { x, y, width: dw, height: dh });
      }

      const bytes = await pdf.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="images.pdf"');
      return res.send(Buffer.from(bytes));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to build PDF from images' });
    }
  });
});

module.exports = router;
