import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSessionExpired = () => setSessionExpired(false);

  const getHeaders = (customHeaders = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/sessions/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.accessToken);

        const profileRes = await fetch(`${API_URL}/api/auth/users/me`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.accessToken}`,
          },
        });
        const profileData = await profileRes.json();
        if (profileData.success) {
          setUser(profileData.user);
          setSessionExpired(false);
        }
      } else {
        if (token) {
          setUser(null);
          setToken(null);
          setSessionExpired(true);
        }
      }
    } catch (error) {
      console.log('Silent token refresh failed or no active session.');
      if (token) {
        setUser(null);
        setToken(null);
        setSessionExpired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      checkAuth();
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.message || 'Login failed');
      if (data.needsVerification) {
        error.needsVerification = true;
        error.email = data.email;
      }
      throw error;
    }

    if (data.success) {
      setToken(data.accessToken);
      setUser(data.user);
    }
    return data;
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/api/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await fetch(`${API_URL}/api/auth/users/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    if (data.success) {
      setToken(data.accessToken);
      setUser(data.user);
    }
    return data;
  };

  const resendOtp = async (email, purpose = 'registration') => {
    const res = await fetch(`${API_URL}/api/auth/otps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to resend OTP');
    }

    return data;
  };

  const forgotPassword = async (email) => {
    const res = await fetch(`${API_URL}/api/auth/passwords/reset-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.message || 'Failed to send reset OTP');
      if (data.needsVerification) {
        error.needsVerification = true;
        error.email = data.email;
      }
      throw error;
    }

    return data;
  };

  const verifyResetOtp = async (email, otp) => {
    const res = await fetch(`${API_URL}/api/auth/passwords/reset-otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    return data;
  };

  const resetPassword = async (resetToken, newPassword) => {
    const res = await fetch(`${API_URL}/api/auth/passwords`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Password reset failed');
    }

    return data;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/sessions`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    sessionExpired,
    clearSessionExpired,
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    logout,
    getHeaders,
    apiUrl: API_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
