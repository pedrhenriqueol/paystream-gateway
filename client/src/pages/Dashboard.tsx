import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardMetrics, Transaction } from '../types';
import { 
  TrendingUp, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Users, 
  ArrowDownRight,
  ShieldCheck,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(() => {
    const cached = sessionStorage.getItem('paystream_cached_metrics');
    return cached ? JSON.parse(cached) : null;
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(!metrics);

  const loadData = async () => {
    try {
      const response = await api.get('/dashboard/metrics');
      setMetrics(response.data.metrics);
      setRecentTransactions(response.data.recentTransactions);
      sessionStorage.setItem('paystream_cached_metrics', JSON.stringify(response.data.metrics));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = [
    { hour: '00h', volume: 4200, pix: 3100, card: 1100 },
    { hour: '04h', volume: 2100, pix: 1800, card: 300 },
    { hour: '08h', volume: 18900, pix: 12400, card: 6500 },
    { hour: '12h', volume: 42100, pix: 28900, card: 13200 },
    { hour: '16h', volume: 56400, pix: 37200, card: 19200 },
    { hour: '20h', volume: 68900, pix: 46100, card: 22800 },
    { hour: '23h', volume: 39500, pix: 27000, card: 12500 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Top Banner with Engine Status */}
      <div className="glass-panel p-6 rounded-2xl border border-fintech-border relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Financial Liquidity Matrix
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-fintech-neon/10 border border-fintech-neon/30 text-fintech-neon">
              <span className="w-1.5 h-1.5 rounded-full bg-fintech-neon animate-ping" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-fintech-muted font-mono">
            Processamento multi-adquirente instantâneo • PIX Banco Central SPI • Conciliação D+1
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/checkout-demo"
            className="px-4 py-2 bg-gradient-to-r from-fintech-neon to-cyan-400 hover:from-cyan-400 hover:to-fintech-neon text-black font-bold text-xs rounded-xl shadow-lg shadow-fintech-neon/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Simular Venda Checkout ➔</span>
          </Link>
        </div>
      </div>

      {/* Grid of Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TPV Bruto */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-fintech-muted">Total Volume (TPV)</span>
            <div className="w-8 h-8 rounded-lg bg-fintech-neon/10 border border-fintech-neon/30 flex items-center justify-center text-fintech-neon">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
              {metrics?.totalProcessed || 'R$ 0,00'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-fintech-border/40 flex items-center justify-between text-[10px] font-mono text-fintech-muted">
            <span className="text-fintech-emerald flex items-center gap-0.5 font-bold">
              <TrendingUp className="w-3 h-3" /> +18.4%
            </span>
            <span>{metrics?.paidTransactions || 0} liquidada(s)</span>
          </div>
        </div>

        {/* Receita Líquida */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-fintech-muted">Receita Líquida</span>
            <div className="w-8 h-8 rounded-lg bg-fintech-emerald/10 border border-fintech-emerald/30 flex items-center justify-center text-fintech-emerald">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold font-mono text-fintech-emerald tracking-tight">
              {metrics?.netRevenue || 'R$ 0,00'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-fintech-border/40 flex items-center justify-between text-[10px] font-mono text-fintech-muted">
            <span>Taxa retida gateway:</span>
            <span className="text-slate-300">{metrics?.totalFees || 'R$ 0,00'}</span>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-fintech-muted">Aprovação SPI/Adquirente</span>
            <div className="w-8 h-8 rounded-lg bg-fintech-violet/10 border border-fintech-violet/30 flex items-center justify-center text-fintech-violet">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
              {metrics?.approvalRate || '100%'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-fintech-border/40 flex items-center justify-between text-[10px] font-mono text-fintech-muted">
            <span className="text-fintech-neon font-bold">PIX Sub-second</span>
            <span>Anti-fraude Ativo</span>
          </div>
        </div>

        {/* Sellers / Marketplace Splits */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-fintech-muted">Recebedores de Split</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
              {metrics?.totalRecipients || 0} <span className="text-xs text-fintech-muted font-normal">sellers</span>
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-fintech-border/40 flex items-center justify-between text-[10px] font-mono text-fintech-muted">
            <span>Repasse bancário</span>
            <span className="text-fintech-emerald">Automatizado</span>
          </div>
        </div>

      </div>

      {/* Main Charts & Live Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time TPV Volume Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-fintech-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-base font-sans">Volume de Liquidação Horária</h3>
              <p className="text-xs text-fintech-muted font-mono">Tráfego de liquidações PIX vs Cartão de Crédito</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-fintech-neon">
                <span className="w-2 h-2 rounded-full bg-fintech-neon" /> PIX
              </span>
              <span className="flex items-center gap-1.5 text-fintech-violet">
                <span className="w-2 h-2 rounded-full bg-fintech-violet" /> Cartão
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="neonGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="violetGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#475569" fontSize={11} tickLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={{ backgroundColor: '#0A0F1D', borderColor: '#1E293B', borderRadius: '12px', fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <Area type="monotone" dataKey="pix" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#neonGlow)" name="PIX (R$)" />
                <Area type="monotone" dataKey="card" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#violetGlow)" name="Cartão (R$)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Stream Ledger Feed */}
        <div className="glass-panel p-6 rounded-2xl border border-fintech-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base font-sans">Ledger Feed</h3>
                <p className="text-[11px] text-fintech-muted font-mono">Últimas ordens no gateway</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fintech-border text-slate-400">
                LIVE
              </span>
            </div>

            <div className="space-y-2.5">
              {recentTransactions.length === 0 ? (
                <p className="text-xs text-fintech-muted italic p-6 text-center font-mono">
                  Nenhuma transação liquidada ainda.
                </p>
              ) : (
                recentTransactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="p-3 rounded-xl bg-fintech-surface/80 border border-fintech-border hover:border-fintech-neon/40 transition-all flex items-center justify-between text-xs font-mono">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{tx.customerName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-fintech-muted mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-fintech-border text-slate-300">{tx.paymentMethod}</span>
                        <span>{new Date(tx.createdAt).toLocaleTimeString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="text-right pl-3 shrink-0">
                      <span className="font-bold text-fintech-emerald">R$ {Number(tx.amount).toFixed(2)}</span>
                      <span className={`block text-[9px] uppercase font-bold ${
                        tx.status === 'PAID' ? 'text-fintech-emerald' : 'text-fintech-rose'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            to="/transactions"
            className="w-full mt-4 py-2 px-3 rounded-xl bg-fintech-surface hover:bg-fintech-neon/10 border border-fintech-border hover:border-fintech-neon/40 text-xs font-mono text-slate-300 hover:text-fintech-neon transition-all flex items-center justify-center gap-1"
          >
            <span>Ver Livro Caixa Completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </motion.div>
  );
};
