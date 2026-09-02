import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldAlert, X, CheckCircle } from 'lucide-react';
import { ReportReason } from '../../types';
import { useApp } from '../../context/AppContext';

export const ReportModal: React.FC = () => {
  const { reportModalData, closeReportModal, submitReport } = useApp();
  const [selectedReason, setSelectedReason] = useState<ReportReason>('INAPPROPRIATE_CONTENT');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!reportModalData) return null;

  const reasons: { key: ReportReason; label: string; desc: string }[] = [
    { key: 'FAKE_PROFILE', label: 'Fake profile / Impersonation', desc: 'Pretending to be someone else or using stolen photos' },
    { key: 'HARASSMENT', label: 'Harassment or Bullying', desc: 'Threatening, abusive, or offensive behavior' },
    { key: 'SPAM', label: 'Spam or Advertising', desc: 'Promoting products, services, or fake links' },
    { key: 'SCAM', label: 'Scam or Financial Fraud', desc: 'Asking for money, cryptocurrency, or gift cards' },
    { key: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate / Nudity', desc: 'Explicit sexual photos or prohibited content' },
    { key: 'UNDERAGE', label: 'Underage User', desc: 'User appears to be under 18 years old' },
    { key: 'OTHER', label: 'Other Safety Concern', desc: 'Any other violation of LoveConnect safety rules' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(selectedReason, details);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      closeReportModal();
    }, 1400);
  };

  return (
    <div id="report-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-zinc-900 text-zinc-100 rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-800"
      >
        <button
          id="close-report-modal-btn"
          onClick={closeReportModal}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-200 rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Report Received</h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              Thank you for keeping LoveConnect safe. Our safety team will review this report within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">
                  Report {reportModalData.targetType.toLowerCase()}
                </h3>
                {reportModalData.targetTitle && (
                  <p className="text-xs text-zinc-400 line-clamp-1">{reportModalData.targetTitle}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Select the primary reason for reporting. All reports are strictly confidential.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {reasons.map((r) => (
                <label
                  key={r.key}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                    selectedReason === r.key
                      ? 'border-rose-500 bg-rose-500/10 text-zinc-100'
                      : 'border-zinc-800 hover:bg-zinc-800/60 text-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={r.key}
                    checked={selectedReason === r.key}
                    onChange={() => setSelectedReason(r.key)}
                    className="mt-1 text-rose-500 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">{r.label}</div>
                    <div className="text-xs text-zinc-400">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                id="report-details-textarea"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Provide any context that helps our moderation team..."
                className="w-full text-sm rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeReportModal}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                id="submit-report-btn"
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-500 transition flex items-center gap-2 shadow-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Submit Confidential Report
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
