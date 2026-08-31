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
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('paystream_token'));
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const response = await api.get('/auth/me');
      // Backend returns { user: { id, name, email, role, merchant: { ... } } }
      const userData = response.data.user;
      const merchantData = userData.merchant;

      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        merchant: merchantData
      });
      setMerchant(merchantData);
    } catch {
      localStorage.removeItem('paystream_token');
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
    // Backend expects { merchantSlug, email, password }
    const response = await api.post('/auth/login', {
      merchantSlug: slug,
      email,
      password
    });
    const { token: newToken, user: userData, merchant: merchantData } = response.data;
    localStorage.setItem('paystream_token', newToken);
    setToken(newToken);
    setUser({ ...userData, merchant: merchantData });
    setMerchant(merchantData);
  };

  const register = async (data: {
    name: string;
    slug: string;
    document: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => {
    // Backend expects { merchantName, merchantSlug, document, adminName, email, password }
    const response = await api.post('/auth/register-merchant', {
      merchantName: data.name,
      merchantSlug: data.slug,
      document: data.document,
      adminName: data.adminName,
      email: data.adminEmail,
      password: data.adminPassword
    });
    const { token: newToken, user: userData, merchant: merchantData } = response.data;
    localStorage.setItem('paystream_token', newToken);
    setToken(newToken);
    setUser({ ...userData, merchant: merchantData });
    setMerchant(merchantData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('paystream_token');
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
