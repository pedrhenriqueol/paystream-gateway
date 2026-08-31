import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Lock, Mail, Building2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
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
      setError(err.message || 'Credenciais inválidas. Verifique o slug do merchant e a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fintech-bg text-slate-100 flex items-center justify-center p-4 selection:bg-fintech-neon selection:text-black relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-fintech-neon/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-fintech-violet/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 glass-panel border border-fintech-border rounded-3xl overflow-hidden shadow-2xl relative z-10"
      >
        
        {/* Left Visual Column */}
        <div className="p-8 bg-gradient-to-br from-fintech-surface via-fintech-bg to-slate-950 border-b md:border-b-0 md:border-r border-fintech-border flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fintech-neon to-fintech-violet p-[1px]">
                <div className="w-full h-full bg-fintech-bg rounded-[11px] flex items-center justify-center text-fintech-neon">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-white text-lg">PAYSTREAM</span>
                <span className="text-[10px] font-mono text-fintech-muted block">FINTECH ENGINE</span>
              </div>
            </div>

            <div className="mt-8 space-y-4 font-mono text-xs">
              <h2 className="text-xl font-bold font-sans text-white leading-snug">
                Infraestrutura de Pagamentos & Split para Grandes Mercados
              </h2>
              <p className="text-fintech-muted text-xs leading-relaxed">
                Liquidação instantânea PIX SPI, orquestração multi-adquirente e distribuição automatizada para milhares de sellers.
              </p>

              <div className="pt-4 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-fintech-emerald">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Criptografia de ponta a ponta & HMAC-SHA256</span>
                </div>
                <div className="flex items-center gap-2 text-fintech-neon">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Divisão de split transparente na liquidação D+0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-fintech-border/60 text-[11px] font-mono text-fintech-muted flex items-center justify-between">
            <span>PCI-DSS Level 1</span>
            <span>Versão 2.4</span>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-white text-lg font-sans">Acessar Console</h3>
                <p className="text-xs text-fintech-muted font-mono">Entre com sua credencial de merchant</p>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="px-2.5 py-1 bg-fintech-neon/15 hover:bg-fintech-neon/25 border border-fintech-neon/40 text-fintech-neon rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Preencher Conta Demo TechStore"
              >
                <Sparkles className="w-3 h-3" />
                <span>Demo 1-Click</span>
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-fintech-rose/10 border border-fintech-rose/30 text-fintech-rose text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Slug do Merchant (Identificador)</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-fintech-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ex: techstore"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                    className="w-full pl-9 pr-3 py-2.5 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-fintech-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-fintech-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-fintech-neon to-cyan-400 hover:from-cyan-400 hover:to-fintech-neon text-black font-extrabold rounded-xl shadow-lg shadow-fintech-neon/20 transition-all cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Autenticando...' : 'Entrar no Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-6 text-center text-xs font-mono text-fintech-muted">
            <span>Ainda não possui conta de Merchant? </span>
            <Link to="/register" className="text-fintech-neon hover:underline font-bold">
              Criar Conta Grátis
            </Link>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
