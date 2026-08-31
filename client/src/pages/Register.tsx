import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { maskCpfCnpj } from '../utils/masks';
import { Zap, Lock, Mail, Building2, ArrowRight, User, ShieldCheck, Sparkles } from 'lucide-react';
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
      setError(err.message || 'Erro ao registrar merchant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fintech-bg text-slate-100 flex items-center justify-center p-4 selection:bg-fintech-neon selection:text-black relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-fintech-neon/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-fintech-violet/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl glass-panel border border-fintech-border rounded-3xl p-8 shadow-2xl relative z-10 space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-fintech-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fintech-neon to-fintech-violet p-[1px]">
              <div className="w-full h-full bg-fintech-bg rounded-[11px] flex items-center justify-center text-fintech-neon">
                <Zap className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-lg">PAYSTREAM</span>
              <span className="text-[10px] font-mono text-fintech-muted block">CREDENCIAMENTO MERCHANT</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillDemo}
            className="px-2.5 py-1 bg-fintech-neon/15 hover:bg-fintech-neon/25 border border-fintech-neon/40 text-fintech-neon rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Preencher Demo</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-fintech-rose/10 border border-fintech-rose/30 text-fintech-rose text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">1. Dados da Empresa / E-commerce</span>

            <div>
              <label className="block text-slate-400 mb-1">Razão Social ou Nome Fantasia</label>
              <input
                type="text"
                required
                placeholder="Ex: TechStore Brasil LTDA"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Slug (Identificador URL)</label>
                <input
                  type="text"
                  required
                  placeholder="techstore"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-fintech-neon focus:outline-none focus:border-fintech-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CNPJ / CPF</label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0001-00"
                  value={document}
                  onChange={(e) => setDocument(maskCpfCnpj(e.target.value))}
                  className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-fintech-border">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">2. Administrador Financeiro</span>

            <div>
              <label className="block text-slate-400 mb-1">Nome do Gestor</label>
              <input
                type="text"
                required
                placeholder="Pedro Henrique"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="admin@empresa.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-gradient-to-r from-fintech-neon to-cyan-400 hover:from-cyan-400 hover:to-fintech-neon text-black font-extrabold rounded-xl shadow-lg shadow-fintech-neon/20 transition-all cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Criando Conta...' : 'Emitir Credenciais de Merchant'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs font-mono text-fintech-muted">
          <span>Já tem uma conta? </span>
          <Link to="/login" className="text-fintech-neon hover:underline font-bold">
            Fazer Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
