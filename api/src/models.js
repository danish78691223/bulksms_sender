import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, default: 'Shop Owner' }
}, { timestamps: true });

const contactSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, trim: true, default: '' },
  phone: { type: String, required: true },
  normalizedPhone: { type: String, required: true },
  source: { type: String, enum: ['google', 'android', 'csv', 'manual'], default: 'csv' },
  sourceContactId: { type: String, default: '' },
  tags: { type: [String], default: [] },
  consentStatus: { type: String, enum: ['unknown', 'opted_in', 'opted_out'], default: 'unknown', index: true },
  consentSource: { type: String, default: '' },
  consentTimestamp: { type: Date, default: null },
  unsubscribedAt: { type: Date, default: null }
}, { timestamps: true });
contactSchema.index({ ownerId: 1, normalizedPhone: 1 }, { unique: true });

const campaignSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  category: { type: String, enum: ['promotional'], default: 'promotional' },
  templateId: { type: String, default: '' },
  senderHeader: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'previewed', 'queued', 'sending', 'completed', 'cancelled'], default: 'draft' },
  recipientCount: { type: Number, default: 0 },
  eligibleCount: { type: Number, default: 0 },
  excludedCount: { type: Number, default: 0 },
  scheduledAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

const messageLogSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
  phoneMasked: { type: String, default: '' },
  status: { type: String, enum: ['queued', 'submitted', 'sent', 'delivered', 'failed', 'rejected', 'undelivered'], default: 'queued' },
  providerMessageId: { type: String, default: '' },
  attempts: { type: Number, default: 0 },
  segments: { type: Number, default: 1 },
  cost: { type: Number, default: null },
  failureCode: { type: String, default: '' },
  submittedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null }
}, { timestamps: true });
messageLogSchema.index({ campaignId: 1, contactId: 1 }, { unique: true });

const consentEventSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
  event: { type: String, enum: ['consent_granted', 'consent_withdrawn', 'consent_reviewed'], required: true },
  purpose: { type: String, default: 'promotional_sms' },
  source: { type: String, required: true },
  evidenceReference: { type: String, default: '' },
  occurredAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const User = model('User', userSchema);
export const Contact = model('Contact', contactSchema);
export const Campaign = model('Campaign', campaignSchema);
export const MessageLog = model('MessageLog', messageLogSchema);
export const ConsentEvent = model('ConsentEvent', consentEventSchema);
