import crypto from 'crypto';

export interface CaptchaChallenge {
  id: string;
  question: string;
  type: 'MATH' | 'TEXT' | 'PATTERN';
  token: string;
  expiresAt: number;
}

interface CaptchaEntry {
  id: string;
  answer: string;
  expiresAt: number;
}

// In-memory active captcha challenges
const activeCaptchas = new Map<string, CaptchaEntry>();

export function generateCaptchaChallenge(): CaptchaChallenge {
  const id = `cap_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  // Mix between math and string pattern
  const isMath = Math.random() > 0.3;
  let question = '';
  let answer = '';

  if (isMath) {
    const num1 = Math.floor(Math.random() * 12) + 3;
    const num2 = Math.floor(Math.random() * 9) + 2;
    const op = Math.random() > 0.5 ? '+' : 'x';
    
    if (op === '+') {
      question = `Security Check: What is ${num1} + ${num2}?`;
      answer = (num1 + num2).toString();
    } else {
      question = `Security Check: What is ${num1} × ${num2}?`;
      answer = (num1 * num2).toString();
    }
  } else {
    const words = ['TRUST', 'SAFE', 'VERIFY', 'MATCH', 'LOVE', 'SECURE', 'DATING', 'HEART'];
    const chosen = words[Math.floor(Math.random() * words.length)];
    question = `Type the word to verify human: "${chosen}"`;
    answer = chosen.toLowerCase();
  }

  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
  activeCaptchas.set(id, { id, answer: answer.toLowerCase().trim(), expiresAt });

  // Cleanup old entries
  if (activeCaptchas.size > 1000) {
    const now = Date.now();
    for (const [key, val] of activeCaptchas.entries()) {
      if (val.expiresAt < now) activeCaptchas.delete(key);
    }
  }

  return {
    id,
    question,
    type: isMath ? 'MATH' : 'TEXT',
    token: id,
    expiresAt
  };
}

export function verifyCaptchaSolution(id: string, solution: string): boolean {
  if (!id || !solution) return false;
  const entry = activeCaptchas.get(id);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    activeCaptchas.delete(id);
    return false;
  }

  const matches = entry.answer === solution.toLowerCase().trim();
  // Single-use: remove after check
  activeCaptchas.delete(id);
  return matches;
}
