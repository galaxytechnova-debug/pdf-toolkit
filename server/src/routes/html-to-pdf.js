const express = require('express');
const puppeteer = require('puppeteer');

const router = express.Router();

// Accepts JSON: { html?: string, url?: string, format?: 'A4'|'Letter'|..., landscape?: boolean }
router.post('/', async (req, res) => {
  const { html, url, format = 'A4', landscape = false } = req.body || {};
  if (!html && !url) return res.status(400).json({ error: 'Provide html or url in body' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    if (url) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    } else {
      await page.setContent(html, { waitUntil: 'networkidle2' });
    }

    const pdf = await page.pdf({ format, landscape, printBackground: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="export.pdf"');
    res.send(Buffer.from(pdf));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to convert HTML to PDF' });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = router;
