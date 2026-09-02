import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardMetrics, Transaction } from '../types';
import { 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  Users, 
  DollarSign, 
  ArrowRight,
  ChevronRight,
  CreditCard,
  QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
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
      setRecentTransactions(response.data.recentTransactions || []);
      sessionStorage.setItem('paystream_cached_metrics', JSON.stringify(response.data.metrics));
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
            Aprovado
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
            Pendente
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold">
            Falha
          </span>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Direct, Objective Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Visão Geral
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Métricas consolidadas de transações e liquidação em tempo real.
          </p>
        </div>

        <div>
          <Link
            to="/checkout-demo"
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-950/40 hover:shadow-emerald-900/50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Simular Venda Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Essential Metrics Cards (with Skeleton Loaders) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Volume Total (TPV) */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Volume Total (TPV)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {metrics?.totalProcessed || 'R$ 0,00'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
              <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +18.4%
              </span>
              <span>{metrics?.paidTransactions || 0} liquidada(s)</span>
            </div>
          </div>

          {/* 2. Receita Líquida */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Receita Líquida</span>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                {metrics?.netRevenue || 'R$ 0,00'}
              </span>
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <span>Taxa retida:</span>
              <span className="text-slate-400 font-mono text-[11px]">{metrics?.totalFees || 'R$ 0,00'}</span>
            </div>
          </div>

          {/* 3. Taxa de Conversão */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Taxa de Aprovação</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {metrics?.approvalRate || '100%'}
              </span>
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-800/60">
              <span>Aprovação direta no gateway</span>
            </div>
          </div>

          {/* 4. Sellers Ativos no Split */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Sellers no Split</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {metrics?.totalRecipients || 0} <span className="text-sm font-normal text-slate-400">sellers</span>
              </span>
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-800/60">
              <span>Divisão automática configurada</span>
            </div>
          </div>

        </div>
      )}

      {/* Main Charts & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Volume Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-base font-sans">Volume de Vendas</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribuição de pagamentos entre PIX e Cartão</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> PIX
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-400" /> Cartão
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pixGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(val) => `R$ ${val/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#1E293B', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="pix" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#pixGradient)" name="PIX (R$)" />
                <Area type="monotone" dataKey="card" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#cardGradient)" name="Cartão (R$)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clean Recent Transactions List */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base font-sans">Últimas Transações</h3>
                <p className="text-xs text-slate-400 mt-0.5">Atividade recente de pagamentos</p>
              </div>
            </div>

            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Nenhuma transação registrada ainda.
                </div>
              ) : (
                recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-all flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-slate-200 truncate">{tx.customerName}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          {tx.paymentMethod === 'PIX' ? <QrCode className="w-3 h-3 text-emerald-400" /> : <CreditCard className="w-3 h-3 text-indigo-400" />}
                          {tx.paymentMethod}
                        </span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="text-right pl-2 shrink-0 flex flex-col items-end gap-1">
                      <span className="font-semibold text-slate-100 font-mono">
                        R$ {Number(tx.amount).toFixed(2)}
                      </span>
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            to="/transactions"
            className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Ver todas as transações</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

      </div>
    </motion.div>
  );
};
