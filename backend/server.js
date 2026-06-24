import './config/env.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import formatRoutes from './routes/formatRoutes.js';
import { uploadDir } from './config/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/formats', formatRoutes);
app.use('/api/public', publicRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

// Serve React build in production — must come AFTER all API routes
if (IS_PROD) {
  const clientBuild = path.join(__dirname, 'public');
  if (fs.existsSync(clientBuild)) {
    app.use(express.static(clientBuild));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientBuild, 'index.html'));
    });
  } else {
    console.warn('⚠  No public/ folder found. Run: npm run build:frontend');
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
