import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { User, Merchant } from '../types';

interface AuthContextType {
  user: User | null;
  merchant: Merchant | null;
  token: string | null;
  loading: boolean;
  login: (slug: string, email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    slug: string;
    document: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stale-While-Revalidate: Instant boot from cached credentials
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('paystream_token'));
  
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('paystream_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [merchant, setMerchant] = useState<Merchant | null>(() => {
    const cached = localStorage.getItem('paystream_merchant');
    return cached ? JSON.parse(cached) : null;
  });

  // Only show full loading if we have a token but NO cached user
  const [loading, setLoading] = useState<boolean>(() => {
    const hasToken = !!localStorage.getItem('paystream_token');
    const hasUser = !!localStorage.getItem('paystream_user');
    return hasToken && !hasUser;
  });

  const fetchMe = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      const merchantData = userData.merchant;

      const fullUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        merchant: merchantData
      };

      setUser(fullUser);
      setMerchant(merchantData);
      localStorage.setItem('paystream_user', JSON.stringify(fullUser));
      localStorage.setItem('paystream_merchant', JSON.stringify(merchantData));
    } catch {
      localStorage.removeItem('paystream_token');
      localStorage.removeItem('paystream_user');
      localStorage.removeItem('paystream_merchant');
      setToken(null);
      setUser(null);
      setMerchant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (slug: string, email: string, password: string) => {
    const response = await api.post('/auth/login', {
      merchantSlug: slug,
      email,
      password
    });
    const { token: newToken, user: userData, merchant: merchantData } = response.data;
    
    const fullUser = { ...userData, merchant: merchantData };

    // Immediate persistence
    localStorage.setItem('paystream_token', newToken);
    localStorage.setItem('paystream_user', JSON.stringify(fullUser));
    localStorage.setItem('paystream_merchant', JSON.stringify(merchantData));

    // Immediate state update
    setToken(newToken);
    setUser(fullUser);
    setMerchant(merchantData);
    setLoading(false);
  };

  const register = async (data: {
    name: string;
    slug: string;
    document: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => {
    const response = await api.post('/auth/register-merchant', {
      merchantName: data.name,
      merchantSlug: data.slug,
      document: data.document,
      adminName: data.adminName,
      email: data.adminEmail,
      password: data.adminPassword
    });
    const { token: newToken, user: userData, merchant: merchantData } = response.data;
    const fullUser = { ...userData, merchant: merchantData };

    localStorage.setItem('paystream_token', newToken);
    localStorage.setItem('paystream_user', JSON.stringify(fullUser));
    localStorage.setItem('paystream_merchant', JSON.stringify(merchantData));

    setToken(newToken);
    setUser(fullUser);
    setMerchant(merchantData);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('paystream_token');
    localStorage.removeItem('paystream_user');
    localStorage.removeItem('paystream_merchant');
    sessionStorage.removeItem('paystream_cached_metrics');
    setToken(null);
    setUser(null);
    setMerchant(null);
  };

  return (
    <AuthContext.Provider value={{ user, merchant, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
