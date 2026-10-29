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
function escapeRegex(s) { const slash = String.fromCharCode(92); return Array.from(s, ch => '^$.*+?()[]{}|'.includes(ch) || ch === slash ? slash + ch : ch).join(''); }

router.post('/import', async (req, res, next) => {
  try {
    // Validate the batch envelope first, then validate each row independently.
    // A single malformed phone field must never reject every otherwise-valid contact.
    const batch = z.object({
      source: z.enum(['google', 'android', 'csv', 'manual']),
      contacts: z.array(z.unknown()).max(2000)
    }).parse(req.body);

    const contactSchema = z.object({
      name: z.string().trim().max(120).optional(),
      // Allow malformed exports to reach row-level validation/normalization instead of failing the entire batch.
      phone: z.string().trim().max(500).optional().default(''),
      sourceContactId: z.string().max(200).optional()
    });

    let imported = 0, skipped = 0, invalidPhone = 0;
    for (const rawContact of batch.contacts) {
      const parsed = contactSchema.safeParse(rawContact);
      if (!parsed.success) {
        skipped++;
        invalidPhone++;
        continue;
      }
      const c = parsed.data;
      let normalizedPhone;
      try {
        normalizedPhone = normalizePhone(c.phone);
      } catch {
        skipped++;
        invalidPhone++;
        continue;
      }
      await Contact.updateOne(
        { ownerId: req.user.id, normalizedPhone },
        {
          $set: { name: c.name || '', phone: c.phone, source: batch.source, sourceContactId: c.sourceContactId || '' },
          $setOnInsert: { ownerId: req.user.id, consentStatus: 'unknown' }
        },
        { upsert: true }
      );
      imported++;
    }
    res.json({
      imported,
      skipped,
      invalidPhone,
      note: 'Imported contacts default to unknown consent; import does not authorize promotional messaging.'
    });
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
