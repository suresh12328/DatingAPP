// Disposable & temporary email domain blocklist for dating anti-abuse
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'yopmail.com',
  'dispostable.com',
  'trashmail.com',
  'fakeinbox.com',
  'maildrop.cc',
  'mohmal.com',
  'burnermail.io',
  'temp-mail.org',
  'generator.email',
  'crazymailing.com',
  'getairmail.com',
  'mytemp.email',
  'fakemailgenerator.com',
  'emailondeck.com',
  'inboxbear.com',
  'jetable.org',
  'zillamail.com',
  'tempr.email'
]);

export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_DOMAINS.has(domain);
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizePhone(phone: string): string {
  // Strip non-digit characters except leading plus
  const cleaned = phone.trim().replace(/[^\d+]/g, '');
  return cleaned;
}
