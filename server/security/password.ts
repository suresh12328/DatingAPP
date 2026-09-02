import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    return false;
  }
}

export function hashOtp(otp: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

export function verifyOtp(otp: string, salt: string, expectedHash: string): boolean {
  const computed = hashOtp(otp, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedHash));
  } catch {
    return false;
  }
}

export function generateSecureOtp(length = 6): string {
  // Generate cryptographically secure random numbers
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-4
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (/[A-Z]/.test(password)) score += 1;
  else errors.push('Must contain at least one uppercase letter');

  if (/[a-z]/.test(password)) score += 1;
  else errors.push('Must contain at least one lowercase letter');

  if (/[0-9]/.test(password)) score += 1;
  else errors.push('Must contain at least one number');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(4, score)
  };
}
