import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { maskCpfCnpj } from '../utils/masks';
import { Zap, Lock, Mail, Building2, ArrowRight, User, ShieldCheck, Sparkles, FileText, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [document, setDocument] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  const handleFillDemo = () => {
    setName('Prime Payments Brasil');
    setSlug('primepay');
    setDocument('12.345.678/0001-90');
    setAdminName('Diretoria Financeira');
    setAdminEmail('admin@primepay.com.br');
    setAdminPassword('pedrooliveira1227!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register({
        name,
        slug,
        document,
        adminName,
        adminEmail,
        adminPassword
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar credencial de merchant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/20 selection:text-emerald-200 relative overflow-hidden font-sans">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-emerald-500/10 via-slate-900/0 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[350px] bg-gradient-to-t from-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 backdrop-blur-xl relative z-10 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-lg block">PAYSTREAM</span>
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Credenciamento de Merchant</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillDemo}
            className="px-3 py-1.5 bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Preencher com dados de exemplo (Prime Payments)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preencher Demo</span>
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Business Information */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Dados da Empresa / E-commerce</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Razão Social ou Nome Fantasia
              </label>
              <div className="relative group">
                <Building2 className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="ex: Prime Payments Brasil Ltda"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Slug do Merchant</span>
                  <span className="text-[10px] text-slate-500 font-mono">checkout/:slug</span>
                </label>
                <div className="relative group">
                  <Globe className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="primepay"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-emerald-300 font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  CNPJ ou CPF
                </label>
                <div className="relative group">
                  <FileText className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={document}
                    onChange={(e) => setDocument(maskCpfCnpj(e.target.value))}
                    maxLength={18}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Administrator Account */}
          <div className="space-y-3.5 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Administrador Financeiro (Master)</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nome Completo do Gestor
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="ex: Diretoria Financeira"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Senha Master
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <span>{loading ? 'Credenciando Merchant...' : 'Emitir Credenciais de Merchant'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400 font-normal">
          <span>Já possui uma conta de Merchant? </span>
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline">
            Fazer Login no Console
          </Link>
        </div>

      </motion.div>
    </div>
  );
};
