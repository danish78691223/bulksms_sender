import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/google/status', requireAuth, (_req, res) => res.json({
  configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  connected: false,
  note: 'Google OAuth consent/callback and encrypted refresh-token storage must be configured before contact sync is enabled.'
}));
router.get('/google/start', requireAuth, (_req, res) => res.status(501).json({
  error: 'Google OAuth flow is a setup task in this starter.',
  nextSteps: ['Create OAuth client in Google Cloud', 'Configure redirect URI', 'Implement OAuth state validation', 'Request minimum People API read scope', 'Encrypt refresh tokens at rest']
}));
export default router;
