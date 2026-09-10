import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [receivedCode, setReceivedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res.success) {
        setSuccessMsg(res.message || 'Password reset instructions sent to your email.');
        if ((res as any).reset_code) {
          setReceivedCode((res as any).reset_code);
          setResetCode((res as any).reset_code);
        }
        setStep('RESET');
      } else {
        setErrorMsg(res.error || 'Failed to send reset email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setErrorMsg('Please enter the 6-digit reset code.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await resetPassword(email.trim().toLowerCase(), resetCode.trim(), newPassword);
      if (res.success) {
        setSuccessMsg('🎉 Password successfully updated! Redirecting to sign in...');
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Failed to reset password. Check your code and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-indigo-500/20 border border-pink-500/30 text-pink-400 mx-auto flex items-center justify-center mb-4">
          <KeyRound className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100 text-center">
          {step === 'REQUEST' ? 'Reset Your Password' : 'Set New Password'}
        </h2>
        <p className="text-xs text-zinc-400 text-center mt-1.5 leading-relaxed">
          {step === 'REQUEST'
            ? 'Enter your registered email address and we will send a 6-digit reset code.'
            : `Enter the 6-digit reset code sent to ${email} and create your new secure password.`}
        </p>

        {receivedCode && step === 'RESET' && (
          <div className="mt-3 text-center">
            <span className="inline-block px-3 py-1 bg-pink-500/10 border border-pink-500/30 text-pink-300 rounded-full text-xs font-semibold">
              Demo Reset Code: <strong>{receivedCode}</strong>
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'REQUEST' ? (
          <form onSubmit={handleRequestSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-zinc-800 text-xs sm:text-sm p-3.5 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 font-bold text-sm text-white shadow-lg shadow-pink-500/25 hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>Send Reset Code</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="mt-6 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">6-Digit Reset Code</label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="123456"
                required
                className="w-full bg-zinc-800 text-xs sm:text-sm p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white tracking-widest font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">New Password (min 6 characters)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-800 text-xs sm:text-sm p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-800 text-xs sm:text-sm p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 font-bold text-sm text-white shadow-lg shadow-pink-500/25 hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Reset Password</span>
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-zinc-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white transition inline-flex items-center gap-1.5 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
