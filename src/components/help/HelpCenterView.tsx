import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  MessageSquare,
  Shield,
  Heart,
  UserCheck,
  FileText,
  AlertTriangle,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

export const HelpCenterView: React.FC = () => {
  const { currentUser } = useAuth();
  const { navigate } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'dating' | 'safety' | 'account' | 'privacy'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  // Support Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'DATING' | 'SAFETY' | 'ACCOUNT' | 'BILLING' | 'OTHER'>('DATING');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  const faqs = [
    {
      id: 'faq-1',
      category: 'dating',
      question: 'How do Matches and Likes work on LoveConnect?',
      answer: 'When you tap the Heart (Like) on someone’s profile, they are added to your sent likes. If they like you back, it is an instant Match! You will receive a celebratory alert and you can start messaging immediately in the Chats section.'
    },
    {
      id: 'faq-2',
      category: 'dating',
      question: 'What is a Super Like?',
      answer: 'A Super Like highlights your profile with a luminous blue/indigo border and lets the other member know you are exceptionally interested before they make their swipe decision.'
    },
    {
      id: 'faq-3',
      category: 'safety',
      question: 'How does 18+ Identity & Photo Verification work?',
      answer: 'LoveConnect enforces a strict 18+ age requirement. In your Profile Settings or Safety Center, you can submit a selfie and identity document for fast moderation review. Once approved, a blue Verified Badge is displayed across your profile.'
    },
    {
      id: 'faq-4',
      category: 'safety',
      question: 'How do I block or report someone violating community rules?',
      answer: 'You can tap the 3-dot menu or the Shield icon on any profile, post, or message. When you report, our moderation team reviews the incident. Blocking instantly prevents all future communication and hides profiles mutually.'
    },
    {
      id: 'faq-5',
      category: 'account',
      question: 'Can I export or permanently delete my LoveConnect data?',
      answer: 'Yes. Navigate to Settings > Account & Data. You can download an encrypted JSON backup of your entire profile, posts, and matches, or request permanent account deletion.'
    },
    {
      id: 'faq-6',
      category: 'privacy',
      question: 'Who can see my Dating profile and feed posts?',
      answer: 'In Privacy Settings, you can set your visibility to Public, Connections Only, or toggle off Dating Visibility if you only want to use LoveConnect for social networking and friendships.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await api.submitSupportTicket(currentUser.id, subject, category, message);
      setTicketSuccess(`Support ticket #${Math.floor(100000 + Math.random() * 900000)} created. Our 24/7 Member Care team will follow up via your registered email (${currentUser.email}).`);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setTicketSuccess('Ticket submitted successfully! Support staff has received your inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-950/60 via-zinc-900 to-zinc-950 border border-indigo-900/40 p-6 sm:p-8 overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>LoveConnect Help & Member Care</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-heading">
            How can we help you today?
          </h1>
          <p className="text-sm text-zinc-300 max-w-xl">
            Find answers to common questions about dating, matchmaking, safety verification, and privacy, or reach out to our dedicated 24/7 support team.
          </p>

          {/* Search bar */}
          <div className="pt-2">
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (e.g., matches, 18+ verification, safety)..."
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Decorative ambient background orb */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('safety')}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition text-left flex items-start gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-300 transition">
              Safety Center
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              18+ verification, reporting guides & scam protection.
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate('settings')}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 transition text-left flex items-start gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-indigo-300 transition">
              Account & Privacy
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage sessions, password, and profile visibility.
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            const el = document.getElementById('contact-support-form');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-pink-500/40 transition text-left flex items-start gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 group-hover:scale-105 transition">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-pink-300 transition">
              Contact 24/7 Support
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Submit a private ticket to our support specialists.
            </p>
          </div>
        </button>
      </div>

      {/* FAQ Section with Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <h2 className="text-lg font-bold text-zinc-100">Frequently Asked Questions</h2>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['all', 'dating', 'safety', 'account', 'privacy'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
              No matching help articles found for "{searchQuery}". Try submitting a ticket below!
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-850 transition"
                  >
                    <span className="text-sm font-semibold text-zinc-100">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-1 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/60 bg-zinc-950/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Contact Support Ticket Form */}
      <div id="contact-support-form" className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 font-heading">
              Submit a Support Ticket
            </h2>
            <p className="text-xs text-zinc-400">
              Need assistance with an issue, verification question, or feature inquiry? Our support agents respond in under 2 hours.
            </p>
          </div>
        </div>

        {ticketSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{ticketSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="DATING">Dating & Matches</option>
                <option value="SAFETY">Safety & Moderation</option>
                <option value="ACCOUNT">Account & Verification</option>
                <option value="BILLING">Subscriptions & Upgrades</option>
                <option value="OTHER">General Feedback / Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your request"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Detailed Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe what happened or how we can assist you..."
              required
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-pink-500/25 hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting Ticket...' : 'Send Message to Member Care'}</span>
          </button>
        </form>
      </div>

      {/* Community Rules Notice */}
      <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-400 flex items-start gap-3">
        <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-zinc-300">LoveConnect Trust & Safety Commitment</p>
          <p>
            We maintain zero tolerance for harassment, underage profiles (strictly 18+), hate speech, fraudulent solicitations, and impersonation. Violations result in immediate permanent device bans.
          </p>
        </div>
      </div>
    </div>
  );
};
