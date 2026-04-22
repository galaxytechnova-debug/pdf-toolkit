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
      if (!password) return res.status(400).json({ error: 'Password is required' });

      const pdf = await PDFDocument.load(req.file.buffer, { password, ignoreEncryption: false });
      const bytes = await pdf.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="unlocked.pdf"');
      return res.send(Buffer.from(bytes));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) {
        const msg = /password|encrypt|decrypt/i.test(String(e.message)) ? 'Invalid password or unreadable PDF' : 'Failed to unlock PDF';
        res.status(400).json({ error: msg });
      }
    }
  });
});

module.exports = router;
