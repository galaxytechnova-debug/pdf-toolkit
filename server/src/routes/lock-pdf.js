const express = require('express');
const { PDFDocument } = require('pdf-lib');

const router = express.Router();

router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.file) return res.status(400).json({ error: 'Provide a PDF in field "file"' });
      const password = (req.body.password || '').trim();
      if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

      let pdf;
      try {
        const existing = (req.body.currentPassword || '').trim();
        pdf = existing
          ? await PDFDocument.load(req.file.buffer, { password: existing })
          : await PDFDocument.load(req.file.buffer);
      } catch (e) {
        return res.status(400).json({ error: 'Could not read PDF. If it is encrypted, provide current password.' });
      }

      const bytes = await pdf.save({
        useObjectStreams: true,
        userPassword: password,
        ownerPassword: password,
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="locked.pdf"');
      return res.send(Buffer.from(bytes));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to lock PDF' });
    }
  });
});

module.exports = router;
