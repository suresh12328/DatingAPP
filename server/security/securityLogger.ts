export type SecurityEventType =
  | 'REGISTRATION_ATTEMPT'
  | 'REGISTRATION_SUCCESS'
  | 'REGISTRATION_RATE_LIMITED'
  | 'VERIFICATION_REQUESTED'
  | 'VERIFICATION_SUCCESS'
  | 'VERIFICATION_FAILED'
  | 'VERIFICATION_LOCKED'
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_RATE_LIMITED'
  | 'ACCOUNT_LOCKED'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'PASSWORD_RESET_FAILED'
  | 'SESSION_REVOKED'
  | 'LOGOUT'
  | 'CAPTCHA_TRIGGERED'
  | 'CAPTCHA_SOLVED'
  | 'SUSPICIOUS_ACTIVITY_DETECTED'
  | 'DISPOSABLE_EMAIL_BLOCKED';

export interface SecurityEventRecord {
  id: string;
  timestamp: string;
  eventType: SecurityEventType;
  userId?: string;
  targetIdentifier?: string; // email or phone
  ip: string;
  userAgent?: string;
  success: boolean;
  riskScore: number; // 0 (low) - 100 (critical)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
}

// In-memory or persisted security event log ring buffer
const securityEvents: SecurityEventRecord[] = [];
const MAX_LOG_RECORDS = 5000;

export function logSecurityEvent(params: {
  eventType: SecurityEventType;
  userId?: string;
  targetIdentifier?: string;
  ip: string;
  userAgent?: string;
  success: boolean;
  riskScore?: number;
  details: string;
}): SecurityEventRecord {
  const calculatedScore = params.riskScore !== undefined ? params.riskScore : calculateDefaultRisk(params.eventType, params.success);
  
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (calculatedScore >= 80) riskLevel = 'CRITICAL';
  else if (calculatedScore >= 50) riskLevel = 'HIGH';
  else if (calculatedScore >= 25) riskLevel = 'MEDIUM';

  const record: SecurityEventRecord = {
    id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    eventType: params.eventType,
    userId: params.userId,
    targetIdentifier: sanitizeTarget(params.targetIdentifier),
    ip: sanitizeIp(params.ip),
    userAgent: params.userAgent ? params.userAgent.slice(0, 120) : 'Unknown',
    success: params.success,
    riskScore: calculatedScore,
    riskLevel,
    details: params.details
  };

  securityEvents.unshift(record);
  if (securityEvents.length > MAX_LOG_RECORDS) {
    securityEvents.pop();
  }

  // Console alert on high/critical events
  if (record.riskScore >= 50) {
    console.warn(`[SECURITY ALERT - ${record.riskLevel}] ${record.eventType}: ${record.details} (IP: ${record.ip})`);
  }

  return record;
}

export function getSecurityLogs(limit = 100): SecurityEventRecord[] {
  return securityEvents.slice(0, limit);
}

export function getSecurityStats() {
  const now = Date.now();
  const last24h = securityEvents.filter(e => now - new Date(e.timestamp).getTime() < 24 * 3600 * 1000);
  
  return {
    totalEvents24h: last24h.length,
    failedLogins24h: last24h.filter(e => e.eventType === 'LOGIN_FAILED').length,
    rateLimitHits24h: last24h.filter(e => e.eventType.includes('RATE_LIMITED')).length,
    lockedAccounts24h: last24h.filter(e => e.eventType === 'ACCOUNT_LOCKED').length,
    captchaChallenges24h: last24h.filter(e => e.eventType === 'CAPTCHA_TRIGGERED').length,
    suspiciousCount24h: last24h.filter(e => e.riskScore >= 50).length
  };
}

function calculateDefaultRisk(type: SecurityEventType, success: boolean): number {
  if (type === 'ACCOUNT_LOCKED') return 90;
  if (type === 'SUSPICIOUS_ACTIVITY_DETECTED') return 85;
  if (type === 'LOGIN_RATE_LIMITED' || type === 'REGISTRATION_RATE_LIMITED') return 70;
  if (type === 'DISPOSABLE_EMAIL_BLOCKED') return 60;
  if (type === 'VERIFICATION_LOCKED') return 65;
  if (type === 'CAPTCHA_TRIGGERED') return 50;
  if (type === 'LOGIN_FAILED') return 35;
  if (type === 'VERIFICATION_FAILED') return 30;
  if (type === 'PASSWORD_RESET_FAILED') return 40;
  return success ? 5 : 20;
}

function sanitizeTarget(target?: string): string | undefined {
  if (!target) return undefined;
  if (target.includes('@')) {
    // Mask email for display in logs: s***h@example.com
    const [name, dom] = target.split('@');
    if (name.length <= 2) return `${name[0]}***@${dom}`;
    return `${name[0]}***${name[name.length - 1]}@${dom}`;
  }
  // Mask phone: +123****789
  if (target.length > 6) {
    return `${target.slice(0, 4)}****${target.slice(-3)}`;
  }
  return target;
}

function sanitizeIp(ip: string): string {
  if (!ip) return '127.0.0.1';
  // Standardize IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  return ip.replace('::ffff:', '');
}
