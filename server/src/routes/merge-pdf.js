const express = require('express');
const { PDFDocument } = require('pdf-lib');

const router = express.Router();

// Expect multipart/form-data with files[] as PDFs
router.post('/', async (req, res) => {
  try {
    const upload = req.app.get('upload');
    upload.array('files')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.files || req.files.length < 2) return res.status(400).json({ error: 'Provide at least two PDF files' });

      const outPdf = await PDFDocument.create();
      for (const file of req.files) {
        const src = await PDFDocument.load(file.buffer);
        const pages = await outPdf.copyPages(src, src.getPageIndices());
        pages.forEach((p) => outPdf.addPage(p));
      }
      const bytes = await outPdf.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
      return res.send(Buffer.from(bytes));
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to merge PDFs' });
  }
});

module.exports = router;
