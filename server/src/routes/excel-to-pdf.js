const express = require('express');
const xlsx = require('xlsx');
const puppeteer = require('puppeteer');

const router = express.Router();

router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Upload error' });
    if (!req.file) return res.status(400).json({ error: 'Upload an .xlsx/.xls in field "file"' });

    let browser;
    try {
      const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(ws, { header: 1, raw: true });
      const tableRows = json
        .map(
          (row) =>
            `<tr>${row
              .map((cell) => `<td style="border:1px solid #ddd;padding:4px;">${
                cell === undefined ? '' : String(cell)
              }</td>`) 
              .join('')}</tr>`
        )
        .join('');
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,Helvetica,sans-serif}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ddd;padding:6px;font-size:12px}
      </style></head><body><h2>${sheetName}</h2><table>${tableRows}</table></body></html>`;

      browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle2' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="excel.pdf"');
      res.send(Buffer.from(pdf));
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to convert Excel to PDF' });
    } finally {
      if (browser) await browser.close();
    }
  });
});

module.exports = router;
