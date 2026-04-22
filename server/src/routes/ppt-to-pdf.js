const express = require('express');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Requires LibreOffice (soffice) installed and available in PATH
router.post('/', async (req, res) => {
  const upload = req.app.get('upload');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Upload error' });
    if (!req.file) return res.status(400).json({ error: 'Upload a PPT/PPTX in field "file"' });

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt2pdf-'));
    const inPath = path.join(tmpDir, req.file.originalname);
    fs.writeFileSync(inPath, req.file.buffer);

    try {
      const outDir = tmpDir;
      const args = ['--headless', '--norestore', '--convert-to', 'pdf', '--outdir', outDir, inPath];
      const soffice = spawn('soffice', args);

      let stderr = '';
      soffice.stderr.on('data', (d) => { stderr += d.toString(); });

      soffice.on('error', (e) => {
        console.error('soffice error', e);
        return res.status(501).json({ error: 'LibreOffice (soffice) not found. Install LibreOffice and ensure `soffice` is on PATH.' });
      });

      soffice.on('close', (code) => {
        if (code !== 0) {
          console.error('soffice exit', code, stderr);
          return res.status(500).json({ error: 'LibreOffice failed to convert. See server logs.' });
        }
        const base = path.parse(inPath).name + '.pdf';
        const outPath = path.join(outDir, base);
        if (!fs.existsSync(outPath)) {
          return res.status(500).json({ error: 'Converted file not found' });
        }
        const pdf = fs.readFileSync(outPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
        res.send(pdf);
        // Cleanup async
        setTimeout(() => {
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        }, 5000);
      });
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to convert PPT to PDF' });
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
  });
});

module.exports = router;
