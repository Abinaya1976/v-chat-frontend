import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('chatapp_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to extract clean error message
  const getErrorMessage = (err, fallback) => {
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return 'Unable to reach backend server. Please verify your network connection and server status.';
    }
    return err.message || fallback;
  };

  // Load user profile on initial app load if a token is present
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = sessionStorage.getItem('chatapp_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          setToken(storedToken);
        } catch (err) {
          if (err.response?.status === 401) {
            console.warn('Session expired (401):', err.message);
            logout();
          } else {
            console.warn('Server error / temporary connection issue during session restore:', err.message);
            // Fallback to stored user cache if available so UI doesn't abruptly wipe state
            try {
              const cached = JSON.parse(sessionStorage.getItem('chatapp_user') || 'null');
              if (cached) {
                setUser(cached);
                setToken(storedToken);
              }
            } catch (parseErr) {
              console.warn('User cache parse error:', parseErr);
            }
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Register new user
  const register = async (name, email, password, invitationToken = null) => {
    setError(null);
    try {
      const payload = { name, email, password };
      if (invitationToken) payload.invitationToken = invitationToken;
      const res = await api.post('/auth/register', payload);

      if (res.data?.token && res.data?.user) {
        sessionStorage.setItem('chatapp_token', res.data.token);
        sessionStorage.setItem('chatapp_user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      }

      return { success: true, data: res.data };
    } catch (err) {
      const message = getErrorMessage(err, 'Registration failed');
      setError(message);
      return { success: false, error: message };
    }
  };

  // Login existing user
  const login = async (email, password, invitationToken = null) => {
    setError(null);
    try {
      const payload = { email, password };
      if (invitationToken) payload.invitationToken = invitationToken;
      const res = await api.post('/auth/login', payload);
      const { token: jwtToken, user: userData } = res.data;

      // Save token and user details in sessionStorage
      sessionStorage.setItem('chatapp_token', jwtToken);
      sessionStorage.setItem('chatapp_user', JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed');
      setError(message);
      return { success: false, error: message };
    }
  };

  // Logout user
  const logout = () => {
    sessionStorage.removeItem('chatapp_token');
    sessionStorage.removeItem('chatapp_user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Verify protected token via /api/auth/me
  const verifyProtectedMe = async () => {
    try {
      const res = await api.get('/auth/me');
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        error: getErrorMessage(err, 'Verification failed'),
      };
    }
  };

  // Update user profile
  const updateProfile = async (formDataOrData) => {
    try {
      const res = await api.put('/users/profile', formDataOrData);

      if (res.data.success && res.data.user) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        sessionStorage.setItem('chatapp_user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      return { success: false, message: res.data.message || 'Update failed' };
    } catch (err) {
      const message = getErrorMessage(err, 'Profile update failed');
      return { success: false, error: message };
    }
  };

  const updateUser = (updatedUser) => {
    if (updatedUser) {
      setUser(updatedUser);
      sessionStorage.setItem('chatapp_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        setError,
        register,
        login,
        logout,
        verifyProtectedMe,
        updateProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume AuthContext conveniently
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
