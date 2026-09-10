import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Trash2,
  UserX,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { store } from '../../lib/storage';
import { EmptyState } from '../common/EmptyState';

export const AdminDashboard: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const { reports, deletePost, blockUser } = useApp();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');

  const isAdmin = currentUser.role === 'ADMIN' && (currentUser.id === 'user-suresh' || currentUser.email?.toLowerCase() === 'bohara.suresh8884@gmail.com');

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-zinc-100 font-heading">
          Administrator Access Required
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The Admin & Trust Moderation Center is reserved exclusively for system administrator Suresh Bohara.
        </p>
      </div>
    );
  }

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const handleResolveReport = (reportId: string) => {
    store.resolveReport(reportId);
  };

  const handleBanUser = (reportId: string, reportedUserId: string) => {
    if (confirm(`Ban and remove user ${reportedUserId} from LoveConnect?`)) {
      blockUser(reportedUserId);
      store.resolveReport(reportId);
    }
  };

  const handleRemoveContent = (reportId: string, targetType: string, targetId: string) => {
    if (confirm(`Remove this ${targetType.toLowerCase()}?`)) {
      if (targetType === 'POST') {
        deletePost(targetId);
      }
      store.resolveReport(reportId);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold font-heading">
                Admin & Trust Moderation Panel
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Logged in as <span className="text-amber-400 font-bold">{currentUser.full_name}</span> ({currentUser.role})
              </p>
            </div>
          </div>
          <span className="hidden sm:inline px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            Live Moderation Active
          </span>
        </div>
      </div>

      {/* Analytics KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase">Total Members</span>
            <Users className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100">{allUsers.length}</div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1">100% active database</div>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase">18+ Age Verified</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100">{allUsers.length}</div>
          <div className="text-[10px] text-zinc-400 font-medium mt-1">Verified age credentials</div>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase">Mutual Matches</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100">14</div>
          <div className="text-[10px] text-rose-400 font-medium mt-1">Conversations started</div>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase">Pending Reports</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {reports.filter((r) => r.status === 'PENDING').length}
          </div>
          <div className="text-[10px] text-zinc-400 font-medium mt-1">Requiring action</div>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-100">
              User Reports & Content Moderation Queue
            </h3>
            <p className="text-xs text-zinc-400">
              Review flagged accounts, harassment complaints, and inappropriate content.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-2xl border border-zinc-750">
            {(['ALL', 'PENDING', 'RESOLVED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterStatus === st
                    ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className={`p-4 rounded-2xl border transition ${
                report.status === 'PENDING'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-zinc-800/50 border-zinc-750'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      report.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {report.status}
                  </span>
                  <span className="text-xs font-bold text-zinc-100">
                    Target: {report.target_type} ({report.target_id.slice(0, 8)}...)
                  </span>
                  {report.target_title && (
                    <span className="text-xs text-zinc-400 truncate max-w-xs">
                      "{report.target_title}"
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-zinc-500">
                  {new Date(report.created_at).toLocaleString()}
                </span>
              </div>

              <div className="text-xs text-zinc-300 mb-3 space-y-1">
                <div>
                  <span className="font-semibold text-zinc-400">Reason:</span>{' '}
                  <span className="text-rose-400 font-bold">{report.reason}</span>
                </div>
                {report.details && (
                  <div>
                    <span className="font-semibold text-zinc-400">Report details:</span>{' '}
                    <span>{report.details}</span>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {report.status === 'PENDING' ? (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => handleResolveReport(report.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>

                  <button
                    onClick={() => handleRemoveContent(report.id, report.target_type, report.target_id)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Content</span>
                  </button>

                  <button
                    onClick={() => handleBanUser(report.id, report.target_id)}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Ban Account</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Report resolved and audited</span>
                </div>
              )}
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              No reports found in this status category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
