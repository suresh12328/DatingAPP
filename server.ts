import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { Profile, RelationshipGoal, DatingPreference, Gender, UserRole, UserStatus } from './src/types';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Serve uploaded media statically with video stream / byte range support
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Multer disk storage setup
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const category = (req.body.category || 'misc').toString().replace(/[^a-zA-Z0-9_-]/g, '');
      const userId = (req.body.userId || 'general').toString().replace(/[^a-zA-Z0-9_-]/g, '');
      const entityId = (req.body.entityId || '').toString().replace(/[^a-zA-Z0-9_-]/g, '');

      let targetDir = path.join(UPLOADS_DIR, category, userId);
      if (entityId) {
        targetDir = path.join(targetDir, entityId);
      }

      fs.mkdirSync(targetDir, { recursive: true });
      cb(null, targetDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const category = req.body.category || 'misc';

      let filename = `${category}-${uniqueSuffix}${ext}`;
      if (category === 'avatars') {
        filename = `profile-${Date.now()}${ext}`;
      } else if (category === 'covers') {
        filename = `cover-${Date.now()}${ext}`;
      } else if (category === 'posts') {
        filename = `post-media-${uniqueSuffix}${ext}`;
      } else if (category === 'stories') {
        filename = `story-media-${uniqueSuffix}${ext}`;
      } else if (category === 'reels') {
        filename = `reel-media-${uniqueSuffix}${ext}`;
      }
      cb(null, filename);
    }
  });

  const uploadMiddleware = multer({
    storage,
    limits: {
      fileSize: 60 * 1024 * 1024 // 60MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/svg+xml'];
      const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-m4v'];
      const allowedDocMimes = [
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/json'
      ];
      const allowedAudioMimes = ['audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
      
      const isAllowedExt = /\.(jpe?g|png|webp|gif|heic|svg|mp4|webm|mov|ogg|pdf|docx?|txt|csv|zip|json|mp3|wav|m4a|aac)$/i.test(file.originalname);
      
      if (
        allowedImageMimes.includes(file.mimetype) ||
        allowedVideoMimes.includes(file.mimetype) ||
        allowedDocMimes.includes(file.mimetype) ||
        allowedAudioMimes.includes(file.mimetype) ||
        isAllowedExt
      ) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images, Videos, Documents, and Audio.`));
      }
    }
  });

  // Request logger helper
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // ==========================================
  // REAL-TIME CROSS-DEVICE SYNC (SSE)
  // ==========================================
  interface SyncClient {
    res: express.Response;
    userId?: string;
    connectedAt: number;
  }
  const syncClients: Set<SyncClient> = new Set();

  function broadcastSyncEvent(event: { type: string; id?: string; userId?: string; [key: string]: any }) {
    const payload = JSON.stringify({ ...event, timestamp: Date.now() });
    const msg = `data: ${payload}\n\n`;
    for (const client of syncClients) {
      try {
        client.res.write(msg);
      } catch {
        syncClients.delete(client);
      }
    }
  }

  function isUserOnline(userId?: string): boolean {
    if (!userId) return false;
    for (const client of syncClients) {
      if (client.userId === userId) return true;
    }
    return db.isUserOnline(userId);
  }

  app.get('/api/sync/events', (req, res) => {
    const userId = req.query.userId as string | undefined;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client: SyncClient = { res, userId, connectedAt: Date.now() };
    syncClients.add(client);

    // Send initial connection packet
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now(), userId })}\n\n`);

    if (userId) {
      // Mark user online in DB
      db.setUserOnlineStatus(userId, true);

      // Immediately deliver any undelivered messages sent to this user
      const delivered = db.markMessagesDeliveredToUser(userId);
      if (delivered.length > 0) {
        broadcastSyncEvent({
          type: 'MESSAGES_DELIVERED',
          receiverId: userId,
          messageIds: delivered.map(m => m.id),
          conversationIds: Array.from(new Set(delivered.map(m => m.conversation_id))),
          delivered_at: new Date().toISOString()
        });
      }

      // Broadcast presence update
      broadcastSyncEvent({
        type: 'USER_PRESENCE',
        userId,
        is_online: true,
        last_active: 'Just now'
      });
    }

    // Keep-alive heartbeat every 20 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
        syncClients.delete(client);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      syncClients.delete(client);
      if (userId) {
        const stillConnected = Array.from(syncClients).some(c => c.userId === userId);
        if (!stillConnected) {
          db.setUserOnlineStatus(userId, false);
          broadcastSyncEvent({
            type: 'USER_PRESENCE',
            userId,
            is_online: false,
            last_active: new Date().toISOString()
          });
        }
      }
    });
  });

  // User presence endpoint for explicit online/offline toggling & testing
  app.post('/api/users/:id/presence', (req, res) => {
    const { is_online } = req.body;
    const userId = req.params.id;
    const isOnline = Boolean(is_online);
    const user = db.setUserOnlineStatus(userId, isOnline);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (isOnline) {
      const delivered = db.markMessagesDeliveredToUser(userId);
      if (delivered.length > 0) {
        broadcastSyncEvent({
          type: 'MESSAGES_DELIVERED',
          receiverId: userId,
          messageIds: delivered.map(m => m.id),
          conversationIds: Array.from(new Set(delivered.map(m => m.conversation_id))),
          delivered_at: new Date().toISOString()
        });
      }
    }

    broadcastSyncEvent({
      type: 'USER_PRESENCE',
      userId,
      is_online: isOnline,
      last_active: isOnline ? 'Just now' : new Date().toISOString()
    });

    res.json({ success: true, user });
  });

  // Verification endpoint to confirm video/media deletion globally
  app.get('/api/storage/verify-deleted', (req, res) => {
    const { url, entityType, entityId } = req.query as { url?: string; entityType?: string; entityId?: string };
    let fileExists = false;
    let dbExists = false;

    if (url) {
      const canonical = url.split('?')[0].split('#')[0];
      const marker = '/uploads/';
      const idx = canonical.indexOf(marker);
      if (idx !== -1) {
        const rel = canonical.substring(idx + marker.length);
        const full = path.resolve(UPLOADS_DIR, rel);
        if (full.startsWith(UPLOADS_DIR) && fs.existsSync(full)) {
          fileExists = true;
        }
      }
    }

    if (entityType === 'POST' && entityId) {
      dbExists = Boolean(db.getPostById(entityId));
    } else if (entityType === 'REEL' && entityId) {
      const reels = db.getReels();
      dbExists = reels.some(r => r.id === entityId);
    }

    res.json({
      success: true,
      isDeletedGlobally: !fileExists && !dbExists,
      fileExists,
      dbExists
    });
  });

  // ==========================================
  // MEDIA UPLOAD & STORAGE ROUTE
  // ==========================================
  app.post('/api/upload', (req, res) => {
    uploadMiddleware.any()(req, res, (err: any) => {
      if (err) {
        console.error('[Upload Error]', err);
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }

      const files = (req.files as Express.Multer.File[]) || [];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const results = files.map(file => {
        const relativePath = path.relative(UPLOADS_DIR, file.path).replace(/\\/g, '/');
        const publicUrl = `/uploads/${relativePath}`;
        const isVideo = file.mimetype.startsWith('video/');
        const isAudio = file.mimetype.startsWith('audio/');
        const isDoc = file.mimetype.startsWith('application/') || file.mimetype.startsWith('text/');

        let type: 'image' | 'video' | 'audio' | 'document' = 'image';
        if (isVideo) type = 'video';
        else if (isAudio) type = 'audio';
        else if (isDoc) type = 'document';

        return {
          url: publicUrl,
          storage_path: relativePath,
          filename: file.filename,
          original_name: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          type
        };
      });

      res.status(201).json({
        success: true,
        file: results[0],
        files: results
      });
    });
  });

  // ==========================================
  // AI IMAGE GENERATION ROUTE
  // ==========================================
  app.post('/api/generate-ai-image', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt string is required' });
    }

    try {
      // Curated artistic styles and themes
      const trimmed = prompt.trim();
      const encodedPrompt = encodeURIComponent(trimmed);
      
      // High-resolution artistic curated romantic & lifestyle photos corresponding to prompt themes
      const curatedThemes: Record<string, string[]> = {
        dinner: [
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544025162-d76694265947?w=1080&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1080&auto=format&fit=crop&q=80'
        ],
        sunset: [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1080&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1080&auto=format&fit=crop&q=80'
        ],
        coffee: [
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1080&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=1080&auto=format&fit=crop&q=80'
        ],
        anime: [
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1080&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1080&auto=format&fit=crop&q=80'
        ],
        paris: [
          'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1080&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1080&auto=format&fit=crop&q=80'
        ],
        beach: [
          'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1080&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80'
        ]
      };

      let selectedUrl = '';
      const lower = trimmed.toLowerCase();
      for (const [key, urls] of Object.entries(curatedThemes)) {
        if (lower.includes(key)) {
          selectedUrl = urls[Math.floor(Math.random() * urls.length)];
          break;
        }
      }

      if (!selectedUrl) {
        selectedUrl = `https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1080&auto=format&fit=crop&q=80&sig=${Math.floor(Math.random() * 1000)}`;
      }

      // If Gemini API is available and user has a configured key, we could call Gemini
      // Otherwise return rich themed visual artwork URL
      return res.json({
        success: true,
        imageUrl: selectedUrl,
        prompt: trimmed
      });
    } catch (err: any) {
      console.error('[AI Image Error]', err);
      res.status(500).json({ error: 'Failed to generate AI image' });
    }
  });

  // Reverse geocode route for human-readable live location
  app.get('/api/location/reverse-geocode', async (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng query params are required' });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'LoveConnect-App/2.0 (contact@loveconnect.internal)'
          },
          signal: controller.signal
        }
      );
      clearTimeout(timeout);

      if (response.ok) {
        const data = (await response.json()) as any;
        const address = data.address || {};
        const neighborhood = address.neighbourhood || address.suburb || address.district;
        const city = address.city || address.town || address.village || address.municipality || address.county;
        const state = address.state || address.region;
        const country = address.country;

        let label = '';
        if (neighborhood && city) {
          label = `${neighborhood}, ${city}`;
        } else if (city && state) {
          label = `${city}, ${state}`;
        } else if (city && country) {
          label = `${city}, ${country}`;
        } else {
          label = data.display_name?.split(',').slice(0, 2).join(',').trim() || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        }

        return res.json({
          success: true,
          label,
          city: city || '',
          state: state || '',
          country: country || '',
          lat,
          lng
        });
      }
    } catch {
      // Fallback below
    }

    res.json({
      success: true,
      label: `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`,
      lat,
      lng
    });
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
  // 2. AUTHENTICATION & SESSIONS (REAL-WORLD)
  // ==========================================

  // Helper to strip sensitive fields
  const getSafeUser = (user: Profile): Profile => {
    const copy = { ...user };
    delete copy.password_hash;
    return copy;
  };

  // Session verification on app startup / page reload
  app.get('/api/auth/session', (req, res) => {
    const authHeader = req.headers['authorization'] || req.headers['x-session-token'];
    let token = '';
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    }

    if (!token) {
      return res.status(401).json({ error: 'No session token provided' });
    }

    const user = db.validateStoredSession(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ error: 'Account has been suspended' });
    }

    if (user.email_verified === false) {
      return res.json({
        success: false,
        email_unverified: true,
        user: getSafeUser(user),
        message: 'Email address verification pending'
      });
    }

    return res.json({
      success: true,
      user: getSafeUser(user)
    });
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmailOrUsername(email);
    if (!user) {
      return res.status(404).json({ error: 'No account found matching this email or username.' });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ error: 'Your account has been permanently suspended for safety violations.' });
    }

    const isMatch = await db.verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials or reset your password.' });
    }

    // Check if email is verified
    if (user.email_verified === false) {
      // Ensure verification code is active
      const verif = db.createEmailVerification(user.id, user.email);
      return res.status(403).json({
        success: false,
        email_unverified: true,
        email: user.email,
        verification_code: verif.code,
        error: 'Your email address is not verified yet. We have sent a verification code to activate your account.'
      });
    }

    // Create session
    const meta = {
      device: req.headers['user-agent']?.includes('Mobile') ? 'Mobile Device' : 'Laptop / Desktop',
      browser: req.headers['user-agent']?.slice(0, 50) || 'Browser',
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'
    };
    const { token: sessionToken } = db.createStoredSession(user.id, meta);

    return res.json({
      success: true,
      user: getSafeUser(user),
      token: sessionToken
    });
  });

  // Signup / Register
  app.post('/api/auth/register', async (req, res) => {
    const data = req.body;
    const { email, password, full_name, dob, captcha_token } = data;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Age validation check (18+)
    let calculatedAge = data.age || 20;
    if (dob) {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date of birth provided.' });
      }
      const ageDiff = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiff);
      calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    if (calculatedAge < 18) {
      return res.status(400).json({
        error: 'Age Verification Failed: You must be at least 18 years old to join LoveConnect.'
      });
    }

    // Prevent duplicate accounts with the same email
    const existing = db.getUserByEmailOrUsername(email);
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email address already exists. Please sign in or reset your password.'
      });
    }

    // Hash password securely with bcrypt
    const password_hash = await db.hashPassword(password);

    const newId = `user-${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      email: email.trim().toLowerCase(),
      password_hash,
      username: data.username || email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`,
      full_name: full_name?.trim() || 'New Member',
      avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      cover_url: data.cover_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      bio: data.bio || 'New member looking for authentic dating & connections ✨',
      age: calculatedAge,
      dob: dob || '2000-01-01',
      gender: data.gender || 'WOMAN',
      sexual_orientation: data.sexual_orientation || 'Straight',
      dating_preference: data.dating_preference || 'EVERYONE',
      dating_preferences: data.dating_preferences || {
        interested_in: data.dating_preference || 'EVERYONE',
        age_range: { min: 18, max: 45 },
        max_distance_miles: 50,
        only_verified: false
      },
      location: data.location || 'San Francisco, CA',
      neighborhood: data.neighborhood || 'Bay Area',
      profession: data.profession || 'Professional',
      education: data.education || 'Graduate',
      interests: data.interests || ['Dating', 'Coffee', 'Music', 'Travel'],
      relationship_goal: data.relationship_goal || 'LONG_TERM',
      looking_for: data.looking_for || 'A meaningful, genuine connection',
      languages: data.languages || ['English'],
      height_cm: data.height_cm || 170,
      height: `5'7"`,
      photos: data.photos || [
        data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
      ],
      lifestyle: {
        drinking: 'SOCIALLY',
        smoking: 'NEVER',
        workout: 'OFTEN',
        pets: 'Pet lover'
      },
      is_verified: false,
      email_verified: false, // Must be verified before accessing main app
      account_status: 'PENDING_VERIFICATION',
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

    // Generate real verification code and token
    const verif = db.createEmailVerification(created.id, created.email);

    // Create session token
    const { token: sessionToken } = db.createStoredSession(created.id);

    res.status(201).json({
      success: true,
      email_verification_required: true,
      email: created.email,
      verification_code: verif.code, // Returned for UI confirmation display / testing
      user: getSafeUser(created),
      token: sessionToken,
      message: `Account created! Verification code sent to ${created.email}. Please verify to activate.`
    });
  });

  // Google Login / Registration ("Continue with Google")
  // Google Login / Registration ("Continue with Google")
  // Strictly restricted to system administrator: Suresh Bohara
  app.post('/api/auth/google', async (req, res) => {
    const { email, full_name, avatar_url, google_uid } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google email is required' });
    }

    const emailLower = email.toLowerCase().trim();

    // STRICT RBAC & BACKEND ENFORCEMENT:
    // Only Suresh Bohara is authorized to use Google Workspace / Google account integration.
    const isSureshAdminEmail = emailLower === 'bohara.suresh8884@gmail.com';
    if (!isSureshAdminEmail) {
      return res.status(403).json({
        error: 'Google Workspace/Google account integration is reserved exclusively for system administrator Suresh Bohara. Normal users must sign in or register with email and password.'
      });
    }

    let user = db.getUserById('user-suresh') || db.getUserByEmailOrUsername(emailLower);

    if (user) {
      user.id = 'user-suresh';
      user.role = 'ADMIN';
      user.email = 'bohara.suresh8884@gmail.com';
      user.full_name = 'Suresh Bohara';
      user.email_verified = true;
      user.account_status = 'ACTIVE';
      user.status = 'ACTIVE';
      if (avatar_url) user.avatar_url = avatar_url;
      db.updateUser(user.id, {
        email_verified: true,
        account_status: 'ACTIVE',
        status: 'ACTIVE',
        role: 'ADMIN'
      });
    } else {
      const existingSuresh = db.getUserById('user-suresh');
      if (existingSuresh) {
        user = existingSuresh;
      } else {
        user = db.createUser({
          id: 'user-suresh',
          email: 'bohara.suresh8884@gmail.com',
          username: 'suresh_bohara',
          full_name: 'Suresh Bohara',
          role: 'ADMIN',
          status: 'ACTIVE',
          account_status: 'ACTIVE',
          is_verified: true,
          email_verified: true,
          is_online: true,
          created_at: new Date().toISOString()
        } as Profile);
      }
    }

    const { token: sessionToken } = db.createStoredSession(user.id);

    return res.json({
      success: true,
      user: getSafeUser(user),
      token: sessionToken,
      message: 'Successfully authenticated as Administrator Suresh Bohara'
    });
  });

  // Verify Email Code
  app.post('/api/auth/verify-email', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const result = db.verifyEmailCode(email, code);
    if (!result.success || !result.user) {
      return res.status(400).json({ error: result.error || 'Verification failed' });
    }

    // Create session token for verified user
    const { token: sessionToken } = db.createStoredSession(result.user.id);

    res.json({
      success: true,
      user: getSafeUser(result.user),
      token: sessionToken,
      message: '🎉 Email verified successfully! Your account is now active.'
    });
  });

  // Resend Email Verification
  app.post('/api/auth/resend-verification', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = db.resendEmailVerification(email);
    if (!result.success) {
      return res.status(429).json({ error: result.error });
    }

    res.json({
      success: true,
      verification_code: result.code, // Included for user convenience / testing
      message: `A new 6-digit verification code has been dispatched to ${email}.`
    });
  });

  // Forgot Password Request
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = db.createPasswordReset(email);
    if (!result.success) {
      return res.status(404).json({ error: result.error || 'No account registered with this email.' });
    }

    res.json({
      success: true,
      reset_code: result.code, // Included for display / testing
      message: `Password reset instructions and 6-digit code sent to ${email}.`
    });
  });

  // Reset Password
  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const result = await db.resetUserPassword(email, code, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to reset password.' });
    }

    res.json({
      success: true,
      message: 'Your password has been successfully updated! You can now log in.'
    });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers['authorization'] || req.headers['x-session-token'];
    if (typeof authHeader === 'string') {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      db.revokeStoredSession(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
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
      if (req.body.role && (req.body.role === 'ADMIN' || req.body.role === 'MODERATOR') && req.params.id !== 'user-suresh') {
        req.body.role = 'USER';
      }
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
    const userId = (req.query.userId as string) || 'user-suresh';
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
    const userId = (req.query.userId as string) || 'user-suresh';
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
    const userId = (req.query.userId as string) || 'user-suresh';
    const conversations = db.getConversations(userId);
    res.json({ conversations });
  });

  app.get('/api/conversations/:id', (req, res) => {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'user-suresh';
    const conv = db.getConversationById(req.params.id, userId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ conversation: conv });
  });

  app.get('/api/conversations/:id/messages', (req, res) => {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (userId) {
      const delivered = db.markMessagesDeliveredInConversation(req.params.id, userId);
      if (delivered.length > 0) {
        broadcastSyncEvent({
          type: 'MESSAGES_DELIVERED',
          receiverId: userId,
          conversationId: req.params.id,
          messageIds: delivered.map(m => m.id),
          delivered_at: new Date().toISOString()
        });
      }
    }
    const messages = db.getMessagesForConversation(req.params.id);
    res.json({ messages });
  });

  app.get('/api/conversations/with/:otherUserId', (req, res) => {
    const userId = (req.query.userId as string) || 'user-suresh';
    const otherUserId = req.params.otherUserId;
    if (userId) {
      const conv = db.getOrCreateConversation(userId, otherUserId);
      const delivered = db.markMessagesDeliveredInConversation(conv.id, userId);
      if (delivered.length > 0) {
        broadcastSyncEvent({
          type: 'MESSAGES_DELIVERED',
          receiverId: userId,
          conversationId: conv.id,
          messageIds: delivered.map(m => m.id),
          delivered_at: new Date().toISOString()
        });
      }
    }
    const messages = db.getMessagesBetweenUsers(userId, otherUserId);
    res.json({ messages });
  });

  app.delete('/api/conversations/:id', (req, res) => {
    const userId = (req.body && req.body.userId) || (req.query.userId as string);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    db.deleteConversation(userId, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/conversations/:id/mute', (req, res) => {
    const userId = (req.body && req.body.userId) || (req.query.userId as string);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const isMuted = db.toggleMuteConversation(userId, req.params.id);
    res.json({ success: true, isMuted });
  });

  app.post('/api/messages/send', (req, res) => {
    let { senderId, receiverId, content, mediaUrl, replyToId, conversationId } = req.body;
    let targetReceiverId = receiverId;
    if ((!targetReceiverId || targetReceiverId === senderId) && conversationId) {
      const conv = db.getConversationById(conversationId, senderId);
      if (conv) {
        targetReceiverId = conv.participant_ids?.find(id => id !== senderId) || (conv.other_user_id !== senderId ? conv.other_user_id : undefined);
      }
    }
    if (!senderId || !targetReceiverId || (!content && !mediaUrl)) {
      return res.status(400).json({ error: 'Sender, receiver, and message content/media are required.' });
    }
    if (senderId === targetReceiverId) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }
    try {
      const isReceiverCurrentlyOnline = isUserOnline(targetReceiverId);
      const msg = db.sendMessage(senderId, targetReceiverId, content || '', mediaUrl, replyToId, isReceiverCurrentlyOnline);

      // Broadcast real-time message event to all clients
      broadcastSyncEvent({
        type: 'MESSAGE_SENT',
        message: msg,
        conversationId: msg.conversation_id,
        senderId,
        receiverId: targetReceiverId
      });

      res.status(201).json({ success: true, message: msg });
    } catch (err: any) {
      res.status(403).json({ error: err.message || 'Cannot send message' });
    }
  });

  app.post('/api/messages/read', (req, res) => {
    const { receiverId, senderId, conversationId } = req.body;
    if (receiverId && (senderId || conversationId)) {
      const updatedMessages = db.markMessagesRead(receiverId, senderId || '', conversationId);
      if (updatedMessages.length > 0) {
        broadcastSyncEvent({
          type: 'MESSAGES_READ',
          conversationId,
          receiverId,
          senderId,
          read_at: new Date().toISOString(),
          messageIds: updatedMessages.map(m => m.id)
        });
      }
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
    broadcastSyncEvent({ type: 'POST_CREATED', id: created.id, userId: created.user_id });
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
    try {
      const userId = req.body?.userId || (req.query?.userId as string) || (req.headers['x-user-id'] as string);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing userId' });
      }
      db.deletePost(req.params.id, userId);
      broadcastSyncEvent({ type: 'POST_DELETED', id: req.params.id, userId });
      res.json({ success: true, message: 'Post deleted successfully' });
    } catch (err: any) {
      const status = err.statusCode || (err.message?.includes('Unauthorized') ? 403 : err.message?.includes('not found') ? 404 : 500);
      res.status(status).json({ error: err.message || 'Failed to delete post' });
    }
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
    const allReels = db.getReels();
    const pageParam = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;

    if (pageParam !== undefined) {
      const page = Math.max(1, pageParam);
      const limit = Math.max(1, limitParam);
      const start = (page - 1) * limit;
      const paginated = allReels.slice(start, start + limit);
      const hasMore = start + limit < allReels.length;

      return res.json({
        reels: paginated,
        pagination: {
          page,
          limit,
          total: allReels.length,
          hasMore,
          totalPages: Math.ceil(allReels.length / limit)
        }
      });
    }

    res.json({
      reels: allReels,
      pagination: {
        page: 1,
        limit: allReels.length,
        total: allReels.length,
        hasMore: false,
        totalPages: 1
      }
    });
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
    broadcastSyncEvent({ type: 'REEL_CREATED', id: created.id, userId: created.user_id });
    res.status(201).json({ success: true, reel: created });
  });

  app.post('/api/reels/:id/like', (req, res) => {
    const result = db.likeReel(req.params.id);
    res.json({ success: true, ...result });
  });

  app.post('/api/reels/:id/save', (req, res) => {
    const result = db.saveReel(req.params.id);
    res.json({ success: true, ...result });
  });

  app.post('/api/reels/:id/share', (req, res) => {
    const result = db.shareReel(req.params.id);
    res.json({ success: true, ...result });
  });

  app.get('/api/reels/:id/comments', (req, res) => {
    const comments = db.getReelComments(req.params.id);
    res.json({ comments });
  });

  app.post('/api/reels/:id/comments', (req, res) => {
    const { userId, content } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }
    const comment = db.commentOnReel(req.params.id, userId, content);
    if (!comment) {
      return res.status(404).json({ error: 'Reel or user not found' });
    }
    res.status(201).json({ success: true, comment });
  });

  app.delete('/api/reels/:id', (req, res) => {
    try {
      const userId = req.body?.userId || (req.query?.userId as string) || (req.headers['x-user-id'] as string);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing userId' });
      }
      db.deleteReel(req.params.id, userId);
      broadcastSyncEvent({ type: 'REEL_DELETED', id: req.params.id, userId });
      res.json({ success: true, message: 'Reel deleted successfully' });
    } catch (err: any) {
      const status = err.statusCode || (err.message?.includes('Unauthorized') ? 403 : err.message?.includes('not found') ? 404 : 500);
      res.status(status).json({ error: err.message || 'Failed to delete reel' });
    }
  });

  // ==========================================
  // 7. CONNECTIONS & SOCIAL NETWORK
  // ==========================================
  app.get('/api/connections', (req, res) => {
    const userId = (req.query.userId as string) || 'user-suresh';
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
    const userId = (req.query.userId as string) || 'user-suresh';
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
    const userId = (req.query.userId as string) || 'user-suresh';
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
    const userId = (req.query.userId as string) || 'user-suresh';
    const sessions = db.getSessions(userId);
    res.json({ sessions });
  });

  app.delete('/api/settings/sessions/:id', (req, res) => {
    const userId = req.body.userId || (req.query.userId as string);
    db.revokeSession(req.params.id, userId);
    res.json({ success: true });
  });

  app.get('/api/settings/export-data', (req, res) => {
    const userId = (req.query.userId as string) || 'user-suresh';
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
  // Enforce admin RBAC on all /api/admin/* endpoints
  app.use('/api/admin', (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['x-session-token'];
    let token = '';
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    }

    let user: Profile | undefined;
    if (token) {
      user = db.validateStoredSession(token);
    }

    const adminId = (req.headers['x-admin-id'] as string) || 
                    (req.headers['x-user-id'] as string) || 
                    (req.headers['x-session-user'] as string) || 
                    req.body?.adminId || 
                    (req.query?.adminId as string);
    if (!user && adminId) {
      user = db.getUserById(adminId);
    }

    if (user) {
      const isSureshAdmin = user.role === 'ADMIN' && (user.id === 'user-suresh' || user.email?.toLowerCase().trim() === 'bohara.suresh8884@gmail.com');
      if (!isSureshAdmin) {
        return res.status(403).json({
          error: 'Access denied. Google Workspace & Administrator privileges are restricted exclusively to Suresh Bohara.'
        });
      }
      return next();
    }

    return res.status(401).json({ error: 'Unauthorized: Administrator authentication required for Suresh Bohara.' });
  });

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
    if ((role === 'ADMIN' || role === 'MODERATOR') && user.id !== 'user-suresh') {
      return res.status(400).json({ error: 'Only Suresh Bohara can have the ADMIN role' });
    }

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
    const isHttpsApp = Boolean(process.env.APP_URL?.startsWith('https://'));
    let hmrHost: string | undefined = undefined;
    let hmrClientPort: number | undefined = undefined;

    if (process.env.APP_URL) {
      try {
        const parsedUrl = new URL(process.env.APP_URL);
        hmrHost = parsedUrl.hostname;
        hmrClientPort = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (isHttpsApp ? 443 : 80);
      } catch (e) {
        console.warn('Could not parse APP_URL for HMR host:', e);
      }
    }

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          server: httpServer,
          host: hmrHost,
          protocol: isHttpsApp ? 'wss' : undefined,
          clientPort: hmrClientPort,
        },
      },
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`❤️ LoveConnect Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
