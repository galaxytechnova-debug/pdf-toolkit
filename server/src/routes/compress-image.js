const express = require('express');
const sharp = require('sharp');

const router = express.Router();

// Compress common image types; query param quality=1..100, format optional (jpg/png/webp)
router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: 'Upload error' });
      if (!req.file) return res.status(400).json({ error: 'Provide an image in field "file"' });

      const quality = Math.min(100, Math.max(1, parseInt(req.query.quality || '75', 10)));
      const format = (req.query.format || '').toLowerCase();

      let image = sharp(req.file.buffer, { limitInputPixels: false });
      let output;
      switch (format) {
        case 'png':
          output = await image.png({ quality, compressionLevel: 9 }).toBuffer();
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Content-Disposition', 'attachment; filename="compressed.png"');
          return res.send(output);
        case 'webp':
          output = await image.webp({ quality }).toBuffer();
          res.setHeader('Content-Type', 'image/webp');
          res.setHeader('Content-Disposition', 'attachment; filename="compressed.webp"');
          return res.send(output);
        default:
          output = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Content-Disposition', 'attachment; filename="compressed.jpg"');
          return res.send(output);
      }
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to compress image' });
    }
  });
});

module.exports = router;
