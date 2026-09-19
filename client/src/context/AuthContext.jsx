import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('focuslearn_token');
      const storedUser = localStorage.getItem('focuslearn_user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify token is still valid
          const res = await authAPI.getMe();
          setUser(res.data.data.user);
          localStorage.setItem('focuslearn_user', JSON.stringify(res.data.data.user));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('focuslearn_token');
          localStorage.removeItem('focuslearn_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const res = await authAPI.login({ email, password });
      const { token, user: userData } = res.data.data;

      localStorage.setItem('focuslearn_token', token);
      localStorage.setItem('focuslearn_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      setError(null);
      const res = await authAPI.register({ name, email, password });
      const { token, user: userData } = res.data.data;

      localStorage.setItem('focuslearn_token', token);
      localStorage.setItem('focuslearn_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('focuslearn_token');
    localStorage.removeItem('focuslearn_user');
    setUser(null);
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
