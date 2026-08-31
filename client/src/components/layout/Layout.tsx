import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, 
  LayoutDashboard, 
  ArrowLeftRight, 
  Users, 
  Webhook, 
  LogOut, 
  Building2, 
  Key,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, merchant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Visão Geral & TPV', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transações & PIX', icon: ArrowLeftRight },
    { to: '/recipients', label: 'Recebedores & Split', icon: Users },
    { to: '/webhooks', label: 'Webhooks & HMAC', icon: Webhook },
    { to: '/checkout-demo', label: 'Checkout Demo', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen flex bg-pay-darker text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-pay-dark border-r border-pay-border flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-pay-border/60">
            <div className="w-10 h-10 rounded-xl bg-pay-accent/20 border border-pay-accent/40 flex items-center justify-center text-pay-accent shadow-md">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-wide text-base leading-tight">PayStream <span className="text-pay-accent font-mono text-xs">GATEWAY</span></h2>
              <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pay-emerald inline-block" />
                Live Engine
              </span>
            </div>
          </div>

          {/* Merchant Context Badge */}
          <div className="mx-2 mb-6 px-3 py-2.5 rounded-xl bg-pay-card/60 border border-pay-border/80 text-xs text-gray-400">
            <div className="flex items-center gap-1.5 text-gray-300 font-medium mb-1 truncate">
              <Building2 className="w-3.5 h-3.5 text-pay-accent shrink-0" />
              <span className="truncate">{merchant?.name || user?.merchant.name}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono block truncate">
              api: {merchant?.apiKeyLive?.slice(0, 16) || user?.merchant.apiKeyLive?.slice(0, 16)}...
            </span>
          </div>

          {/* Nav items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-pay-accent text-white shadow-lg shadow-pay-accent/20'
                        : 'text-gray-400 hover:text-white hover:bg-pay-card/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="pt-4 border-t border-pay-border/60">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-pay-border flex items-center justify-center text-xs font-bold text-pay-accent">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-pay-rose/80 hover:text-pay-rose hover:bg-pay-rose/10 transition-all border border-pay-rose/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-pay-border bg-pay-dark/40 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>E-Commerce / Merchant:</span>
            <span className="font-semibold text-white bg-pay-card px-2 py-1 rounded-md border border-pay-border">
              {merchant?.name || user?.merchant.name}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-pay-emerald font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>PCI-DSS Compliant</span>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
