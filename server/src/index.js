const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer setup (memory storage for simple operations)
const upload = multer({ storage: multer.memoryStorage() });
app.set('upload', upload);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Routes
app.use('/api/merge-pdf', require('./routes/merge-pdf'));
app.use('/api/split-pdf', require('./routes/split-pdf'));
app.use('/api/compress-pdf', require('./routes/compress-pdf'));
app.use('/api/html-to-pdf', require('./routes/html-to-pdf'));
app.use('/api/compress-image', require('./routes/compress-image'));
app.use('/api/word-to-pdf', require('./routes/word-to-pdf'));
app.use('/api/pdf-to-word', require('./routes/pdf-to-word'));
app.use('/api/excel-to-pdf', require('./routes/excel-to-pdf'));
app.use('/api/pdf-to-excel', require('./routes/pdf-to-excel'));
app.use('/api/ppt-to-pdf', require('./routes/ppt-to-pdf'));
app.use('/api/jpg-to-pdf', require('./routes/jpg-to-pdf'));
app.use('/api/page-numbers-pdf', require('./routes/page-numbers-pdf'));
app.use('/api/unlock-pdf', require('./routes/unlock-pdf'));
app.use('/api/lock-pdf', require('./routes/lock-pdf'));
app.use('/api/reorder-pdf', require('./routes/reorder-pdf'));
app.use('/api/watermark-pdf', require('./routes/watermark-pdf'));
app.use('/api/resize-pdf', require('./routes/resize-pdf'));

// Stubs or externally powered tools
app.use('/api/pdf-to-image', require('./routes/stub-generic')('pdf-to-image'));
app.use('/api/pdf-to-ppt', require('./routes/stub-generic')('pdf-to-ppt'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
