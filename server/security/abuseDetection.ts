import { logSecurityEvent } from './securityLogger';

export interface RateLimitConfig {
  registrationsPerIpHour: number;
  otpRequestsPerAccountHour: number;
  otpRequestsPerIpHour: number;
  otpVerifyMaxAttempts: number;
  loginMaxFailedAttempts: number;
  loginLockoutDurationMinutes: number;
  passwordResetRequestsPerHour: number;
  otpResendCooldownSeconds: number;
}

// Configurable via process.env with strict defaults
export const SECURITY_CONFIG: RateLimitConfig = {
  registrationsPerIpHour: Number(process.env.RATE_LIMIT_REGISTRATION_PER_IP_HOUR) || 5,
  otpRequestsPerAccountHour: Number(process.env.RATE_LIMIT_OTP_PER_ACCOUNT_HOUR) || 5,
  otpRequestsPerIpHour: Number(process.env.RATE_LIMIT_OTP_PER_IP_HOUR) || 10,
  otpVerifyMaxAttempts: Number(process.env.MAX_OTP_VERIFY_ATTEMPTS) || 5,
  loginMaxFailedAttempts: Number(process.env.MAX_LOGIN_FAILED_ATTEMPTS) || 5,
  loginLockoutDurationMinutes: Number(process.env.LOGIN_LOCKOUT_MINUTES) || 15,
  passwordResetRequestsPerHour: Number(process.env.RATE_LIMIT_PASSWORD_RESET_HOUR) || 5,
  otpResendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60
};

interface RateEntry {
  timestamps: number[];
  failedCount: number;
  lockedUntil?: number;
  requireCaptcha?: boolean;
}

class AbuseDetector {
  private ipRegistrations = new Map<string, number[]>();
  private ipOtpRequests = new Map<string, number[]>();
  private targetOtpRequests = new Map<string, number[]>();
  private loginAttempts = new Map<string, RateEntry>(); // key: `ip:target`
  private passwordResets = new Map<string, number[]>(); // key: target
  private ipActivityScore = new Map<string, { count: number; windowStart: number; suspicious: boolean }>();

  public getClientIp(req: any): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
      const ip = forwarded.split(',')[0].trim();
      if (ip) return ip.replace('::ffff:', '');
    }
    return (req.socket?.remoteAddress || req.ip || '127.0.0.1').replace('::ffff:', '');
  }

  // 1. Check Registration Limits
  public checkRegistrationRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const history = (this.ipRegistrations.get(ip) || []).filter(t => now - t < oneHour);
    this.ipRegistrations.set(ip, history);

    if (history.length >= SECURITY_CONFIG.registrationsPerIpHour) {
      const oldest = history[0];
      const retryAfter = Math.ceil((oldest + oneHour - now) / 1000);
      logSecurityEvent({
        eventType: 'REGISTRATION_RATE_LIMITED',
        ip,
        success: false,
        details: `Registration rate limit exceeded (${history.length}/${SECURITY_CONFIG.registrationsPerIpHour} per hour)`
      });
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, retryAfter),
        reason: 'Too many registration attempts from your network. Please try again later.'
      };
    }

    return { allowed: true };
  }

  public recordRegistrationAttempt(ip: string) {
    const history = this.ipRegistrations.get(ip) || [];
    history.push(Date.now());
    this.ipRegistrations.set(ip, history);
  }

  // 2. Check OTP Request Limits (Resend cooldown + hourly limit)
  public checkOtpRequestLimit(ip: string, target: string, lastSentAt?: number): {
    allowed: boolean;
    retryAfterSeconds?: number;
    reason?: string;
  } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // A. Check Resend Cooldown
    if (lastSentAt) {
      const elapsedSeconds = Math.floor((now - lastSentAt) / 1000);
      if (elapsedSeconds < SECURITY_CONFIG.otpResendCooldownSeconds) {
        const remaining = SECURITY_CONFIG.otpResendCooldownSeconds - elapsedSeconds;
        return {
          allowed: false,
          retryAfterSeconds: remaining,
          reason: `Please wait ${remaining} seconds before requesting another verification code.`
        };
      }
    }

    // B. Check Target Hourly limit
    const targetHistory = (this.targetOtpRequests.get(target) || []).filter(t => now - t < oneHour);
    this.targetOtpRequests.set(target, targetHistory);
    if (targetHistory.length >= SECURITY_CONFIG.otpRequestsPerAccountHour) {
      const oldest = targetHistory[0];
      const retryAfter = Math.ceil((oldest + oneHour - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: retryAfter,
        reason: 'Maximum verification code requests reached for this account. Please try again in an hour.'
      };
    }

    // C. Check IP Hourly limit
    const ipHistory = (this.ipOtpRequests.get(ip) || []).filter(t => now - t < oneHour);
    this.ipOtpRequests.set(ip, ipHistory);
    if (ipHistory.length >= SECURITY_CONFIG.otpRequestsPerIpHour) {
      const oldest = ipHistory[0];
      const retryAfter = Math.ceil((oldest + oneHour - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: retryAfter,
        reason: 'Too many verification code requests from your IP address.'
      };
    }

    return { allowed: true };
  }

  public recordOtpRequest(ip: string, target: string) {
    const now = Date.now();
    const targetHistory = this.targetOtpRequests.get(target) || [];
    targetHistory.push(now);
    this.targetOtpRequests.set(target, targetHistory);

    const ipHistory = this.ipOtpRequests.get(ip) || [];
    ipHistory.push(now);
    this.ipOtpRequests.set(ip, ipHistory);
  }

  // 3. Login Attempt Rate Limits & Brute-Force Lockout
  public checkLoginAllowed(ip: string, target: string): {
    allowed: boolean;
    requireCaptcha: boolean;
    lockedUntil?: number;
    retryAfterSeconds?: number;
    reason?: string;
  } {
    const key = `${ip}:${target.toLowerCase().trim()}`;
    const entry = this.loginAttempts.get(key);
    const now = Date.now();

    if (!entry) {
      return { allowed: true, requireCaptcha: false };
    }

    // Check if currently locked
    if (entry.lockedUntil && entry.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return {
        allowed: false,
        requireCaptcha: true,
        lockedUntil: entry.lockedUntil,
        retryAfterSeconds,
        reason: `Account temporarily locked due to multiple failed login attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`
      };
    }

    // Require CAPTCHA if 2+ failed attempts
    const requireCaptcha = entry.failedCount >= 2;

    return {
      allowed: true,
      requireCaptcha
    };
  }

  public recordLoginFailure(ip: string, target: string): { locked: boolean; requireCaptcha: boolean; attemptsLeft: number } {
    const key = `${ip}:${target.toLowerCase().trim()}`;
    const entry = this.loginAttempts.get(key) || { timestamps: [], failedCount: 0 };
    const now = Date.now();

    entry.failedCount += 1;
    entry.timestamps.push(now);

    let locked = false;
    if (entry.failedCount >= SECURITY_CONFIG.loginMaxFailedAttempts) {
      entry.lockedUntil = now + SECURITY_CONFIG.loginLockoutDurationMinutes * 60 * 1000;
      entry.requireCaptcha = true;
      locked = true;

      logSecurityEvent({
        eventType: 'ACCOUNT_LOCKED',
        targetIdentifier: target,
        ip,
        success: false,
        details: `Account temporarily locked for ${SECURITY_CONFIG.loginLockoutDurationMinutes}m after ${entry.failedCount} failed logins.`
      });
    }

    this.loginAttempts.set(key, entry);

    const attemptsLeft = Math.max(0, SECURITY_CONFIG.loginMaxFailedAttempts - entry.failedCount);
    return {
      locked,
      requireCaptcha: entry.failedCount >= 2,
      attemptsLeft
    };
  }

  public recordLoginSuccess(ip: string, target: string) {
    const key = `${ip}:${target.toLowerCase().trim()}`;
    this.loginAttempts.delete(key);
  }

  // 4. Password Reset Rate Limits
  public checkPasswordResetLimit(target: string): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const history = (this.passwordResets.get(target.toLowerCase().trim()) || []).filter(t => now - t < oneHour);
    this.passwordResets.set(target.toLowerCase().trim(), history);

    if (history.length >= SECURITY_CONFIG.passwordResetRequestsPerHour) {
      const oldest = history[0];
      const retryAfter = Math.ceil((oldest + oneHour - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: retryAfter,
        reason: 'Too many password reset requests. Please check your inbox or try again in an hour.'
      };
    }

    return { allowed: true };
  }

  public recordPasswordReset(target: string) {
    const history = this.passwordResets.get(target.toLowerCase().trim()) || [];
    history.push(Date.now());
    this.passwordResets.set(target.toLowerCase().trim(), history);
  }

  // 5. Detect high-frequency suspicious scanning / automated bots
  public detectSuspiciousAutomation(ip: string): boolean {
    const now = Date.now();
    const windowMs = 30 * 1000; // 30s
    const current = this.ipActivityScore.get(ip) || { count: 0, windowStart: now, suspicious: false };

    if (now - current.windowStart > windowMs) {
      current.count = 1;
      current.windowStart = now;
      current.suspicious = false;
    } else {
      current.count += 1;
    }

    // More than 40 API hits in 30s from one IP is abnormal
    if (current.count > 40 && !current.suspicious) {
      current.suspicious = true;
      logSecurityEvent({
        eventType: 'SUSPICIOUS_ACTIVITY_DETECTED',
        ip,
        success: false,
        riskScore: 85,
        details: `Abnormal rapid request frequency (${current.count} hits in 30s). Automated bot suspected.`
      });
    }

    this.ipActivityScore.set(ip, current);
    return current.suspicious;
  }
}

export const abuseDetector = new AbuseDetector();
