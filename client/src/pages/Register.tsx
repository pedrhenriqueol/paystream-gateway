import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { maskCNPJ } from '../utils/masks';
import { CreditCard, Building, User, Mail, Lock, FileText, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [merchantName, setMerchantName] = useState('');
  const [merchantSlug, setMerchantSlug] = useState('');
  const [document, setDocument] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMerchantName(val);
    if (!merchantSlug) {
      setMerchantSlug(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register-merchant', {
        merchantName: merchantName.trim(),
        merchantSlug: merchantSlug.trim().toLowerCase(),
        document: document.trim(),
        adminName: adminName.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      setSuccess(true);

      setTimeout(async () => {
        await login(merchantSlug.trim().toLowerCase(), email.trim().toLowerCase(), password);
        navigate('/', { replace: true });
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erro ao registrar merchant.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pay-darker via-pay-dark to-[#0F172A] p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pay-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pay-emerald/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-pay-card/90 backdrop-blur-xl border border-pay-border rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 my-8">
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-pay-accent/20 border border-pay-accent/40 flex items-center justify-center text-pay-accent mb-2.5 shadow-md">
            <CreditCard className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            PayStream <span className="text-pay-accent font-mono text-xs px-2 py-0.5 rounded bg-pay-accent/10 border border-pay-accent/30">GATEWAY</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Credenciamento de Novo E-commerce / Marketplace</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-pay-rose/10 border border-pay-rose/30 flex items-center gap-2.5 text-pay-rose text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-pay-emerald/10 border border-pay-emerald/30 flex items-center gap-2.5 text-pay-emerald text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Merchant cadastrado com sucesso! Emitindo chaves de API...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-3 pb-3 border-b border-pay-border/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pay-accent flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              1. Dados da Loja / Empresa
            </span>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">Nome Fantasia / Razão Social *</label>
              <input
                type="text"
                required
                placeholder="Ex: TechStore Informática Ltda"
                value={merchantName}
                onChange={handleNameChange}
                className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pay-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Identificador de URL (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="techstore"
                  value={merchantSlug}
                  onChange={(e) => setMerchantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pay-accent font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">CNPJ / CPF *</label>
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={document}
                    onChange={(e) => setDocument(maskCNPJ(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pay-accent font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pay-emerald flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              2. Administrador Financeiro
            </span>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">Nome Completo do Responsável *</label>
              <input
                type="text"
                required
                placeholder="Ex: Pedro Henrique"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pay-accent"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">E-mail Corporativo de Acesso *</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Senha * (mín. 8 chars)</label>
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

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Confirmar Senha *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pay-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-4 py-3 px-4 bg-pay-accent hover:bg-pay-accentHover text-white font-medium rounded-xl transition-all shadow-lg shadow-pay-accent/25 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? <span>Gerando Chaves de API...</span> : (
              <>
                <span>Cadastrar E-commerce & Acessar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-gray-400">
          Já tem conta?{' '}
          <Link to="/login" className="text-pay-accent hover:underline font-medium">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
};
