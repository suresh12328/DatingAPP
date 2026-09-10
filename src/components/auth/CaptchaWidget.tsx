import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Check } from 'lucide-react';

interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  id?: string;
}

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({ onVerify, onExpire, id = 'captcha-widget' }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResolved, setIsResolved] = useState(false);

  const handleCheckboxClick = () => {
    if (isResolved || isVerifying) return;
    setIsVerifying(true);

    // Simulate realistic human verification / reCAPTCHA challenge response
    setTimeout(() => {
      const token = `captcha-token-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setIsVerifying(false);
      setIsChecked(true);
      setIsResolved(true);
      onVerify(token);
    }, 750);
  };

  const handleReset = () => {
    setIsChecked(false);
    setIsVerifying(false);
    setIsResolved(false);
    onExpire?.();
  };

  return (
    <div
      id={id}
      className="flex items-center justify-between p-3.5 bg-zinc-850 hover:bg-zinc-800/90 border border-zinc-700/80 rounded-2xl transition shadow-sm select-none"
    >
      <div className="flex items-center gap-3.5 cursor-pointer" onClick={handleCheckboxClick}>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
            isResolved
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25'
              : isVerifying
              ? 'border-pink-500 bg-pink-500/10'
              : 'border-zinc-500/80 bg-zinc-900 hover:border-pink-400'
          }`}
        >
          {isResolved ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : isVerifying ? (
            <RefreshCw className="w-3.5 h-3.5 text-pink-400 animate-spin" />
          ) : null}
        </div>

        <span
          className={`text-xs font-semibold ${
            isResolved ? 'text-emerald-400' : 'text-zinc-200'
          }`}
        >
          {isResolved ? "Verification Passed: I'm not a robot" : isVerifying ? "Verifying human interaction..." : "I'm not a robot"}
        </span>
      </div>

      <div className="flex flex-col items-center pl-3 border-l border-zinc-700/60 leading-none">
        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 tracking-tight">
          <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
          <span>reCAPTCHA</span>
        </div>
        <span className="text-[8px] text-zinc-500 mt-0.5">Privacy • Terms</span>
      </div>
    </div>
  );
};
