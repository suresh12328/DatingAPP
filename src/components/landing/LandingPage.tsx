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
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { login, register, allUsers, switchUser } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState<number>(24);
  const [gender, setGender] = useState<'WOMAN' | 'MAN' | 'NON_BINARY'>('WOMAN');
  const [location, setLocation] = useState('San Francisco, CA');
  const [isOver18Accepted, setIsOver18Accepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!isOver18Accepted) {
      setErrorMsg('You must certify that you are at least 18 years old to join LoveConnect.');
      return;
    }
    if (age < 18) {
      setErrorMsg('Strict Policy: You must be at least 18 years old.');
      return;
    }
    try {
      register({
        email,
        password,
        full_name: fullName,
        username: username || fullName.toLowerCase().replace(/\s+/g, '_'),
        age,
        gender,
        location,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        dating_preference: 'EVERYONE'
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  const handleQuickDemoLogin = (userId: string) => {
    switchUser(userId);
    setIsAuthModalOpen(false);
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
              onClick={() => {
                setAuthMode('LOGIN');
                setIsAuthModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10 transition"
            >
              Sign In
            </button>

            <button
              id="landing-signup-btn"
              onClick={() => {
                setAuthMode('REGISTER');
                setIsAuthModalOpen(true);
              }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/30 hover:opacity-95 transition"
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
              onClick={() => {
                setAuthMode('REGISTER');
                setIsAuthModalOpen(true);
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                // Quick test login as Sarah Miller (featured member)
                switchUser('user-sarah-1');
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Explore Demo as Sarah</span>
            </button>
          </div>

          {/* Demo User Switcher Bar on Landing */}
          <div className="pt-6 border-t border-white/10">
            <div className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
              Or explore instantly as any test persona:
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickDemoLogin(u.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-slate-200 transition"
                >
                  <img
                    src={u.avatar_url}
                    alt={u.full_name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{u.full_name.split(' ')[0]} ({u.role === 'ADMIN' ? 'Admin' : u.age + 'yo'})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 relative z-10">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Interactive Dating Deck</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Match with mutual interest, swipe right on genuine singles, and send Super Likes to stand out from the crowd.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Social Feed & 24h Stories</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Post moments, share photos, react with comments, and discover what nearby friends are doing in real time.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Safe & 18+ Age Verified</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Strict 18+ age verification, approximate neighborhood privacy, zero financial spam tolerance, and 24/7 moderation.
            </p>
          </div>
        </div>
      </section>

      {/* Auth Modal (Login / Register) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 text-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-zinc-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/25">
                <Heart className="w-6 h-6 fill-white text-white" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-zinc-100">
                {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {authMode === 'LOGIN'
                  ? 'Sign in to access your dating matches & social feed'
                  : 'Join LoveConnect (18+ Age Verified Community)'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs text-rose-300 mb-4">
                {errorMsg}
              </div>
            )}

            {/* Auth Form */}
            {authMode === 'LOGIN' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@loveconnect.app"
                    className="w-full bg-zinc-800 text-xs sm:text-sm p-3.5 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 text-xs sm:text-sm p-3.5 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 transition"
                >
                  Sign In
                </button>

                <div className="text-center pt-2 text-xs text-zinc-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('REGISTER')}
                    className="text-pink-400 font-bold hover:underline"
                  >
                    Sign Up Free
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full bg-zinc-800 text-xs p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Age (18+ Required)</label>
                    <input
                      type="number"
                      min={18}
                      max={99}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-zinc-800 text-xs p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-zinc-800 text-xs p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    >
                      <option value="WOMAN">Woman</option>
                      <option value="MAN">Man</option>
                      <option value="NON_BINARY">Non-Binary</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full bg-zinc-800 text-xs p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-zinc-800 text-xs p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 text-xs p-3 rounded-2xl border border-zinc-700 outline-none focus:border-pink-500 text-white"
                    required
                  />
                </div>

                {/* Mandatory 18+ Certification */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-800/80 border border-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOver18Accepted}
                    onChange={(e) => setIsOver18Accepted(e.target.checked)}
                    className="mt-0.5 text-pink-600 rounded accent-pink-600 cursor-pointer"
                    required
                  />
                  <span className="text-[11px] text-zinc-300 leading-tight">
                    I certify that I am at least <strong className="text-pink-400">18 years of age</strong> and agree to LoveConnect's Safety & Dating Community Guidelines.
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 transition"
                >
                  Complete Registration (18+)
                </button>

                <div className="text-center pt-1 text-xs text-zinc-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('LOGIN')}
                    className="text-pink-400 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
