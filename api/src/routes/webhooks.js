import { Router } from 'express';
const router = Router();
// Replace with provider-specific signature verification before accepting production webhooks.
router.post('/sms-status', (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(501).json({ error: 'Provider-specific signed webhook verification must be implemented before production use.' });
  }
  res.status(202).json({ accepted: false, note: 'Webhook adapter is a scaffold; no message status was changed.' });
});
export default router;
