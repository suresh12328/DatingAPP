import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, PrivacySettings } from '../types';
import { api } from '../lib/api';
import { store } from '../lib/storage';

interface AuthContextType {
  currentUser: Profile;
  allUsers: Profile[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (profileData: Partial<Profile> & { email: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePrivacy: (privacyUpdates: Partial<PrivacySettings>) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile>(store.getCurrentUser());
  const [allUsers, setAllUsers] = useState<Profile[]>(store.getAllProfiles());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    try {
      const users = await api.getUsers();
      if (users && users.length > 0) {
        setAllUsers(users);
        const me = users.find(u => u.id === api.getActiveUserId()) || users[0];
        if (me) {
          setCurrentUser(me);
          store.setCurrentUserId(me.id);
        }
      }
    } catch {
      // Fallback to local store
      setAllUsers(store.getAllProfiles());
      setCurrentUser(store.getCurrentUser());
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        store.setCurrentUserId(res.user.id);
        setIsAuthenticated(true);
        setIsLoading(false);
        await refreshUsers();
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      // Try local fallback matching
      const matched = allUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === email.toLowerCase()
      );
      if (matched) {
        api.setActiveUserId(matched.id);
        store.setCurrentUserId(matched.id);
        setCurrentUser(matched);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      const msg = err.message || 'User not found. Please verify email or create a new account.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (data: Partial<Profile> & { email: string; password?: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    // 18+ check
    if (data.age && data.age < 18) {
      setIsLoading(false);
      return { success: false, error: 'You must be at least 18 years old to join LoveConnect.' };
    }

    try {
      const res = await api.register(data);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        store.setCurrentUserId(res.user.id);
        setIsAuthenticated(true);
        setIsLoading(false);
        await refreshUsers();
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: 'Registration failed.' };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || 'Registration failed. Please check inputs.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const switchUser = (userId: string) => {
    api.setActiveUserId(userId);
    store.setCurrentUserId(userId);
    const u = allUsers.find(user => user.id === userId) || store.getProfileById(userId);
    if (u) {
      setCurrentUser(u);
      setIsAuthenticated(true);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    // Optimistic UI update
    setCurrentUser(prev => ({ ...prev, ...updates }));
    store.updateProfile(currentUser.id, updates);
    try {
      const updated = await api.updateUser(currentUser.id, updates);
      setCurrentUser(updated);
      await refreshUsers();
    } catch (err) {
      console.error('Failed to sync profile update with server:', err);
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
        login,
        register,
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
