/**
 * Provider adapter boundary.
 * Intentionally disabled until an official provider API adapter is implemented.
 * Do not guess provider URLs, payloads, authentication, or webhook signatures.
 */
export async function submitPromotionalSms({ phone, message, templateId, senderHeader, idempotencyKey }) {
  if (process.env.SMS_ENABLED !== 'true' || process.env.SMS_PROVIDER === 'disabled') {
    throw Object.assign(new Error('SMS sending is disabled. Configure and test an official provider adapter first.'), { status: 503 });
  }
  // Implement using the selected provider's current official documentation.
  // Required controls: approved DLT template/header, consent eligibility, safe retries,
  // request signing/authentication, provider message ID, timeout reconciliation.
  throw Object.assign(new Error('Provider adapter is not implemented yet'), { status: 501 });
}
