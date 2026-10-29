import { Router } from 'express';
import { z } from 'zod';
import { Campaign, Contact, MessageLog } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { maskPhone } from '../utils/phone.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ ownerId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ campaigns });
  } catch (e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try {
    const input = z.object({ name: z.string().min(1).max(120), message: z.string().min(1).max(2000), templateId: z.string().max(120).optional(), senderHeader: z.string().max(20).optional() }).parse(req.body);
    const campaign = await Campaign.create({ ownerId: req.user.id, ...input, category: 'promotional', status: 'draft' });
    res.status(201).json({ campaign });
  } catch (e) { next(e); }
});
router.post('/:id/preview', async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const contacts = await Contact.find({ ownerId: req.user.id }).select('consentStatus normalizedPhone').lean();
    const eligible = contacts.filter(c => c.consentStatus === 'opted_in');
    const excluded = contacts.length - eligible.length;
    campaign.recipientCount = contacts.length;
    campaign.eligibleCount = eligible.length;
    campaign.excludedCount = excluded;
    campaign.status = 'previewed';
    await campaign.save();
    res.json({
      campaign,
      totalContacts: contacts.length,
      eligibleCount: eligible.length,
      excludedCount: excluded,
      preview: campaign.message,
      sendEnabled: false,
      note: 'Sending remains disabled until a provider adapter, approved DLT template/header, and compliance checks are configured.'
    });
  } catch (e) { next(e); }
});
router.post('/:id/send', async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    return res.status(503).json({ error: 'Real SMS sending is disabled in this starter. Configure and verify the provider adapter and compliance workflow first.' });
  } catch (e) { next(e); }
});
router.get('/:id/report', async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const grouped = await MessageLog.aggregate([{ $match: { campaignId: campaign._id, ownerId: campaign.ownerId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    res.json({ campaign, statuses: grouped });
  } catch (e) { next(e); }
});
export default router;
