const express = require('express');
const pdf = require('pdf-parse');
const xlsx = require('xlsx');

const router = express.Router();

// Simple PDF->Excel: extracts text per page and writes to rows. Not layout-accurate but functional.
router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.file) return res.status(400).json({ error: 'Upload a PDF in field "file"' });

      const data = await pdf(req.file.buffer, { pagerender: (pg) => pg.getTextContent ? pg : pg });
      // data.text has all text; we will split by page markers if available else by lines
      const pages = (data.text || '').split(/\f/g); // form feed often separates pages

      const wb = xlsx.utils.book_new();
      pages.forEach((pageText, i) => {
        const rows = pageText.split(/\r?\n/).map((line) => [line]);
        const ws = xlsx.utils.aoa_to_sheet(rows);
        xlsx.utils.book_append_sheet(wb, ws, `Page_${i + 1}`);
      });
      const out = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="converted.xlsx"');
      res.send(out);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to convert PDF to Excel' });
    }
  });
});

module.exports = router;
