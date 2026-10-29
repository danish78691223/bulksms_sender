import { Router } from 'express';
import { z } from 'zod';
import { Contact, ConsentEvent } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { normalizePhone } from '../utils/phone.js';

const router = Router();
router.use(requireAuth);
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').slice(0, 100);
    const filter = { ownerId: req.user.id };
    if (q) filter.$or = [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { normalizedPhone: { $regex: escapeRegex(q) } }];
    const contacts = await Contact.find(filter).sort({ createdAt: -1 }).limit(1000).lean();
    res.json({ contacts, count: contacts.length });
  } catch (e) { next(e); }
});
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

router.post('/import', async (req, res, next) => {
  try {
    const input = z.object({ source: z.enum(['google', 'android', 'csv', 'manual']), contacts: z.array(z.object({ name: z.string().max(120).optional(), phone: z.string().min(7).max(30), sourceContactId: z.string().max(200).optional() })).max(2000) }).parse(req.body);
    let imported = 0, skipped = 0;
    for (const c of input.contacts) {
      try {
        const normalizedPhone = normalizePhone(c.phone);
        await Contact.updateOne(
          { ownerId: req.user.id, normalizedPhone },
          { $set: { name: c.name || '', phone: c.phone, source: input.source, sourceContactId: c.sourceContactId || '' }, $setOnInsert: { ownerId: req.user.id, consentStatus: 'unknown' } },
          { upsert: true }
        );
        imported++;
      } catch { skipped++; }
    }
    res.json({ imported, skipped, note: 'Imported contacts default to unknown consent; import does not authorize promotional messaging.' });
  } catch (e) { next(e); }
});
router.post('/:id/consent', async (req, res, next) => {
  try {
    const input = z.object({ status: z.enum(['opted_in', 'opted_out', 'unknown']), source: z.string().min(3).max(100), evidenceReference: z.string().max(500).optional() }).parse(req.body);
    const contact = await Contact.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    // Use this endpoint only after your real consent workflow has collected valid evidence.
    contact.consentStatus = input.status;
    contact.consentSource = input.source;
    contact.consentTimestamp = input.status === 'unknown' ? null : new Date();
    contact.unsubscribedAt = input.status === 'opted_out' ? new Date() : null;
    await contact.save();
    await ConsentEvent.create({ ownerId: req.user.id, contactId: contact._id, event: input.status === 'opted_in' ? 'consent_granted' : input.status === 'opted_out' ? 'consent_withdrawn' : 'consent_reviewed', source: input.source, evidenceReference: input.evidenceReference || '' });
    res.json({ contact });
  } catch (e) { next(e); }
});
export default router;
