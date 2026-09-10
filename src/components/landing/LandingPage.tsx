import React, { useState } from 'react';
import {
  Heart,
  ShieldCheck,
  Flame,
  MessageCircle,
  Users,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle,
  X,
  UserCheck,
  AlertCircle,
  Calendar,
  Eye,
  EyeOff,
  Mail,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CaptchaWidget } from '../auth/CaptchaWidget';
import { ForgotPasswordModal } from '../auth/ForgotPasswordModal';
import { EmailVerificationModal } from '../auth/EmailVerificationModal';

export const LandingPage: React.FC = () => {
  const {
    login,
    register,
    loginWithGoogle,
    isLoading,
    isEmailVerificationPending,
    verificationPendingEmail,
    cancelEmailVerification
  } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('2001-06-15');
  const [calculatedAge, setCalculatedAge] = useState<number>(24);
  const [gender, setGender] = useState<'WOMAN' | 'MAN' | 'NON_BINARY'>('WOMAN');
  const [location, setLocation] = useState('San Francisco, CA');
  const [isOver18Accepted, setIsOver18Accepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate age when date of birth changes
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (!val) return;
    const birthDate = new Date(val);
    if (isNaN(birthDate.getTime())) return;
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    setCalculatedAge(age);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Login failed. Please check your credentials.');
      } else {
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // 1. Password confirmation check
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    // 2. Age verification check
    if (calculatedAge < 18) {
      setErrorMsg('Strict Policy: You must be at least 18 years old to join LoveConnect.');
      return;
    }

    if (!isOver18Accepted) {
      setErrorMsg('Please certify that you are at least 18 years old.');
      return;
    }

    // 3. CAPTCHA verification check
    if (!captchaToken) {
      setErrorMsg('Please verify that you are not a robot by completing the CAPTCHA.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await register({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        username: fullName.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_') || `user_${Date.now().toString().slice(-4)}`,
        dob,
        age: calculatedAge,
        gender,
        location,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        dating_preference: 'EVERYONE',
        captcha_token: captchaToken
      });

      if (res.success) {
        setIsAuthModalOpen(false);
        // User will now see the EmailVerificationModal because isEmailVerificationPending is set in AuthContext
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setIsAuthModalOpen(false);
      } else {
        setErrorMsg(res.error || 'Google authentication failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAuth = (mode: 'LOGIN' | 'REGISTER') => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0d0f18] text-white flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#0d0f18]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-indigo-400 font-heading">
                LoveConnect
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-login-btn"
              onClick={() => openAuth('LOGIN')}
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              Sign In
            </button>

            <button
              id="landing-signup-btn"
              onClick={() => openAuth('REGISTER')}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/30 hover:opacity-95 transition cursor-pointer"
            >
              Join Free (18+)
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center overflow-hidden">
        {/* Glow ambient spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-pink-300 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Age-Verified 18+ Dating & Social Community</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-heading tracking-tight leading-tight">
            Where Authentic Connection{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-indigo-400">
              Meets Modern Dating.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Connect. Share. Meet. Combine an active social feed with a mutual dating discovery deck, 24h stories, and verified profiles in your city.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              id="landing-hero-get-started-btn"
              onClick={() => openAuth('REGISTER')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              id="landing-hero-demo-login-btn"
              onClick={() => {
                setEmail('@suresh_bohara');
                setPassword('Bohora@12');
                openAuth('LOGIN');
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-pink-400" />
              <span>Sign In (@suresh_bohara)</span>
            </button>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-10 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
              <Flame className="w-5 h-5 text-pink-500 mb-2" />
              <div className="text-sm font-bold text-white">Dating Deck</div>
              <div className="text-xs text-slate-400 mt-0.5">Swipe, match, connect</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
              <Users className="w-5 h-5 text-indigo-400 mb-2" />
              <div className="text-sm font-bold text-white">Social Feed</div>
              <div className="text-xs text-slate-400 mt-0.5">Posts, comments, reels</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
              <MessageCircle className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-sm font-bold text-white">Encrypted Chat</div>
              <div className="text-xs text-slate-400 mt-0.5">Real-time messaging</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
              <ShieldCheck className="w-5 h-5 text-amber-400 mb-2" />
              <div className="text-sm font-bold text-white">18+ Safe Space</div>
              <div className="text-xs text-slate-400 mt-0.5">Age & email verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal (Login / Register) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto">
            <button
              id="auth-modal-close-btn"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-pink-500/25">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100">
                {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {authMode === 'LOGIN'
                  ? 'Sign in to access your dating matches & social feed'
                  : 'Join LoveConnect (18+ Age & Email Verified Community)'}
              </p>
            </div>

            {/* Google Login Button */}
            <div className="space-y-3 mb-5">
              <button
                id="auth-continue-with-google-btn"
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting || isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-sm border border-zinc-200 transition cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-zinc-800 flex-1" />
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Or with email</span>
                <div className="h-px bg-zinc-800 flex-1" />
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            {authMode === 'LOGIN' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Username or Email Address</label>
                  <input
                    id="login-input-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="@suresh_bohara or bohara.suresh8884@gmail.com"
                    className="w-full bg-zinc-800 text-xs sm:text-sm p-3.5 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs text-pink-400 hover:text-pink-300 transition"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-input-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-800 text-xs sm:text-sm p-3.5 pr-10 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer text-white"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>

                <div className="text-center pt-2 text-xs text-zinc-400">
                  Don't have an account?{' '}
                  <button
                    id="switch-to-register-btn"
                    type="button"
                    onClick={() => openAuth('REGISTER')}
                    className="text-pink-400 font-bold hover:underline ml-1"
                  >
                    Sign Up Free
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* 1. Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
                  <input
                    id="register-input-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full bg-zinc-800 text-xs p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    required
                  />
                </div>

                {/* 2. Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address (Gmail / Email)</label>
                  <input
                    id="register-input-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya@gmail.com"
                    className="w-full bg-zinc-800 text-xs p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    required
                  />
                </div>

                {/* 3. Password */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Password (min 6 chars)</label>
                  <div className="relative">
                    <input
                      id="register-input-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-800 text-xs p-3 pr-10 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 4. Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="register-input-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-800 text-xs p-3 pr-10 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 5. Date of Birth & Age Verification */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      id="register-input-dob"
                      type="date"
                      value={dob}
                      onChange={handleDobChange}
                      max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="w-full bg-zinc-800 text-xs p-2.5 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white cursor-pointer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Age Verification
                    </label>
                    <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs font-bold ${
                      calculatedAge >= 18
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      <span>{calculatedAge} years old</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                        {calculatedAge >= 18 ? '✓ 18+ Valid' : 'Under 18'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. "I'm not a robot" CAPTCHA */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Security Check</label>
                  <CaptchaWidget
                    id="register-captcha"
                    onVerify={(token) => {
                      setCaptchaToken(token);
                      setErrorMsg('');
                    }}
                    onExpire={() => setCaptchaToken(null)}
                  />
                </div>

                {/* Mandatory 18+ Certification */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-800/80 border border-zinc-700 cursor-pointer">
                  <input
                    id="register-certify-18-checkbox"
                    type="checkbox"
                    checked={isOver18Accepted}
                    onChange={(e) => setIsOver18Accepted(e.target.checked)}
                    className="mt-0.5 text-pink-600 rounded accent-pink-600 cursor-pointer"
                    required
                  />
                  <span className="text-[11px] text-zinc-300 leading-tight">
                    I certify that I am at least <strong className="text-pink-400">18 years of age</strong> and agree to receive a verification email to activate my account.
                  </span>
                </label>

                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer text-white"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Account & Sending Email...</span>
                    </>
                  ) : (
                    <span>Create Account & Send Verification Email</span>
                  )}
                </button>

                <div className="text-center pt-1 text-xs text-zinc-400">
                  Already have an account?{' '}
                  <button
                    id="switch-to-login-btn"
                    type="button"
                    onClick={() => openAuth('LOGIN')}
                    className="text-pink-400 font-bold hover:underline ml-1"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={() => {
          setIsForgotPasswordOpen(false);
          openAuth('LOGIN');
          setSuccessMsg('Password reset! Please sign in with your new password.');
        }}
      />

      {/* Email Verification Modal when pending */}
      {isEmailVerificationPending && verificationPendingEmail && (
        <EmailVerificationModal
          email={verificationPendingEmail}
          onSuccess={() => {
            setIsAuthModalOpen(false);
          }}
          onCancel={cancelEmailVerification}
        />
      )}
    </div>
  );
};
