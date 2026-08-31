import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Lock, Mail, Building, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [merchantSlug, setMerchantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFillDemo = () => {
    setMerchantSlug('techstore');
    setEmail('admin@techstore.com');
    setPassword('pedrooliveira1227!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(merchantSlug.trim(), email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pay-darker via-pay-dark to-[#0F172A] p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pay-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pay-emerald/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-pay-card/90 backdrop-blur-xl border border-pay-border rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-pay-accent/20 border border-pay-accent/40 flex items-center justify-center text-pay-accent mb-3 shadow-md">
            <CreditCard className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            PayStream <span className="text-pay-accent font-mono text-xs px-2 py-0.5 rounded bg-pay-accent/10 border border-pay-accent/30">GATEWAY</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Portal de Liquidação Financeira & Gestão de Checkout</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-pay-rose/10 border border-pay-rose/30 flex items-center gap-2 text-pay-rose text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-300 mb-1">Slug do Merchant / E-commerce *</label>
            <div className="relative">
              <Building className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="ex: techstore"
                value={merchantSlug}
                onChange={(e) => setMerchantSlug(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pay-accent font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1">E-mail Corporativo *</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@techstore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pay-accent"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1">Senha de Acesso *</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pay-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-pay-accent hover:bg-pay-accentHover text-white font-medium rounded-xl transition-all shadow-lg shadow-pay-accent/25 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 text-sm"
          >
            <span>{loading ? 'Autenticando...' : 'Acessar Gateway'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-pay-border/60 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2 px-3 bg-pay-dark hover:bg-pay-border/40 border border-pay-border text-xs text-gray-300 hover:text-white rounded-xl transition-all font-mono"
          >
            ⚡ Preencher Conta Demo (TechStore)
          </button>

          <div className="text-center text-xs text-gray-400">
            Ainda não é cadastrado?{' '}
            <Link to="/register" className="text-pay-accent hover:underline font-medium">
              Criar Conta Merchant ➔
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-pay-border/40 flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-pay-emerald" />
          <span>Gateway Criptografado & Split Automatizado</span>
        </div>
      </div>
    </div>
  );
};
