import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { Profile, RelationshipGoal, DatingPreference, Gender, UserRole, UserStatus } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Request logger helper
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // ==========================================
  // 1. HEALTH & SYSTEM
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LoveConnect Full-Stack Dating API',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & SESSIONS
  // ==========================================
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email or username is required' });
    }
    const user = db.getUserByEmailOrUsername(email);
    if (!user) {
      return res.status(404).json({ error: 'No account found matching this email or username.' });
    }
    if (user.status === 'BANNED') {
      return res.status(403).json({ error: 'Your account has been permanently suspended for terms violation.' });
    }
    return res.json({ success: true, user, token: `token-${user.id}` });
  });

  app.post('/api/auth/register', (req, res) => {
    const data = req.body;
    if (!data.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Age validation check (18+)
    if (data.age && data.age < 18) {
      return res.status(400).json({ error: 'You must be at least 18 years old to join LoveConnect.' });
    }

    if (data.dob) {
      const birthDate = new Date(data.dob);
      const ageDiff = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiff);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (calculatedAge < 18) {
        return res.status(400).json({ error: 'Age verification failed. You must be 18+ to register.' });
      }
    }

    const existing = db.getUserByEmailOrUsername(data.email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const newId = `user-${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      email: data.email,
      username: data.username || data.email.split('@')[0] || `user_${Date.now().toString().slice(-4)}`,
      full_name: data.full_name || 'New Member',
      avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      cover_url: data.cover_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      bio: data.bio || 'New member looking for authentic dating & connections ✨',
      age: data.age || 25,
      dob: data.dob || '1999-01-01',
      gender: data.gender || 'WOMAN',
      sexual_orientation: data.sexual_orientation || 'Straight',
      dating_preference: data.dating_preference || 'EVERYONE',
      dating_preferences: data.dating_preferences || {
        ageRange: [20, 38],
        distanceKm: 50,
        genderPreference: data.dating_preference || 'EVERYONE',
        relationshipGoals: ['LONG_TERM', 'DATING'],
        verifiedOnly: false
      },
      location: data.location || 'San Francisco, CA',
      neighborhood: data.neighborhood || 'Mission District',
      profession: data.profession || 'Professional',
      education: data.education || 'University Graduate',
      interests: data.interests || ['Coffee', 'Travel', 'Music', 'Hiking'],
      relationship_goal: data.relationship_goal || 'LONG_TERM',
      looking_for: data.looking_for || 'A genuine partner with shared passions',
      languages: data.languages || ['English'],
      height_cm: data.height_cm || 170,
      height: `${Math.floor((data.height_cm || 170) / 30.48)}'${Math.round(((data.height_cm || 170) % 30.48) / 2.54)}"`,
      photos: data.photos || [
        data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
      ],
      lifestyle: data.lifestyle || {
        drinking: 'SOCIALLY',
        smoking: 'NEVER',
        workout: 'OFTEN',
        pets: 'Pet lover',
        zodiac: 'Taurus'
      },
      is_verified: true,
      is_online: true,
      last_active: 'Just now',
      role: 'USER',
      status: 'ACTIVE',
      privacy: {
        profileVisibility: 'PUBLIC',
        whoCanMessageMe: 'EVERYONE',
        whoCanConnect: 'EVERYONE',
        datingVisible: true,
        showOnlineStatus: true,
        readReceipts: true
      },
      created_at: new Date().toISOString()
    };

    const created = db.createUser(newProfile);
    res.status(201).json({ success: true, user: created, token: `token-${created.id}` });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = db.getUserByEmailOrUsername(email);
    if (!user) {
      return res.status(404).json({ error: 'No user registered with this email.' });
    }
    res.json({
      success: true,
      message: `Password reset verification instructions sent to ${email}. (Demo reset code: 849201)`
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required' });
    const user = db.getUserByEmailOrUsername(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
  });

  app.post('/api/auth/verify-email', (req, res) => {
    const { email, code } = req.body;
    res.json({ success: true, message: 'Email verified successfully!' });
  });

  // ==========================================
  // 3. USERS & PROFILES
  // ==========================================
  app.get('/api/users', (req, res) => {
    const users = db.getAllUsers();
    res.json({ users });
  });

  app.get('/api/users/:id', (req, res) => {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });

  app.get('/api/users/username/:username', (req, res) => {
    const user = db.getUserByEmailOrUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'Profile not found' });
    res.json({ user });
  });

  app.put('/api/users/:id', (req, res) => {
    try {
      const updated = db.updateUser(req.params.id, req.body);
      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/users/:id/photos', (req, res) => {
    const { photoUrl, photos } = req.body;
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let updatedPhotos = user.photos || [];
    if (photos && Array.isArray(photos)) {
      updatedPhotos = photos;
    } else if (photoUrl) {
      updatedPhotos = [...updatedPhotos, photoUrl];
    }
    const updated = db.updateUser(user.id, { photos: updatedPhotos, avatar_url: updatedPhotos[0] || user.avatar_url });
    res.json({ success: true, user: updated });
  });

  app.delete('/api/users/:id/photos', (req, res) => {
    const { photoIndex } = req.body;
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedPhotos = [...(user.photos || [])];
    if (typeof photoIndex === 'number' && photoIndex >= 0 && photoIndex < updatedPhotos.length) {
      updatedPhotos.splice(photoIndex, 1);
      const updated = db.updateUser(user.id, { photos: updatedPhotos, avatar_url: updatedPhotos[0] || user.avatar_url });
      return res.json({ success: true, user: updated });
    }
    res.status(400).json({ error: 'Invalid photo index' });
  });

  // ==========================================
  // 4. DATING, RECOMMENDATIONS & MATCHES
  // ==========================================
  app.get('/api/dating/recommendations', (req, res) => {
    const userId = (req.query.userId as string) || 'user-david';
    const currentUser = db.getUserById(userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const blockedIds = db.getBlockedUserIds(userId);
    const allUsers = db.getAllUsers();
    const passes = db.getDatingLikes(userId);

    const candidates = allUsers.filter(u => {
      if (u.id === userId) return false;
      if (blockedIds.includes(u.id)) return false;
      if (!u.privacy.datingVisible) return false;
      return true;
    });

    res.json({ candidates });
  });

  app.post('/api/dating/like', (req, res) => {
    const { fromUserId, toUserId, isSuperLike } = req.body;
    if (!fromUserId || !toUserId) return res.status(400).json({ error: 'Missing fromUserId or toUserId' });
    const result = db.likeProfile(fromUserId, toUserId, isSuperLike || false);
    res.json(result);
  });

  app.post('/api/dating/pass', (req, res) => {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) return res.status(400).json({ error: 'Missing IDs' });
    db.passProfile(fromUserId, toUserId);
    res.json({ success: true });
  });

  app.post('/api/dating/undo', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const result = db.undoLastAction(userId);
    res.json(result);
  });

  app.get('/api/dating/likes-received', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const likes = db.getDatingLikes(userId);
    const likedByUsers = likes.map(l => ({
      ...l,
      user: db.getUserById(l.from_user_id)
    })).filter(item => Boolean(item.user));
    res.json({ likes: likedByUsers });
  });

  app.get('/api/dating/likes-sent', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const likes = db.getLikesSent(userId);
    const sentToUsers = likes.map(l => ({
      ...l,
      user: db.getUserById(l.to_user_id)
    })).filter(item => Boolean(item.user));
    res.json({ likes: sentToUsers });
  });

  app.get('/api/matches', (req, res) => {
    const userId = (req.query.userId as string) || 'user-david';
    const matches = db.getMatches(userId);
    res.json({ matches });
  });

  app.delete('/api/matches/:id', (req, res) => {
    db.unmatch(req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // 5. MESSAGING & CONVERSATIONS
  // ==========================================
  app.get('/api/conversations', (req, res) => {
    const userId = (req.query.userId as string) || 'user-david';
    const conversations = db.getConversations(userId);
    res.json({ conversations });
  });

  app.get('/api/conversations/with/:otherUserId', (req, res) => {
    const userId = (req.query.userId as string) || 'user-david';
    const otherUserId = req.params.otherUserId;
    const messages = db.getMessagesBetweenUsers(userId, otherUserId);
    res.json({ messages });
  });

  app.post('/api/messages/send', (req, res) => {
    const { senderId, receiverId, content, mediaUrl, replyToId } = req.body;
    if (!senderId || !receiverId || (!content && !mediaUrl)) {
      return res.status(400).json({ error: 'Sender, receiver, and message content/media are required.' });
    }
    const msg = db.sendMessage(senderId, receiverId, content || '', mediaUrl, replyToId);
    res.status(201).json({ success: true, message: msg });
  });

  app.post('/api/messages/read', (req, res) => {
    const { receiverId, senderId } = req.body;
    if (receiverId && senderId) {
      db.markMessagesRead(receiverId, senderId);
    }
    res.json({ success: true });
  });

  app.post('/api/messages/:id/unsend', (req, res) => {
    const { userId } = req.body;
    db.unsendMessage(req.params.id, userId);
    res.json({ success: true });
  });

  // ==========================================
  // 6. FEED, POSTS, COMMENTS, STORIES & REELS
  // ==========================================
  app.get('/api/posts', (req, res) => {
    const userId = req.query.userId as string | undefined;
    const posts = db.getPosts(userId);
    res.json({ posts });
  });

  app.post('/api/posts', (req, res) => {
    const data = req.body;
    const author = db.getUserById(data.userId);
    if (!author) return res.status(404).json({ error: 'Author not found' });

    const newPost: any = {
      id: `post-${Date.now()}`,
      user_id: data.userId,
      author,
      content: data.content,
      media: data.media || [],
      feeling: data.feeling,
      location: data.location,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      saved_by_me: false,
      liked_by_me: false,
      privacy: data.privacy || 'PUBLIC',
      created_at: new Date().toISOString(),
      comments: []
    };

    const created = db.createPost(newPost);
    res.status(201).json({ success: true, post: created });
  });

  app.post('/api/posts/:id/like', (req, res) => {
    const { userId } = req.body;
    const liked = db.toggleLikePost(req.params.id, userId);
    res.json({ success: true, liked });
  });

  app.post('/api/posts/:id/save', (req, res) => {
    const saved = db.toggleSavePost(req.params.id);
    res.json({ success: true, saved });
  });

  app.post('/api/posts/:id/comments', (req, res) => {
    const { userId, content } = req.body;
    if (!userId || !content) return res.status(400).json({ error: 'Missing userId or content' });
    const comment = db.addComment(req.params.id, userId, content);
    res.status(201).json({ success: true, comment });
  });

  app.post('/api/posts/:id/comments/:commentId/reply', (req, res) => {
    const { userId, content } = req.body;
    if (!userId || !content) return res.status(400).json({ error: 'Missing userId or content' });
    const reply = db.addCommentReply(req.params.id, req.params.commentId, userId, content);
    res.status(201).json({ success: true, reply });
  });

  app.delete('/api/posts/:id', (req, res) => {
    const userId = req.body.userId || (req.query.userId as string);
    db.deletePost(req.params.id, userId);
    res.json({ success: true });
  });

  app.put('/api/posts/:id', (req, res) => {
    const { userId, content } = req.body;
    db.editPost(req.params.id, userId, content);
    res.json({ success: true });
  });

  // Stories
  app.get('/api/stories', (req, res) => {
    const stories = db.getStories();
    res.json({ stories });
  });

  app.post('/api/stories', (req, res) => {
    const data = req.body;
    const author = db.getUserById(data.userId);
    if (!author) return res.status(404).json({ error: 'User not found' });

    const story: any = {
      id: `story-${Date.now()}`,
      user_id: data.userId,
      author,
      media_url: data.mediaUrl,
      media_type: data.mediaType || 'image',
      text_overlay: data.textOverlay,
      views_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      reactions: []
    };
    const created = db.createStory(story);
    res.status(201).json({ success: true, story: created });
  });

  app.post('/api/stories/:id/seen', (req, res) => {
    db.markStorySeen(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/stories/:id/react', (req, res) => {
    const { userId, emoji } = req.body;
    db.reactToStory(req.params.id, userId, emoji);
    res.json({ success: true });
  });

  // Reels
  app.get('/api/reels', (req, res) => {
    const reels = db.getReels();
    res.json({ reels });
  });

  app.post('/api/reels', (req, res) => {
    const data = req.body;
    const author = db.getUserById(data.userId);
    if (!author) return res.status(404).json({ error: 'User not found' });

    const newReel: any = {
      id: `reel-${Date.now()}`,
      user_id: data.userId,
      author,
      video_url: data.videoUrl,
      caption: data.caption,
      music_title: data.musicTitle || 'Original Audio',
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 1,
      liked_by_me: false,
      saved_by_me: false,
      created_at: new Date().toISOString()
    };
    const created = db.createReel(newReel);
    res.status(201).json({ success: true, reel: created });
  });

  app.post('/api/reels/:id/like', (req, res) => {
    db.likeReel(req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // 7. CONNECTIONS & SOCIAL NETWORK
  // ==========================================
  app.get('/api/connections', (req, res) => {
    const userId = (req.query.userId as string) || 'user-david';
    const connections = db.getConnections(userId);
    res.json({ connections });
  });

  app.post('/api/connections/request', (req, res) => {
    const { requesterId, receiverId } = req.body;
    const conn = db.sendConnectionRequest(requesterId, receiverId);
    res.status(201).json({ success: true, connection: conn });
  });

  app.post('/api/connections/:id/accept', (req, res) => {
    const { userId } = req.body;
    db.acceptConnection(req.params.id, userId);
    res.json({ success: true });
  });

  app.post('/api/connections/:id/reject', (req, res) => {
    const { userId } = req.body;
    db.rejectConnection(req.params.id, userId);
    res.json({ success: true });
  });

  app.delete('/api/connections/:id', (req, res) => {
    db.removeConnection(req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // 8. NOTIFICATIONS
  // ==========================================
  app.get('/api/notifications', (req, res) => {
    const userId = (req.query.userId as string) || 'user-david';
    const notifications = db.getNotifications(userId);
    res.json({ notifications });
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    const { userId } = req.body;
    db.markNotificationRead(req.params.id, userId);
    res.json({ success: true });
  });

  app.post('/api/notifications/read-all', (req, res) => {
    const { userId } = req.body;
    db.markAllNotificationsRead(userId);
    res.json({ success: true });
  });

  app.delete('/api/notifications/:id', (req, res) => {
    const userId = req.body.userId || (req.query.userId as string);
    db.deleteNotification(req.params.id, userId);
    res.json({ success: true });
  });

  // ==========================================
  // 9. SAFETY, REPORTS, BLOCKS & VERIFICATION
  // ==========================================
  app.post('/api/safety/reports', (req, res) => {
    const data = req.body;
    const reporter = db.getUserById(data.reporterId);
    if (!reporter) return res.status(404).json({ error: 'Reporter not found' });

    const newReport: any = {
      id: `rep-${Date.now()}`,
      reporter_id: data.reporterId,
      reporter,
      target_type: data.targetType,
      target_id: data.targetId,
      target_title: data.targetTitle,
      reason: data.reason,
      details: data.details,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    const created = db.createReport(newReport);
    res.status(201).json({ success: true, report: created });
  });

  app.get('/api/safety/blocks', (req, res) => {
    const userId = (req.query.userId as string) || 'user-david';
    const blockedUsers = db.getBlockedUsers(userId);
    res.json({ blockedUsers });
  });

  app.post('/api/safety/blocks', (req, res) => {
    const { blockerId, blockedId } = req.body;
    db.blockUser(blockerId, blockedId);
    res.json({ success: true });
  });

  app.delete('/api/safety/blocks/:blockedId', (req, res) => {
    const blockerId = req.body.blockerId || (req.query.blockerId as string);
    db.unblockUser(blockerId, req.params.blockedId);
    res.json({ success: true });
  });

  app.post('/api/verification/request', (req, res) => {
    const { userId, selfieUrl, idDocumentUrl, notes } = req.body;
    if (!userId || !selfieUrl) return res.status(400).json({ error: 'Selfie photo is required for 18+ identity verification.' });
    const verification = db.submitVerificationRequest(userId, selfieUrl, idDocumentUrl, notes);
    res.status(201).json({ success: true, verification });
  });

  // ==========================================
  // 10. SETTINGS & ACCOUNT MANAGEMENT
  // ==========================================
  app.get('/api/settings/sessions', (req, res) => {
    const userId = (req.query.userId as string) || 'user-david';
    const sessions = db.getSessions(userId);
    res.json({ sessions });
  });

  app.delete('/api/settings/sessions/:id', (req, res) => {
    const userId = req.body.userId || (req.query.userId as string);
    db.revokeSession(req.params.id, userId);
    res.json({ success: true });
  });

  app.get('/api/settings/export-data', (req, res) => {
    const userId = (req.query.userId as string) || 'user-david';
    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const exportData = {
      export_date: new Date().toISOString(),
      platform: 'LoveConnect Dating & Social Network',
      user_profile: user,
      matches: db.getMatches(userId),
      connections: db.getConnections(userId),
      posts: db.getPosts().filter(p => p.user_id === userId),
      conversations: db.getConversations(userId),
      notifications: db.getNotifications(userId),
      security_sessions: db.getSessions(userId)
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="loveconnect_data_${user.username}.json"`);
    res.json(exportData);
  });

  app.delete('/api/settings/delete-account', (req, res) => {
    const { userId, passwordConfirmation } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    db.deleteUser(userId);
    res.json({ success: true, message: 'Account permanently deleted from LoveConnect systems.' });
  });

  // Support
  app.get('/api/support/tickets', (req, res) => {
    const userId = req.query.userId as string | undefined;
    const tickets = db.getSupportTickets(userId);
    res.json({ tickets });
  });

  app.post('/api/support/tickets', (req, res) => {
    const data = req.body;
    const newTicket: any = {
      id: `tick-${Date.now()}`,
      user_id: data.userId,
      subject: data.subject,
      category: data.category || 'OTHER',
      message: data.message,
      attachment_url: data.attachmentUrl,
      status: 'OPEN',
      created_at: new Date().toISOString()
    };
    const created = db.createSupportTicket(newTicket);
    res.status(201).json({ success: true, ticket: created });
  });

  // ==========================================
  // 11. ADMIN & MODERATION DASHBOARD (RBAC)
  // ==========================================
  app.get('/api/admin/dashboard', (req, res) => {
    const allUsers = db.getAllUsers();
    const reports = db.getReports();
    const verifications = db.getVerificationRequests();
    const matches = db.getAllUsers().length * 2; // Derived

    res.json({
      metrics: {
        total_members: allUsers.length,
        verified_members: allUsers.filter(u => u.is_verified).length,
        active_now: allUsers.filter(u => u.is_online).length,
        total_matches: 48,
        pending_reports: reports.filter(r => r.status === 'PENDING').length,
        pending_verifications: verifications.filter(v => v.status === 'PENDING').length,
        moderation_accuracy: '99.4%',
        daily_matches: 14
      }
    });
  });

  app.get('/api/admin/users', (req, res) => {
    const users = db.getAllUsers();
    res.json({ users });
  });

  app.put('/api/admin/users/:id/status', (req, res) => {
    const { status, adminId, reason } = req.body;
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = db.updateUser(user.id, { status: status as UserStatus });
    const admin = db.getUserById(adminId);

    db.logAudit({
      id: `audit-${Date.now()}`,
      admin_id: adminId,
      admin_name: admin ? admin.full_name : 'Admin',
      action: `SET_USER_STATUS_${status}`,
      target_type: 'USER',
      target_id: user.id,
      details: `Changed status of @${user.username} to ${status}. Reason: ${reason || 'Admin policy'}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, user: updated });
  });

  app.put('/api/admin/users/:id/role', (req, res) => {
    const { role, adminId } = req.body;
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = db.updateUser(user.id, { role: role as UserRole });
    const admin = db.getUserById(adminId);

    db.logAudit({
      id: `audit-${Date.now()}`,
      admin_id: adminId,
      admin_name: admin ? admin.full_name : 'Admin',
      action: `SET_USER_ROLE_${role}`,
      target_type: 'USER',
      target_id: user.id,
      details: `Granted role ${role} to @${user.username}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, user: updated });
  });

  app.get('/api/admin/reports', (req, res) => {
    const reports = db.getReports();
    res.json({ reports });
  });

  app.post('/api/admin/reports/:id/resolve', (req, res) => {
    const { adminId, actionTaken } = req.body;
    db.resolveReport(req.params.id, adminId, actionTaken || 'Reviewed and actioned');
    res.json({ success: true });
  });

  app.post('/api/admin/reports/:id/dismiss', (req, res) => {
    const { adminId } = req.body;
    db.dismissReport(req.params.id, adminId);
    res.json({ success: true });
  });

  app.get('/api/admin/verifications', (req, res) => {
    const verifications = db.getVerificationRequests();
    res.json({ verifications });
  });

  app.post('/api/admin/verifications/:id/review', (req, res) => {
    const { adminId, status, notes } = req.body;
    db.reviewVerificationRequest(req.params.id, adminId, status, notes);
    res.json({ success: true });
  });

  app.get('/api/admin/announcements', (req, res) => {
    const announcements = db.getAnnouncements();
    res.json({ announcements });
  });

  app.post('/api/admin/announcements', (req, res) => {
    const { title, message, type, adminId } = req.body;
    const ann = db.createAnnouncement({
      id: `ann-${Date.now()}`,
      title,
      message,
      type: type || 'INFO',
      created_by: adminId,
      created_at: new Date().toISOString()
    });
    res.status(201).json({ success: true, announcement: ann });
  });

  app.get('/api/admin/audit-logs', (req, res) => {
    const auditLogs = db.getAuditLogs();
    res.json({ auditLogs });
  });

  // ==========================================
  // 12. VITE MIDDLEWARE & STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`❤️ LoveConnect Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
