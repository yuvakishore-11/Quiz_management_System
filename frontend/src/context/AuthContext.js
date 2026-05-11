import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { authAPI } from '../api/apiClient';

// ─────────────────────────────────────────────────────────────
// Context Creation
// ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  // Restore user from localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('quiz_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Restore tokens from localStorage
  const [tokens, setTokens] = useState(() => {
    const storedTokens = localStorage.getItem('quiz_tokens');
    return storedTokens ? JSON.parse(storedTokens) : null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ───────────────────────────────────────────────────────────
  // Persist auth state to localStorage
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (tokens) {
      localStorage.setItem('quiz_tokens', JSON.stringify(tokens));
    } else {
      localStorage.removeItem('quiz_tokens');
    }
  }, [tokens]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('quiz_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('quiz_user');
    }
  }, [user]);

  // ───────────────────────────────────────────────────────────
  // Restore session on refresh
  // ───────────────────────────────────────────────────────────
  // ───────────────────────────────────────────────────────────
// Restore session on refresh
// ───────────────────────────────────────────────────────────
useEffect(() => {
  const initializeAuth = async () => {
    // No tokens at all
    if (!tokens?.access && !tokens?.refresh) {
      setLoading(false);
      return;
    }

    try {
      let accessToken = tokens?.access;

      // Access token missing → refresh automatically
      if (!accessToken && tokens?.refresh) {
        const refreshed = await authAPI.refreshToken(
          tokens.refresh
        );

        accessToken = refreshed.access;

        const updatedTokens = {
          ...tokens,
          access: accessToken,
        };

        setTokens(updatedTokens);

        localStorage.setItem(
          'quiz_tokens',
          JSON.stringify(updatedTokens)
        );
      }

      // Fetch authenticated user
      const userData = await authAPI.getMe(accessToken);

      setUser(userData);

    } catch (err) {
      console.error('Session restore failed:', err);

      // Clear invalid session
      setTokens(null);
      setUser(null);

      localStorage.removeItem('quiz_tokens');
      localStorage.removeItem('quiz_user');

    } finally {
      setLoading(false);
    }
  };

  initializeAuth();

}, [tokens?.access, tokens?.refresh]);

  // ───────────────────────────────────────────────────────────
  // Login
  // ───────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null);

    try {
      const data = await authAPI.login(email, password);

      const newTokens = {
        access: data.access,
        refresh: data.refresh,
      };

      setTokens(newTokens);

      // Fetch authenticated user
      const userData = await authAPI.getMe(data.access);

      setUser(userData);

      return userData;
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Login failed. Please check your credentials.';

      setError(msg);

      throw new Error(msg);
    }
  }, []);

  // ───────────────────────────────────────────────────────────
  // Register
  // ───────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setError(null);

    try {
      const data = await authAPI.register(formData);

      setTokens(data.tokens);
      setUser(data.user);

      return data.user;
    } catch (err) {
      const msg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.detail ||
        'Registration failed.';

      setError(msg);

      throw new Error(msg);
    }
  }, []);

  // ───────────────────────────────────────────────────────────
  // Google OAuth Login
  // ───────────────────────────────────────────────────────────
  const googleLogin = useCallback(async (googleToken, role = 'student') => {
    setError(null);

    try {
      const data = await authAPI.googleAuth(googleToken, role);

      setTokens(data.tokens);
      setUser(data.user);

      return data.user;
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Google sign-in failed.';

      setError(msg);

      throw new Error(msg);
    }
  }, []);

  // ───────────────────────────────────────────────────────────
  // Logout
  // ───────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    setError(null);

    localStorage.removeItem('quiz_tokens');
    localStorage.removeItem('quiz_user');
  }, []);

  // ───────────────────────────────────────────────────────────
  // Refresh Access Token
  // ───────────────────────────────────────────────────────────
  const refreshAccessToken = useCallback(async () => {
    if (!tokens?.refresh) {
      logout();
      return null;
    }

    try {
      const data = await authAPI.refreshToken(tokens.refresh);

      const updatedTokens = {
        ...tokens,
        access: data.access,
      };

      setTokens(updatedTokens);

      return data.access;
    } catch (err) {
      console.error('Token refresh failed:', err);

      logout();

      return null;
    }
  }, [tokens, logout]);

  // ───────────────────────────────────────────────────────────
  // Derived State
  // ───────────────────────────────────────────────────────────
  const isAuthenticated = !!user && !!tokens;

  const isTeacher = user?.role === 'teacher';

  const isStudent = user?.role === 'student';

  // ───────────────────────────────────────────────────────────
  // Context Value
  // ───────────────────────────────────────────────────────────
  const value = {
    user,
    tokens,
    loading,
    error,

    isAuthenticated,
    isTeacher,
    isStudent,

    login,
    register,
    googleLogin,
    logout,
    refreshAccessToken,

    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// Custom Hook
// ─────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};

export default AuthContext;