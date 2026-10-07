import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint for Cloud Run / deployment probes
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static assets from dist if built, otherwise serve from root
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));
app.use(express.static(__dirname));

// SPA fallback to index.html
app.get('*', (_req, res) => {
  const distIndex = path.join(distPath, 'index.html');
  res.sendFile(distIndex, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'index.html'));
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
