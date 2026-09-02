import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Zap, 
  Activity, 
  Layers, 
  Split, 
  Webhook, 
  ShoppingBag, 
  LogOut, 
  Copy, 
  Check
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, merchant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [copiedKey, setCopiedKey] = useState(false);
  const [environment, setEnvironment] = useState<'live' | 'sandbox'>('live');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const copyApiKey = () => {
    const key = merchant?.apiKeyLive || user?.merchant.apiKeyLive;
    if (key) {
      navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const rawKey = merchant?.apiKeyLive || user?.merchant.apiKeyLive || 'ps_live_demo1234567890';
  const maskedKey = `${rawKey.slice(0, 10)}...${rawKey.slice(-4)}`;

  const navItems = [
    { to: '/', label: 'Visão Geral', icon: Activity },
    { to: '/transactions', label: 'Transações', icon: Layers },
    { to: '/recipients', label: 'Divisão de Split', icon: Split },
    { to: '/webhooks', label: 'Webhooks & HMAC', icon: Webhook },
    { to: '/checkout-demo', label: 'Simular Checkout', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-200">
      
      {/* Clean Corporate Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-[#080C14]/90 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
        
        {/* Left: Brand & Merchant Context */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950/50">
              <Zap className="w-4 h-4 fill-emerald-400" />
            </div>
            <span className="font-bold tracking-tight text-white text-base">PAYSTREAM</span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Merchant:</span>
            <span className="font-semibold text-slate-200 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
              {merchant?.name || user?.merchant.name || 'TechStore'}
            </span>
          </div>
        </div>

        {/* Right: Environment Toggle, Masked API Key & User Logout */}
        <div className="flex items-center gap-3">
          
          {/* Environment Switch (Live / Sandbox) */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setEnvironment('live')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                environment === 'live'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Live</span>
            </button>
            <button
              onClick={() => setEnvironment('sandbox')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                environment === 'sandbox'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Sandbox</span>
            </button>
          </div>

          {/* Masked API Key Copy Badge */}
          <button
            onClick={copyApiKey}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 transition-all cursor-pointer"
            title="Clique para copiar a Chave de API"
          >
            <span className="text-slate-500 text-[11px] font-sans">API:</span>
            <span className="text-slate-300">{maskedKey}</span>
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              {user?.name?.split(' ')[0]}
            </span>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col">
        
        {/* Clean Secondary Navigation Bar */}
        <div className="border-b border-slate-800/70 bg-slate-950/40 px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/dashboard');

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto relative">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
