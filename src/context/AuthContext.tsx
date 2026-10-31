import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserStats } from '../types.ts';
import { signInWithGoogle } from '../firebase.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  stats: UserStats | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { name?: string; bio?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  isSyncing: boolean;
  lastSynced: string | null;
  syncNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bashar_ai_token'));
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Fetch current user and stats
  const refreshUserData = async () => {
    const savedToken = localStorage.getItem('bashar_ai_token');
    if (!savedToken) {
      setUser(null);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setStats(data.stats);
        setLastSynced(new Date().toLocaleTimeString('bn-BD'));
      } else {
        // Token expired or invalid
        localStorage.removeItem('bashar_ai_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'লগইন করতে ব্যর্থ হয়েছে।' };
      }

      localStorage.setItem('bashar_ai_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setLastSynced(new Date().toLocaleTimeString('bn-BD'));
      await refreshUserData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'সার্ভারে সংযোগ করতে সমস্যা হয়েছে।' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'নিবন্ধন করতে ব্যর্থ হয়েছে।' };
      }

      localStorage.setItem('bashar_ai_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setLastSynced(new Date().toLocaleTimeString('bn-BD'));
      await refreshUserData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'সার্ভারে সংযোগ করতে সমস্যা হয়েছে।' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const gRes = await signInWithGoogle();
      if (gRes.error || !gRes.user) {
        return { success: false, error: gRes.error || 'গুগল সাইন-ইন সম্পন্ন হয়নি।' };
      }

      const gUser = gRes.user;
      const email = gUser.email || `${gUser.uid}@gmail.com`;
      const name = gUser.displayName || 'সম্মানিত ব্যবহারকারী';
      const password = `google_auth_${gUser.uid.slice(0, 16)}`;

      // Try login first
      let res = await login(email, password);
      if (!res.success) {
        // Register if new user
        res = await register(name, email, password);
        if (res.success && gUser.photoURL) {
          // Sync photo
          await updateProfile({ avatar: gUser.photoURL });
        }
      }

      return res;
    } catch (err: any) {
      console.error('loginWithGoogle failed:', err);
      return { success: false, error: 'গুগল সাইন-ইন করতে ব্যর্থ হয়েছে।' };
    }
  };

  const updateProfile = async (data: { name?: string; bio?: string; avatar?: string }) => {
    if (!token) return { success: false, error: 'অনুগ্রহ করে লগইন করুন।' };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        return { success: false, error: result.error || 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।' };
      }

      setUser(result.user);
      setLastSynced(new Date().toLocaleTimeString('bn-BD'));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'প্রোফাইল আপডেট ব্যর্থ হয়েছে।' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) return { success: false, error: 'অনুগ্রহ করে লগইন করুন।' };

    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();

      if (!res.ok) {
        return { success: false, error: result.error || 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' };
    }
  };

  const logout = () => {
    localStorage.removeItem('bashar_ai_token');
    setToken(null);
    setUser(null);
    setStats(null);
  };

  const syncNow = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setLastSynced(new Date().toLocaleTimeString('bn-BD'));
        await refreshUserData();
      }
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        stats,
        loading,
        login,
        register,
        loginWithGoogle,
        updateProfile,
        changePassword,
        logout,
        refreshUserData,
        isSyncing,
        lastSynced,
        syncNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
