import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Lock, Mail, Building2, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, ArrowUpRight, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const [slug, setSlug] = useState('techstore');
  const [email, setEmail] = useState('admin@techstore.com');
  const [password, setPassword] = useState('pedrooliveira1227!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setSlug('techstore');
    setEmail('admin@techstore.com');
    setPassword('pedrooliveira1227!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(slug, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas. Verifique o identificador (slug) e a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/20 selection:text-emerald-200 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-emerald-500/10 via-slate-900/0 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[350px] bg-gradient-to-t from-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/80 backdrop-blur-xl relative z-10"
      >
        
        {/* Left Column - FinTech Value Prop & Real-Time Telemetry */}
        <div className="p-8 sm:p-10 md:col-span-5 bg-gradient-to-b from-slate-900/40 via-slate-950/60 to-slate-950/90 border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Zap className="w-5 h-5 fill-emerald-400" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-white text-lg block">PAYSTREAM</span>
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Enterprise Gateway</span>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="mt-8 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px]">PIX SPI: 99.99% SLA</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                Infraestrutura de Pagamentos & Split em Tempo Real
              </h2>
              
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
                Liquidação instantânea PIX SPI, orquestração multi-adquirente e distribuição automatizada para milhares de sellers em D+0.
              </p>

              {/* Dynamic Engine Preview Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.06] space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    Motor de Liquidação
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold flex items-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    340ms D+0
                  </span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full w-[85%]" title="Split Sellers (85%)" />
                  <div className="bg-teal-400 h-full w-[15%]" title="Taxa Gateway (15%)" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Split Automatizado
                  </span>
                  <span className="font-mono text-slate-400">Multi-Seller</span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="space-y-2 pt-1 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Criptografia de ponta a ponta com HMAC-SHA256</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Isolamento multi-tenant por Merchant Schema</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>PCI-DSS Level 1</span>
            <span>API v1.0</span>
          </div>
        </div>

        {/* Right Column - Corporate Form */}
        <div className="p-8 sm:p-10 md:col-span-7 flex flex-col justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Acessar Console</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">Entre com sua credencial autorizada de merchant</p>
              </div>

              <button
                type="button"
                onClick={handleFillDemo}
                className="px-3 py-1.5 bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Preencher com credenciais da loja demo TechStore"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Demo 1-Click</span>
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Identificador do Merchant (Slug)
                </label>
                <div className="relative group">
                  <Building2 className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="ex: techstore"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-emerald-300 font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail Corporativo
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="admin@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <span>{loading ? 'Autenticando...' : 'Entrar no Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-8 text-center text-xs text-slate-400 font-normal">
            <span>Ainda não possui conta de Merchant? </span>
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline">
              Credenciar Merchant Grátis
            </Link>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
