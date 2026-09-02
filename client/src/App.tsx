import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Recipients } from './pages/Recipients';
import { Webhooks } from './pages/Webhooks';
import { CheckoutDemo } from './pages/CheckoutDemo';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-slate-400 gap-3 font-sans">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        </div>
        <span className="text-xs text-slate-500 font-medium">Iniciando console PayStream...</span>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="recipients" element={<Recipients />} />
            <Route path="webhooks" element={<Webhooks />} />
            <Route path="checkout-demo" element={<CheckoutDemo />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
