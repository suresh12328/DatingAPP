import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Navbar } from './Navbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MatchModal } from '../common/MatchModal';
import { ReportModal } from '../common/ReportModal';
import { useApp } from '../../context/AppContext';

interface MainLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
  isFullHeight?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showRightSidebar = true,
  isFullHeight = false
}) => {
  const { activeMatchCelebration, dismissMatchCelebration, toast } = useApp();

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col antialiased selection:bg-pink-500/30 selection:text-pink-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 flex gap-4 lg:gap-6 justify-center">
        {/* Left Navigation Sidebar (Desktop & Tablet) */}
        <LeftSidebar />

        {/* Center Content Stream */}
        <div className={`flex-1 max-w-2xl min-w-0 ${isFullHeight ? 'py-1 sm:py-2 pb-20 md:pb-2 flex flex-col' : 'py-4 pb-24 md:pb-12 space-y-4 sm:space-y-6'}`}>
          {children}
        </div>

        {/* Right Sidebar (Desktop only) */}
        {showRightSidebar && <RightSidebar />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Real-time Match Celebration Modal */}
      <MatchModal
        match={activeMatchCelebration}
        onClose={dismissMatchCelebration}
      />

      {/* Safety Report Modal */}
      <ReportModal />

      {/* Global Toast Notification */}
      {toast && (
        <div
          id="global-toast-notification"
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full border text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-600/70 text-rose-100 shadow-rose-950/50'
              : toast.type === 'info'
              ? 'bg-zinc-900/95 border-blue-500/50 text-blue-200 shadow-black/60'
              : 'bg-zinc-900/95 border-zinc-700/80 text-white shadow-black/60'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
