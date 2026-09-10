import {
  Profile,
  Post,
  Story,
  Reel,
  Match,
  Connection,
  AppNotification,
  Conversation,
  Message,
  Report,
  ReportReason,
  UserRole,
  UserStatus
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private activeUserId: string = 'user-suresh';
  private sessionToken: string = typeof window !== 'undefined' ? (localStorage.getItem('loveconnect_token') || '') : '';

  setActiveUserId(id?: string) {
    this.activeUserId = id || 'user-suresh';
  }

  getActiveUserId(): string {
    return this.activeUserId;
  }

  setSessionToken(token: string) {
    this.sessionToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('loveconnect_token', token);
      } else {
        localStorage.removeItem('loveconnect_token');
      }
    }
  }

  getSessionToken(): string {
    return this.sessionToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': this.activeUserId,
      ...(this.sessionToken ? { 'Authorization': `Bearer ${this.sessionToken}` } : {}),
      ...((options.headers as Record<string, string>) || {})
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      let errorPayload: any = null;
      try {
        errorPayload = await response.json();
        errorMessage = errorPayload.error || errorPayload.message || errorMessage;
      } catch {
        errorMessage = `HTTP error ${response.status}`;
      }
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.payload = errorPayload;
      throw error;
    }

    return response.json();
  }

  // --- Auth ---
  async checkSession(): Promise<{ success: boolean; user?: Profile; email_unverified?: boolean }> {
    const token = this.sessionToken || (typeof window !== 'undefined' ? localStorage.getItem('loveconnect_token') : '');
    if (!token) {
      return { success: false };
    }
    try {
      const res = await this.request<{ success: boolean; user?: Profile; email_unverified?: boolean }>('/auth/session');
      if (res.user) {
        this.activeUserId = res.user.id;
      }
      return res;
    } catch {
      return { success: false };
    }
  }

  async login(email: string, password?: string): Promise<{ success: boolean; user: Profile; token: string }> {
    const res = await this.request<{ success: boolean; user: Profile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.activeUserId = res.user.id;
    if (res.token) this.setSessionToken(res.token);
    return res;
  }

  async googleAuth(data: { email: string; full_name?: string; avatar_url?: string; google_uid?: string }): Promise<{ success: boolean; user: Profile; token: string }> {
    const res = await this.request<{ success: boolean; user: Profile; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.activeUserId = res.user.id;
    if (res.token) this.setSessionToken(res.token);
    return res;
  }

  async register(data: Partial<Profile> & { email: string; password?: string; dob?: string; captcha_token?: string }): Promise<{ success: boolean; user: Profile; token: string; email_verification_required?: boolean; verification_code?: string; message?: string }> {
    const res = await this.request<{ success: boolean; user: Profile; token: string; email_verification_required?: boolean; verification_code?: string; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.activeUserId = res.user.id;
    if (res.token) this.setSessionToken(res.token);
    return res;
  }

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; user: Profile; token: string; message: string }> {
    const res = await this.request<{ success: boolean; user: Profile; token: string; message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });
    if (res.user) {
      this.activeUserId = res.user.id;
    }
    if (res.token) {
      this.setSessionToken(res.token);
    }
    return res;
  }

  async resendVerification(email: string): Promise<{ success: boolean; message: string; verification_code?: string }> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; reset_code?: string }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword })
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failure on logout
    } finally {
      this.setSessionToken('');
    }
  }

  // --- Users ---
  async getUsers(): Promise<Profile[]> {
    const res = await this.request<{ users: Profile[] }>('/users');
    return res.users;
  }

  async getUser(id: string): Promise<Profile> {
    const res = await this.request<{ user: Profile }>(`/users/${id}`);
    return res.user;
  }

  async getUserByUsername(username: string): Promise<Profile> {
    const res = await this.request<{ user: Profile }>(`/users/username/${encodeURIComponent(username)}`);
    return res.user;
  }

  async updateUser(id: string, updates: Partial<Profile>): Promise<Profile> {
    const res = await this.request<{ success: boolean; user: Profile }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.user;
  }

  async addPhoto(userId: string, photoUrl: string): Promise<Profile> {
    const res = await this.request<{ success: boolean; user: Profile }>(`/users/${userId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ photoUrl })
    });
    return res.user;
  }

  async deletePhoto(userId: string, photoIndex: number): Promise<Profile> {
    const res = await this.request<{ success: boolean; user: Profile }>(`/users/${userId}/photos`, {
      method: 'DELETE',
      body: JSON.stringify({ photoIndex })
    });
    return res.user;
  }

  async reorderPhotos(userId: string, photos: string[]): Promise<Profile> {
    const res = await this.request<{ success: boolean; user: Profile }>(`/users/${userId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ photos })
    });
    return res.user;
  }

  // --- Dating ---
  async getDatingRecommendations(userId: string): Promise<Profile[]> {
    const res = await this.request<{ candidates: Profile[] }>(`/dating/recommendations?userId=${userId}`);
    return res.candidates;
  }

  async likeProfile(fromUserId: string, toUserId: string, isSuperLike = false): Promise<{ isMatch: boolean; match?: Match }> {
    return this.request('/dating/like', {
      method: 'POST',
      body: JSON.stringify({ fromUserId, toUserId, isSuperLike })
    });
  }

  async passProfile(fromUserId: string, toUserId: string): Promise<{ success: boolean }> {
    return this.request('/dating/pass', {
      method: 'POST',
      body: JSON.stringify({ fromUserId, toUserId })
    });
  }

  async undoLastAction(userId: string): Promise<{ undoneUserId?: string }> {
    return this.request('/dating/undo', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async getLikesReceived(userId: string): Promise<Array<{ id: string; from_user_id: string; is_super_like: boolean; created_at: string; user: Profile }>> {
    const res = await this.request<{ likes: any[] }>(`/dating/likes-received?userId=${userId}`);
    return res.likes;
  }

  async getLikesSent(userId: string): Promise<Array<{ id: string; to_user_id: string; is_super_like: boolean; created_at: string; user: Profile }>> {
    const res = await this.request<{ likes: any[] }>(`/dating/likes-sent?userId=${userId}`);
    return res.likes;
  }

  async getMatches(userId: string): Promise<Match[]> {
    const res = await this.request<{ matches: Match[] }>(`/matches?userId=${userId}`);
    return res.matches;
  }

  async unmatch(matchId: string): Promise<void> {
    await this.request(`/matches/${matchId}`, { method: 'DELETE' });
  }

  // --- Conversations & Messages ---
  async getConversations(userId: string): Promise<Conversation[]> {
    const res = await this.request<{ conversations: Conversation[] }>(`/conversations?userId=${userId}`);
    return res.conversations;
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const res = await this.request<{ conversation: Conversation }>(`/conversations/${conversationId}`);
    return res.conversation;
  }

  async getMessagesByConversation(conversationId: string, userId?: string): Promise<Message[]> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await this.request<{ messages: Message[] }>(`/conversations/${conversationId}/messages${query}`);
    return res.messages;
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    await this.request(`/conversations/${conversationId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  async toggleMuteConversation(conversationId: string, userId: string): Promise<{ success: boolean; isMuted: boolean }> {
    return await this.request<{ success: boolean; isMuted: boolean }>(`/conversations/${conversationId}/mute`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async getMessages(otherUserId: string, currentUserId: string): Promise<Message[]> {
    const res = await this.request<{ messages: Message[] }>(`/conversations/with/${otherUserId}?userId=${currentUserId}`);
    return res.messages;
  }

  async sendMessage(senderId: string, receiverId: string, content: string, mediaUrl?: string, replyToId?: string, conversationId?: string): Promise<Message> {
    const res = await this.request<{ success: boolean; message: Message }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ senderId, receiverId, content, mediaUrl, replyToId, conversationId })
    });
    return res.message;
  }

  async markMessagesRead(receiverId: string, senderId: string, conversationId?: string): Promise<void> {
    try {
      await this.request('/messages/read', {
        method: 'POST',
        body: JSON.stringify({ receiverId, senderId, conversationId })
      });
    } catch (err) {
      console.warn('Backend markMessagesRead sync warning (safe fallback):', err);
    }
  }

  async unsendMessage(messageId: string, userId: string): Promise<void> {
    await this.request(`/messages/${messageId}/unsend`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // --- Posts & Feed ---
  async getPosts(userId?: string): Promise<Post[]> {
    const url = userId ? `/posts?userId=${userId}` : '/posts';
    const res = await this.request<{ posts: Post[] }>(url);
    return res.posts;
  }

  async createPost(userId: string, content: string, media?: any[], feeling?: string, location?: string, privacy?: string): Promise<Post> {
    const res = await this.request<{ success: boolean; post: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify({ userId, content, media, feeling, location, privacy })
    });
    return res.post;
  }

  async toggleLikePost(postId: string, userId: string): Promise<boolean> {
    const res = await this.request<{ success: boolean; liked: boolean }>(`/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    return res.liked;
  }

  async toggleSavePost(postId: string): Promise<boolean> {
    const res = await this.request<{ success: boolean; saved: boolean }>(`/posts/${postId}/save`, {
      method: 'POST'
    });
    return res.saved;
  }

  async addComment(postId: string, userId: string, content: string): Promise<any> {
    const res = await this.request<{ success: boolean; comment: any }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, content })
    });
    return res.comment;
  }

  async addCommentReply(postId: string, commentId: string, userId: string, content: string): Promise<any> {
    const res = await this.request<{ success: boolean; reply: any }>(`/posts/${postId}/comments/${commentId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ userId, content })
    });
    return res.reply;
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    await this.request(`/posts/${postId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  async editPost(postId: string, userId: string, content: string): Promise<void> {
    await this.request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, content })
    });
  }

  // --- Stories ---
  async getStories(): Promise<Story[]> {
    const res = await this.request<{ stories: Story[] }>('/stories');
    return res.stories;
  }

  async createStory(userId: string, mediaUrl: string, mediaType?: 'image' | 'video', textOverlay?: string): Promise<Story> {
    const res = await this.request<{ success: boolean; story: Story }>('/stories', {
      method: 'POST',
      body: JSON.stringify({ userId, mediaUrl, mediaType, textOverlay })
    });
    return res.story;
  }

  async markStorySeen(storyId: string): Promise<void> {
    await this.request(`/stories/${storyId}/seen`, { method: 'POST' });
  }

  async reactToStory(storyId: string, userId: string, emoji: string): Promise<void> {
    await this.request(`/stories/${storyId}/react`, {
      method: 'POST',
      body: JSON.stringify({ userId, emoji })
    });
  }

  // --- Reels ---
  async getReels(): Promise<Reel[]> {
    const res = await this.request<{ reels: Reel[] }>('/reels');
    return res.reels;
  }

  async getPaginatedReels(page: number = 1, limit: number = 4): Promise<{
    reels: Reel[];
    pagination: { page: number; limit: number; total: number; hasMore: boolean; totalPages: number };
  }> {
    return await this.request<{
      reels: Reel[];
      pagination: { page: number; limit: number; total: number; hasMore: boolean; totalPages: number };
    }>(`/reels?page=${page}&limit=${limit}`);
  }

  async createReel(userId: string, videoUrl: string, caption: string, musicTitle?: string): Promise<Reel> {
    const res = await this.request<{ success: boolean; reel: Reel }>('/reels', {
      method: 'POST',
      body: JSON.stringify({ userId, videoUrl, caption, musicTitle })
    });
    return res.reel;
  }

  async likeReel(reelId: string): Promise<any> {
    return await this.request(`/reels/${reelId}/like`, { method: 'POST' });
  }

  async saveReel(reelId: string): Promise<any> {
    return await this.request(`/reels/${reelId}/save`, { method: 'POST' });
  }

  async shareReel(reelId: string): Promise<any> {
    return await this.request(`/reels/${reelId}/share`, { method: 'POST' });
  }

  async getReelComments(reelId: string): Promise<any[]> {
    const res = await this.request<{ comments: any[] }>(`/reels/${reelId}/comments`);
    return res.comments;
  }

  async commentOnReel(reelId: string, userId: string, content: string): Promise<any> {
    return await this.request(`/reels/${reelId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, content })
    });
  }

  async deleteReel(reelId: string, userId: string): Promise<void> {
    await this.request(`/reels/${reelId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  // --- Connections ---
  async getConnections(userId: string): Promise<Connection[]> {
    const res = await this.request<{ connections: Connection[] }>(`/connections?userId=${userId}`);
    return res.connections;
  }

  async sendConnectionRequest(requesterId: string, receiverId: string): Promise<Connection> {
    const res = await this.request<{ success: boolean; connection: Connection }>('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ requesterId, receiverId })
    });
    return res.connection;
  }

  async acceptConnection(connectionId: string, userId: string): Promise<void> {
    await this.request(`/connections/${connectionId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async rejectConnection(connectionId: string, userId: string): Promise<void> {
    await this.request(`/connections/${connectionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async removeConnection(connectionId: string): Promise<void> {
    await this.request(`/connections/${connectionId}`, { method: 'DELETE' });
  }

  // --- Notifications ---
  async getNotifications(userId: string): Promise<AppNotification[]> {
    const res = await this.request<{ notifications: AppNotification[] }>(`/notifications?userId=${userId}`);
    return res.notifications;
  }

  async markNotificationRead(notifId: string, userId: string): Promise<void> {
    await this.request(`/notifications/${notifId}/read`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.request('/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async deleteNotification(notifId: string, userId: string): Promise<void> {
    await this.request(`/notifications/${notifId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  // --- Safety & Moderation ---
  async reportContent(reporterId: string, targetType: Report['target_type'], targetId: string, reason: ReportReason, details: string, targetTitle?: string): Promise<Report> {
    const res = await this.request<{ success: boolean; report: Report }>('/safety/reports', {
      method: 'POST',
      body: JSON.stringify({ reporterId, targetType, targetId, reason, details, targetTitle })
    });
    return res.report;
  }

  async getBlockedUsers(userId: string): Promise<Profile[]> {
    const res = await this.request<{ blockedUsers: Profile[] }>(`/safety/blocks?userId=${userId}`);
    return res.blockedUsers;
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.request('/safety/blocks', {
      method: 'POST',
      body: JSON.stringify({ blockerId, blockedId })
    });
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.request(`/safety/blocks/${blockedId}`, {
      method: 'DELETE',
      body: JSON.stringify({ blockerId })
    });
  }

  async requestVerification(userId: string, selfieUrl: string, idDocumentUrl?: string, notes?: string): Promise<any> {
    const res = await this.request<{ success: boolean; verification: any }>('/verification/request', {
      method: 'POST',
      body: JSON.stringify({ userId, selfieUrl, idDocumentUrl, notes })
    });
    return res.verification;
  }

  // --- Settings & Sessions ---
  async getSessions(userId: string): Promise<any[]> {
    const res = await this.request<{ sessions: any[] }>(`/settings/sessions?userId=${userId}`);
    return res.sessions;
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.request(`/settings/sessions/${sessionId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    });
  }

  async submitSupportTicket(userId: string, subject: string, category: string, message: string, attachmentUrl?: string): Promise<any> {
    const res = await this.request<{ success: boolean; ticket: any }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ userId, subject, category, message, attachmentUrl })
    });
    return res.ticket;
  }

  async deleteAccount(userId: string, passwordConfirmation?: string): Promise<{ success: boolean; message: string }> {
    return this.request('/settings/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ userId, passwordConfirmation })
    });
  }

  // --- Admin ---
  async getAdminDashboard(): Promise<any> {
    const res = await this.request<{ metrics: any }>('/admin/dashboard');
    return res.metrics;
  }

  async getAdminUsers(): Promise<Profile[]> {
    const res = await this.request<{ users: Profile[] }>('/admin/users');
    return res.users;
  }

  async setAdminUserStatus(userId: string, status: UserStatus, adminId: string, reason?: string): Promise<Profile> {
    const res = await this.request<{ success: boolean; user: Profile }>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminId, reason })
    });
    return res.user;
  }

  async setAdminUserRole(userId: string, role: UserRole, adminId: string): Promise<Profile> {
    const res = await this.request<{ success: boolean; user: Profile }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, adminId })
    });
    return res.user;
  }

  async getAdminReports(): Promise<Report[]> {
    const res = await this.request<{ reports: Report[] }>('/admin/reports');
    return res.reports;
  }

  async resolveAdminReport(reportId: string, adminId: string, actionTaken: string): Promise<void> {
    await this.request(`/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ adminId, actionTaken })
    });
  }

  async dismissAdminReport(reportId: string, adminId: string): Promise<void> {
    await this.request(`/admin/reports/${reportId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ adminId })
    });
  }

  async getAdminVerifications(): Promise<any[]> {
    const res = await this.request<{ verifications: any[] }>('/admin/verifications');
    return res.verifications;
  }

  async reviewAdminVerification(requestId: string, adminId: string, status: 'APPROVED' | 'REJECTED', notes?: string): Promise<void> {
    await this.request(`/admin/verifications/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify({ adminId, status, notes })
    });
  }

  async getAdminAnnouncements(): Promise<any[]> {
    const res = await this.request<{ announcements: any[] }>('/admin/announcements');
    return res.announcements;
  }

  async createAdminAnnouncement(title: string, message: string, type: string, adminId: string): Promise<any> {
    const res = await this.request<{ success: boolean; announcement: any }>('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, message, type, adminId })
    });
    return res.announcement;
  }

  async getAdminAuditLogs(): Promise<any[]> {
    const res = await this.request<{ auditLogs: any[] }>('/admin/audit-logs');
    return res.auditLogs;
  }
}

export const api = new ApiClient();
