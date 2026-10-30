import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { normalizePhone, maskPhone } from '../utils/phone.js';

const router = Router();
router.use(requireAuth);
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false }));

const testSchema = z.object({
  phone: z.string().min(10).max(20),
  message: z.string().trim().min(1).max(160)
});

router.post('/quick-test', async (req, res, next) => {
  try {
    const { phone, message } = testSchema.parse(req.body);
    const normalizedPhone = normalizePhone(phone);
    const configuredTestNumber = process.env.FAST2SMS_TEST_NUMBER
      ? normalizePhone(process.env.FAST2SMS_TEST_NUMBER)
      : '';

    if (!process.env.FAST2SMS_API_KEY) {
      return res.status(503).json({ error: 'Fast2SMS is not configured. Add FAST2SMS_API_KEY in the backend environment.' });
    }
    if (!configuredTestNumber) {
      return res.status(503).json({ error: 'Set FAST2SMS_TEST_NUMBER to your own verified test mobile number before testing.' });
    }
    if (normalizedPhone !== configuredTestNumber) {
      return res.status(403).json({ error: 'Quick SMS test is restricted to the single FAST2SMS_TEST_NUMBER configured by the owner.' });
    }

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        Authorization: process.env.FAST2SMS_API_KEY,
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        route: 'q',
        message,
        numbers: normalizedPhone.slice(-10),
        sms_details: '1'
      }),
      signal: AbortSignal.timeout(20000)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.return !== true) {
      console.error('Fast2SMS Quick test rejected:', data.message || data.error || response.status);
      return res.status(502).json({
        error: data.message || data.error || 'Fast2SMS did not accept the test SMS.',
        providerStatus: response.status
      });
    }

    return res.json({
      ok: true,
      status: 'submitted',
      phoneMasked: maskPhone(normalizedPhone),
      requestId: data.request_id || data.requestId || '',
      message: 'Fast2SMS accepted the test request. This is submission status, not confirmed delivery.'
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ error: 'Fast2SMS request timed out. Check provider reports before retrying to avoid duplicate messages.' });
    }
    next(error);
  }
});

export default router;
