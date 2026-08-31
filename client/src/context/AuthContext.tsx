import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { User, Merchant } from '../types';

interface AuthContextType {
  user: User | null;
  merchant: Merchant | null;
  loading: boolean;
  login: (merchantSlug: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setMerchant(response.data.user.merchant);
      } catch (err) {
        setUser(null);
        setMerchant(null);
        sessionStorage.removeItem('paystream_token');
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (merchantSlug: string, email: string, password: string) => {
    const response = await api.post('/auth/login', {
      merchantSlug,
      email,
      password
    });
    
    if (response.data.token) {
      sessionStorage.setItem('paystream_token', response.data.token);
    }
    setUser(response.data.user);
    setMerchant(response.data.merchant);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      sessionStorage.removeItem('paystream_token');
      setUser(null);
      setMerchant(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, merchant, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
