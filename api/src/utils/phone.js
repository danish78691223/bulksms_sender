export function normalizePhone(value) {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) return digits;
  // Accept common Indian 10-digit mobile input; production should use a phone-number library.
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  throw Object.assign(new Error('Enter a valid phone number with country code'), { status: 400 });
}
export function maskPhone(normalized) {
  return normalized.length > 4 ? `${'*'.repeat(normalized.length - 4)}${normalized.slice(-4)}` : '****';
}
