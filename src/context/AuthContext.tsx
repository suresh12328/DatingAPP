import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, PrivacySettings } from '../types';
import { api } from '../lib/api';
import { store } from '../lib/storage';
import { signInWithGoogle, sendUserPasswordReset } from '../lib/firebase';

interface AuthContextType {
  currentUser: Profile;
  allUsers: Profile[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isEmailVerificationPending: boolean;
  verificationPendingEmail: string | null;
  latestVerificationCode: string | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; email_unverified?: boolean }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (profileData: Partial<Profile> & { email: string; password?: string; dob?: string; captcha_token?: string }) => Promise<{ success: boolean; error?: string; email_verification_required?: boolean }>;
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string; reset_code?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  cancelEmailVerification: () => void;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePrivacy: (privacyUpdates: Partial<PrivacySettings>) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile>(() => store.getCurrentUser());
  const [allUsers, setAllUsers] = useState<Profile[]>(() => store.getAllProfiles());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if token exists in localStorage
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('loveconnect_token');
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Email verification state
  const [isEmailVerificationPending, setIsEmailVerificationPending] = useState<boolean>(false);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);
  const [latestVerificationCode, setLatestVerificationCode] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    try {
      const users = await api.getUsers();
      if (users && users.length > 0) {
        setAllUsers(users);
        store.syncProfiles(users);
        const activeId = api.getActiveUserId();
        const me = users.find(u => u.id === activeId) || users[0];
        if (me) {
          setCurrentUser(me);
          store.setCurrentUserId(me.id);
        }
      }
    } catch {
      setAllUsers(store.getAllProfiles());
      setCurrentUser(store.getCurrentUser());
    }
  }, []);

  // Validate session on app launch
  useEffect(() => {
    const initAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('loveconnect_token') : null;
      if (token) {
        try {
          const session = await api.checkSession();
          if (session.success && session.user) {
            if (session.user.email_verified === false) {
              setVerificationPendingEmail(session.user.email);
              setIsEmailVerificationPending(true);
              setIsAuthenticated(false);
            } else {
              store.upsertProfile(session.user);
              setCurrentUser(session.user);
              store.setCurrentUserId(session.user.id);
              setIsAuthenticated(true);
            }
          } else if (session.email_unverified && session.user) {
            setVerificationPendingEmail(session.user.email);
            setIsEmailVerificationPending(true);
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(false);
          }
        } catch {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      await refreshUsers();
    };

    initAuth();
  }, [refreshUsers]);

  // Login
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string; email_unverified?: boolean }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim().toLowerCase(), password);
      if (res.success && res.user) {
        // Enforce: unverified accounts cannot access main app
        if (res.user.email_verified === false) {
          setVerificationPendingEmail(res.user.email);
          setIsEmailVerificationPending(true);
          setIsAuthenticated(false);
          setIsLoading(false);
          return {
            success: false,
            email_unverified: true,
            error: 'Your email address is not verified yet. Please verify to activate your account.'
          };
        }

        store.upsertProfile(res.user);
        setCurrentUser(res.user);
        store.setCurrentUserId(res.user.id);
        setIsAuthenticated(true);
        setIsEmailVerificationPending(false);
        setIsLoading(false);
        await refreshUsers();
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: 'Login failed. Please check your credentials.' };
    } catch (err: any) {
      setIsLoading(false);
      // Check if backend rejected due to unverified email
      if (err.payload && err.payload.email_unverified) {
        setVerificationPendingEmail(err.payload.email || email);
        if (err.payload.verification_code) {
          setLatestVerificationCode(err.payload.verification_code);
        }
        setIsEmailVerificationPending(true);
        setIsAuthenticated(false);
        return {
          success: false,
          email_unverified: true,
          error: err.payload.error || 'Please verify your email address to activate your account.'
        };
      }

      const msg = err.message || 'Login failed. Please check your email and password.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Google Sign-In ("Continue with Google")
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const googleResult = await signInWithGoogle();
      const emailLower = (googleResult.email || '').toLowerCase().trim();
      if (emailLower !== 'bohara.suresh8884@gmail.com') {
        setIsLoading(false);
        const errMsg = 'Google Workspace and Google account integration is reserved exclusively for system administrator Suresh Bohara. Normal users must sign in or register with email and password.';
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      const res = await api.googleAuth({
        email: googleResult.email,
        full_name: googleResult.displayName,
        avatar_url: googleResult.photoURL,
        google_uid: googleResult.user.uid
      });

      if (res.success && res.user) {
        store.upsertProfile(res.user);
        setCurrentUser(res.user);
        store.setCurrentUserId(res.user.id);
        setIsAuthenticated(true);
        setIsEmailVerificationPending(false);
        setIsLoading(false);
        await refreshUsers();
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: 'Failed to authenticate with Google.' };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || 'Google sign-in was cancelled or failed.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Signup / Register with Age Check, Hashed Password, Email Verification
  const register = async (data: Partial<Profile> & { email: string; password?: string; dob?: string; captcha_token?: string }): Promise<{ success: boolean; error?: string; email_verification_required?: boolean }> => {
    setIsLoading(true);
    setError(null);

    // 18+ Age Verification Check
    if (data.age && data.age < 18) {
      setIsLoading(false);
      return { success: false, error: 'Age verification failed: You must be at least 18 years old to join LoveConnect.' };
    }

    try {
      const res = await api.register(data);
      if (res.success && res.user) {
        store.upsertProfile(res.user);
        // Enforce user verifies email before account activation and app access
        setVerificationPendingEmail(res.user.email);
        if (res.verification_code) {
          setLatestVerificationCode(res.verification_code);
        }
        setIsEmailVerificationPending(true);
        setIsAuthenticated(false); // Not active until email verified!
        setIsLoading(false);
        return {
          success: true,
          email_verification_required: true
        };
      }
      setIsLoading(false);
      return { success: false, error: 'Registration failed.' };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || 'Registration failed. Please check your inputs.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Verify Email Code
  const verifyEmail = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!verificationPendingEmail) {
      return { success: false, error: 'No verification pending.' };
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.verifyEmail(verificationPendingEmail, code);
      if (res.success && res.user) {
        store.upsertProfile(res.user);
        setCurrentUser(res.user);
        store.setCurrentUserId(res.user.id);
        setIsAuthenticated(true);
        setIsEmailVerificationPending(false);
        setVerificationPendingEmail(null);
        setLatestVerificationCode(null);
        setIsLoading(false);
        await refreshUsers();
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: 'Verification failed.' };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || 'Invalid verification code.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Resend Email Verification
  const resendVerification = async (emailOverride?: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    const targetEmail = emailOverride || verificationPendingEmail;
    if (!targetEmail) {
      return { success: false, error: 'No email address specified.' };
    }

    try {
      const res = await api.resendVerification(targetEmail);
      if (res.verification_code) {
        setLatestVerificationCode(res.verification_code);
      }
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend verification code.' };
    }
  };

  // Forgot Password
  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string; message?: string; reset_code?: string }> => {
    try {
      // Also trigger Firebase password reset in parallel if configured
      sendUserPasswordReset(email).catch(() => {});

      const res = await api.forgotPassword(email);
      return {
        success: true,
        message: res.message,
        reset_code: res.reset_code
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset.' };
    }
  };

  // Reset Password
  const resetPassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const res = await api.resetPassword(email, code, newPassword);
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to reset password.' };
    }
  };

  const cancelEmailVerification = () => {
    setIsEmailVerificationPending(false);
    setVerificationPendingEmail(null);
    setLatestVerificationCode(null);
  };

  // Logout
  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setIsAuthenticated(false);
    setIsEmailVerificationPending(false);
    setVerificationPendingEmail(null);
    setLatestVerificationCode(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loveconnect_token');
    }
  };

  const switchUser = (_userId?: string) => {
    const u = store.getCurrentUser();
    if (u) {
      api.setActiveUserId(u.id);
      store.setCurrentUserId(u.id);
      setCurrentUser(u);
      setIsAuthenticated(true);
      setIsEmailVerificationPending(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const updatedLocal = { ...currentUser, ...updates };
    setCurrentUser(updatedLocal);
    
    // Safely update or upsert in client store without throwing
    try {
      store.updateProfile(currentUser.id, updates);
    } catch (storeErr) {
      console.warn('Local store update fallback:', storeErr);
      store.upsertProfile(updatedLocal);
    }

    try {
      const updated = await api.updateUser(currentUser.id, updates);
      if (updated) {
        setCurrentUser(updated);
        store.upsertProfile(updated);
      }
      await refreshUsers();
    } catch (err) {
      console.warn('Server sync notice:', err);
    }
  };

  const updatePrivacy = async (privacyUpdates: Partial<PrivacySettings>) => {
    const newPrivacy = { ...currentUser.privacy, ...privacyUpdates };
    await updateProfile({ privacy: newPrivacy });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isAuthenticated,
        isLoading,
        error,
        isEmailVerificationPending,
        verificationPendingEmail,
        latestVerificationCode,
        login,
        loginWithGoogle,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        cancelEmailVerification,
        logout,
        switchUser,
        updateProfile,
        updatePrivacy,
        refreshUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
