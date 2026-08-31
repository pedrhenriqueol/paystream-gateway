import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardMetrics, Transaction } from '../types';
import { 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Users, 
  ArrowDownRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.get('/dashboard/metrics');
        setMetrics(response.data.metrics);
        setRecentTransactions(response.data.recentTransactions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const chartData = [
    { name: 'Seg', volume: 14200, liquidado: 13780 },
    { name: 'Ter', volume: 22800, liquidado: 22100 },
    { name: 'Qua', volume: 19500, liquidado: 18900 },
    { name: 'Qui', volume: 34100, liquidado: 33100 },
    { name: 'Sex', volume: 48900, liquidado: 47450 },
    { name: 'Sáb', volume: 62400, liquidado: 60550 },
    { name: 'Dom', volume: 54100, liquidado: 52500 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Centro de Liquidação & TPV</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-pay-emerald/10 border border-pay-emerald/30 text-pay-emerald">
              <span className="w-2 h-2 rounded-full bg-pay-emerald animate-pulse" />
              Engine Online D+1
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Volume financeiro processado, divisão de comissões e conciliação em tempo real.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* TPV Total Processado */}
        <div className="p-5 bg-pay-card/70 hover:bg-pay-card/90 border border-pay-border hover:border-pay-accent/50 rounded-2xl transition-all shadow-xl group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">TPV Liquidado</span>
            <div className="w-9 h-9 rounded-xl bg-pay-accent/10 border border-pay-accent/30 flex items-center justify-center text-pay-accent group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {metrics?.totalProcessed || 'R$ 0,00'}
            </span>
          </div>
          <p className="text-[11px] text-pay-emerald mt-1 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {metrics?.paidTransactions || 0} transações aprovadas
          </p>
        </div>

        {/* Receita Líquida do Merchant */}
        <div className="p-5 bg-pay-card/70 hover:bg-pay-card/90 border border-pay-border hover:border-pay-emerald/50 rounded-2xl transition-all shadow-xl group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Receita Líquida</span>
            <div className="w-9 h-9 rounded-xl bg-pay-emerald/10 border border-pay-emerald/30 flex items-center justify-center text-pay-emerald group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-pay-emerald tracking-tight">
              {metrics?.netRevenue || 'R$ 0,00'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">Disponível para repasse bancário</p>
        </div>

        {/* Taxa de Aprovação */}
        <div className="p-5 bg-pay-card/70 hover:bg-pay-card/90 border border-pay-border hover:border-pay-purple/50 rounded-2xl transition-all shadow-xl group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Taxa de Conversão</span>
            <div className="w-9 h-9 rounded-xl bg-pay-purple/10 border border-pay-purple/30 flex items-center justify-center text-pay-purple group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {metrics?.approvalRate || '100%'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">PIX instantâneo + Anti-fraude</p>
        </div>

        {/* Recebedores / Sellers Cadastrados */}
        <div className="p-5 bg-pay-card/70 hover:bg-pay-card/90 border border-pay-border hover:border-pay-amber/50 rounded-2xl transition-all shadow-xl group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Marketplace Sellers</span>
            <div className="w-9 h-9 rounded-xl bg-pay-amber/10 border border-pay-amber/30 flex items-center justify-center text-pay-amber group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {metrics?.totalRecipients || 0}
            </span>
            <span className="text-xs text-gray-400 font-mono">cadastrados</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">Divisão automatizada de comissão</p>
        </div>

      </div>

      {/* Charts & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Volume */}
        <div className="lg:col-span-2 p-6 bg-pay-card/50 border border-pay-border rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white text-base">Volume Transacionado (Últimos 7 Dias)</h3>
              <p className="text-xs text-gray-400">Comparativo entre TPV Bruto vs Liquidação Líquida</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-pay-accent/10 border border-pay-accent/30 text-pay-accent flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Realtime Stream
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0E131F', borderColor: '#1F293D', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="volume" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" name="Volume Bruto" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Últimas Transações */}
        <div className="p-6 bg-pay-card/50 border border-pay-border rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white text-base mb-1">Últimas Transações</h3>
            <p className="text-xs text-gray-400 mb-4">Feed de pagamentos em tempo real</p>

            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-4 text-center">Nenhuma transação registrada ainda.</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 rounded-xl bg-pay-dark border border-pay-border/60 flex items-center justify-between text-xs font-mono">
                    <div>
                      <p className="font-semibold text-white">{tx.customerName}</p>
                      <span className="text-[10px] text-gray-400">{tx.paymentMethod} • {new Date(tx.createdAt).toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-pay-emerald">R$ {Number(tx.amount).toFixed(2)}</span>
                      <span className="block text-[9px] text-gray-500 uppercase">{tx.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
