const express = require('express');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');

const router = express.Router();

// DOCX -> PDF via DOCX->HTML (mammoth) -> PDF (puppeteer)
router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Upload error' });
    if (!req.file) return res.status(400).json({ error: 'Upload a .docx in field "file"' });
    if (!/\.docx$/i.test(req.file.originalname)) return res.status(400).json({ error: 'Only .docx is supported in this implementation' });

    let browser;
    try {
      const { value: html } = await mammoth.convertToHtml({ buffer: req.file.buffer });
      browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(`<html><head><meta charset=\"utf-8\"/><style>body{font-family:Arial,Helvetica,sans-serif;}</style></head><body>${html}</body></html>`, { waitUntil: 'networkidle2' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
      res.send(Buffer.from(pdf));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to convert DOCX to PDF' });
    } finally {
      if (browser) await browser.close();
    }
  });
});

module.exports = router;
