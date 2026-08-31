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
  Check, 
  Terminal, 
  ShieldCheck,
  Bell,
  Code2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Layout: React.FC = () => {
  const { user, merchant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [copiedKey, setCopiedKey] = useState(false);

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

  const navItems = [
    { to: '/', label: 'Overview & TPV', icon: Activity, tag: 'LIVE' },
    { to: '/transactions', label: 'Ledger & Transactions', icon: Layers, tag: 'PIX/CARD' },
    { to: '/recipients', label: 'Marketplace Splits', icon: Split, tag: 'ENGINE' },
    { to: '/webhooks', label: 'Webhooks & HMAC', icon: Webhook, tag: 'EVENTS' },
    { to: '/checkout-demo', label: 'Checkout Sandbox', icon: ShoppingBag, tag: 'DEMO' },
  ];

  return (
    <div className="min-h-screen bg-fintech-bg text-slate-100 flex flex-col selection:bg-fintech-neon selection:text-black">
      
      {/* Top Futuristic Navigation Bar */}
      <header className="h-16 border-b border-fintech-border bg-fintech-bg/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
        
        {/* Brand & Terminal Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fintech-neon to-fintech-violet p-[1px]">
              <div className="w-full h-full bg-fintech-bg rounded-[7px] flex items-center justify-center text-fintech-neon">
                <Zap className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">PAYSTREAM</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-fintech-neon/10 text-fintech-neon border border-fintech-neon/30 font-semibold">
                  v2.4 CORE
                </span>
              </div>
              <span className="text-[10px] text-fintech-muted font-mono tracking-wide block">
                FINTECH SETTLEMENT ENGINE
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-6 border-l border-fintech-border font-mono text-xs text-fintech-muted">
            <span>MERCHANT:</span>
            <span className="text-white font-semibold px-2 py-0.5 rounded bg-fintech-surface border border-fintech-border">
              {merchant?.name || user?.merchant.name || 'TechStore'}
            </span>
          </div>
        </div>

        {/* Top Right Quick Actions & Live Badge */}
        <div className="flex items-center gap-4">
          
          {/* API Key Copy Badge */}
          <button
            onClick={copyApiKey}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fintech-surface hover:bg-fintech-surfaceHover border border-fintech-border hover:border-fintech-neon/50 text-xs font-mono text-slate-300 transition-all cursor-pointer"
            title="Copiar Chave de API Live"
          >
            <Code2 className="w-3.5 h-3.5 text-fintech-neon" />
            <span className="truncate max-w-[130px]">
              {merchant?.apiKeyLive?.slice(0, 14) || user?.merchant.apiKeyLive?.slice(0, 14)}...
            </span>
            {copiedKey ? <Check className="w-3 h-3 text-fintech-emerald" /> : <Copy className="w-3 h-3 text-fintech-muted" />}
          </button>

          {/* PCI-DSS Security Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fintech-emerald/10 border border-fintech-emerald/30 text-fintech-emerald text-[11px] font-mono font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PCI-DSS L1</span>
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-3 pl-3 border-l border-fintech-border">
            <div className="text-right hidden sm:block font-mono">
              <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.name?.split(' ')[0]}</p>
              <span className="text-[10px] text-fintech-muted">DIRECTOR</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-fintech-surface hover:bg-fintech-rose/10 border border-fintech-border hover:border-fintech-rose/40 text-fintech-muted hover:text-fintech-rose transition-all cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </header>

      {/* Main Body with Horizontal Nav Stream */}
      <div className="flex-1 flex flex-col">
        
        {/* Modern Horizontal Navigation Bar */}
        <div className="border-b border-fintech-border bg-fintech-surface/50 backdrop-blur-md px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-fintech-neon/15 text-fintech-neon border border-fintech-neon/40 shadow-sm shadow-fintech-neon/20 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-fintech-surface border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-fintech-neon' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-fintech-neon/20 text-fintech-neon' : 'bg-fintech-border text-slate-500'
                  }`}>
                    {item.tag}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto relative overflow-hidden">
          {/* Subtle Ambient Background Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-fintech-neon/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-fintech-violet/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};
