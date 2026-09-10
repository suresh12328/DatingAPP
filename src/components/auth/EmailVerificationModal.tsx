import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EmailVerificationModalProps {
  email: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  email,
  onSuccess,
  onCancel
}) => {
  const { verifyEmail, resendVerification, latestVerificationCode } = useAuth();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-fill test code if available for convenient verification
  useEffect(() => {
    if (latestVerificationCode && latestVerificationCode.length === 6) {
      // Allow instant click to fill
    }
  }, [latestVerificationCode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (cleaned.length > 1) {
      // Pasted multi-digit code
      const chars = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || '';
      }
      setDigits(newDigits);
      const nextIndex = Math.min(chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await verifyEmail(code);
      if (res.success) {
        setSuccessMsg('🎉 Email verified! Your account is active. Redirecting to LoveConnect...');
        setTimeout(() => {
          onSuccess?.();
        }, 800);
      } else {
        setErrorMsg(res.error || 'Verification failed. Please double check the code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await resendVerification(email);
      if (res.success) {
        setSuccessMsg(`A fresh verification code has been dispatched to ${email}.`);
        setResendCooldown(30);
      } else {
        setErrorMsg(res.error || 'Failed to resend code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleQuickFill = () => {
    if (latestVerificationCode && latestVerificationCode.length === 6) {
      setDigits(latestVerificationCode.split(''));
      setErrorMsg(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
        {/* Top badge */}
        <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-pink-500/10">
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold font-heading text-zinc-100">
          Verify Your Email
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
          We sent an activation code to{' '}
          <strong className="text-pink-400 font-semibold">{email}</strong>.
          Please enter the 6-digit verification code below to activate your account.
        </p>

        {/* Helper preview badge for instant testing */}
        {latestVerificationCode && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-medium">
            <span>Code: <strong className="tracking-widest font-bold">{latestVerificationCode}</strong></span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[10px] underline hover:text-white font-bold ml-1"
            >
              Fill Code
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 6-Digit Code Input Fields */}
        <form onSubmit={handleVerifySubmit} className="mt-6 space-y-5">
          <div className="flex justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                autoFocus={index === 0}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-zinc-800/90 hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-100 border border-zinc-700 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 rounded-2xl outline-none transition"
              />
            ))}
          </div>

          <button
            id="email-verify-submit-btn"
            type="submit"
            disabled={isLoading || digits.join('').length !== 6}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 font-bold text-sm text-white shadow-lg shadow-pink-500/25 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying & Activating...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Activate Account</span>
              </>
            )}
          </button>
        </form>

        {/* Resend & Secondary options */}
        <div className="mt-5 pt-4 border-t border-zinc-800 flex flex-col items-center gap-3">
          <div className="text-xs text-zinc-400">
            Didn't receive the email?{' '}
            {resendCooldown > 0 ? (
              <span className="text-zinc-500 font-medium">
                Resend in <strong className="text-pink-400">{resendCooldown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-pink-400 font-bold hover:underline"
              >
                {isResending ? 'Sending...' : 'Resend Verification Code'}
              </button>
            )}
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Use another email or back to login</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
