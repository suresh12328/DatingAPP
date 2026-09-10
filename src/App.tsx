import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';
import { LandingPage } from './components/landing/LandingPage';
import { EmailVerificationModal } from './components/auth/EmailVerificationModal';
import { StoriesBar } from './components/feed/StoriesBar';
import { CreatePostCard } from './components/feed/CreatePostCard';
import { PostCard } from './components/feed/PostCard';
import { DatingView } from './components/dating/DatingView';
import { DiscoverView } from './components/discover/DiscoverView';
import { ChatView } from './components/chat/ChatView';
import { ConnectionsView } from './components/connections/ConnectionsView';
import { ReelsView } from './components/reels/ReelsView';
import { SavedPostsView } from './components/saved/SavedPostsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SafetyCenterView } from './components/safety/SafetyCenterView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SettingsView } from './components/settings/SettingsView';
import { ProfileView } from './components/profile/ProfileView';
import { SearchResultsView } from './components/search/SearchResultsView';
import { HelpCenterView } from './components/help/HelpCenterView';
import { GmailView } from './components/gmail/GmailView';

const AuthenticatedApp: React.FC = () => {
  const { currentRoute, routeParams, posts } = useApp();

  const renderContent = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <>
            <StoriesBar />
            <CreatePostCard />
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        );
      case 'discover':
        return <DiscoverView />;
      case 'dating':
      case 'matches':
      case 'likes':
        return <DatingView />;
      case 'messages':
        return <ChatView />;
      case 'connections':
      case 'friends':
        return <ConnectionsView />;
      case 'reels':
        return <ReelsView />;
      case 'saved':
        return <SavedPostsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'safety':
        return <SafetyCenterView />;
      case 'help':
        return <HelpCenterView />;
      case 'admin':
        return <AdminDashboard />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView username={routeParams.username} />;
      case 'search':
        return <SearchResultsView />;
      case 'gmail':
        return <GmailView />;
      default:
        return (
          <>
            <StoriesBar />
            <CreatePostCard />
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        );
    }
  };

  const isMessagesRoute = currentRoute === 'messages';
  const isReelsRoute = currentRoute === 'reels';

  return (
    <MainLayout
      showRightSidebar={!isMessagesRoute && !isReelsRoute}
      isFullHeight={isReelsRoute}
    >
      {renderContent()}
    </MainLayout>
  );
};

const RootApp: React.FC = () => {
  const { isAuthenticated, currentUser, isEmailVerificationPending, verificationPendingEmail, cancelEmailVerification } = useAuth();

  if (isEmailVerificationPending && verificationPendingEmail) {
    return (
      <div className="min-h-screen bg-[#0d0f18] text-white flex items-center justify-center p-4">
        <EmailVerificationModal
          email={verificationPendingEmail}
          onCancel={cancelEmailVerification}
        />
      </div>
    );
  }

  // Strict check: unverified users cannot access the main app
  if (!isAuthenticated || (currentUser && currentUser.email_verified === false)) {
    return <LandingPage />;
  }

  return (
    <AppProvider>
      <AuthenticatedApp />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
