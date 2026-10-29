import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contacts.js';
import campaignRoutes from './routes/campaigns.js';
import integrationRoutes from './routes/integrations.js';
import webhookRoutes from './routes/webhooks.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(x => x.trim()) }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'webxwhale-bulk-sms-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use((err, _req, res, _next) => {
  console.error(err?.message || 'Unexpected error');
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
});

const port = Number(process.env.PORT || 5000);
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webxwhale_bulk_sms');
  app.listen(port, () => console.log(`API listening on ${port}`));
} catch (error) {
  console.error('Database connection failed:', error.message);
  process.exit(1);
}
