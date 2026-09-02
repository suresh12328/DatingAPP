import React from 'react';
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
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showRightSidebar = true
}) => {
  const { activeMatchCelebration, dismissMatchCelebration } = useApp();

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col antialiased selection:bg-pink-500/30 selection:text-pink-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 flex gap-4 lg:gap-6 justify-center">
        {/* Left Navigation Sidebar (Desktop & Tablet) */}
        <LeftSidebar />

        {/* Center Content Stream */}
        <div className="flex-1 max-w-2xl min-w-0 py-4 pb-24 md:pb-12 space-y-4 sm:space-y-6">
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
    </div>
  );
};
