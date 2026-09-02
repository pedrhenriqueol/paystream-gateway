import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Lock, Mail, Building2, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const [slug, setSlug] = useState('techstore');
  const [email, setEmail] = useState('admin@techstore.com');
  const [password, setPassword] = useState('pedrooliveira1227!');
  const [loading, setLoading] = useState(false);
  const [coldStart, setColdStart] = useState(false);
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
    setColdStart(false);

    // Feedback visual caso o back-end esteja em Cold Start (> 1.5s)
    const coldTimer = setTimeout(() => {
      setColdStart(true);
    }, 1500);

    try {
      await login(slug, email, password);
      clearTimeout(coldTimer);
      // Redirecionamento instantâneo via router sem bloqueios secundários
      navigate('/dashboard');
    } catch (err: any) {
      clearTimeout(coldTimer);
      setColdStart(false);
      setError(err.message || 'Credenciais inválidas. Verifique o identificador (slug) e a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/20 selection:text-emerald-200 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-gradient-to-t from-slate-800/20 to-transparent blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/80 backdrop-blur-xl relative z-10"
      >
        
        {/* Left Column - Minimalist Branding & Editorial Value Prop */}
        <div className="p-8 sm:p-12 md:col-span-5 bg-gradient-to-b from-slate-900/40 via-slate-950/60 to-slate-950/90 border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col justify-between">
          <div>
            {/* Logo limpa + Nome */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950/50">
                <Zap className="w-5 h-5 fill-emerald-400" />
              </div>
              <span className="font-bold tracking-tight text-white text-xl">PayStream</span>
            </div>

            {/* Editorial Presentation */}
            <div className="mt-12 sm:mt-16 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                A infraestrutura de pagamentos para sua operação
              </h2>
              
              <p className="text-slate-400 text-sm leading-relaxed font-normal">
                Processe Pix e cartão, gerencie split de vendas e acompanhe suas liquidações em um único console.
              </p>
            </div>
          </div>

          <div className="pt-8 text-xs text-slate-500 font-medium">
            Plataforma segura para grandes mercados
          </div>
        </div>

        {/* Right Column - Clean Access Form */}
        <div className="p-8 sm:p-12 md:col-span-7 flex flex-col justify-between bg-slate-950/40">
          <div>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Acesse sua conta</h3>
                <p className="text-xs text-slate-400 mt-1 font-normal">Entre com suas credenciais de merchant</p>
              </div>

              {/* Botão Demo 1-Click sutil */}
              <button
                type="button"
                onClick={handleFillDemo}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Preencher com credenciais da loja demo TechStore"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Demo 1-Click</span>
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
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
                  Identificador (Slug)
                </label>
                <div className="relative group">
                  <Building2 className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="ex: techstore"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail
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
                  Senha
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
                className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-950/40 hover:shadow-emerald-900/50 transition-all cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>{coldStart ? 'Iniciando engine segura... (pode levar alguns segundos)' : 'Autenticando...'}</span>
                  </div>
                ) : (
                  <>
                    <span>Entrar no Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-8 text-center text-xs text-slate-400 font-normal">
            <span>Não tem uma conta? </span>
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline">
              Cadastre-se
            </Link>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
