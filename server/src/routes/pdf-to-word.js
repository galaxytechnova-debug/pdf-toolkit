const express = require('express');
const pdf = require('pdf-parse');
const { Document, Packer, Paragraph } = require('docx');

const router = express.Router();

router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.file) return res.status(400).json({ error: 'Upload a PDF in field "file"' });

      const data = await pdf(req.file.buffer);
      const lines = (data.text || '').split(/\r?\n/);
      const children = lines.map((t) => new Paragraph(t));
      const doc = new Document({ sections: [{ children }] });
      const buf = await Packer.toBuffer(doc);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="converted.docx"');
      res.send(buf);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to convert PDF to Word' });
    }
  });
});

module.exports = router;
