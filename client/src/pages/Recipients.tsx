import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Recipient } from '../types';
import { maskCpfCnpj } from '../utils/masks';
import { 
  Split, 
  Plus, 
  Building2, 
  CreditCard, 
  Calculator, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Percent,
  Sliders,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Recipients: React.FC = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [bankCode, setBankCode] = useState('260');
  const [agency, setAgency] = useState('0001');
  const [account, setAccount] = useState('');

  // Interactive Split Simulator State
  const [simSaleAmount, setSimSaleAmount] = useState<number>(1000);
  const [simPlatformFeePercent, setSimPlatformFeePercent] = useState<number>(10);
  const [simSelectedSeller, setSimSelectedSeller] = useState<string>('');

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recipients');
      setRecipients(res.data.recipients);
      if (res.data.recipients.length > 0 && !simSelectedSeller) {
        setSimSelectedSeller(res.data.recipients[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipients();
  }, []);

  const handleCreateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.post('/recipients', {
        name,
        document,
        bankCode,
        agency,
        account
      });
      setShowModal(false);
      setName('');
      setDocument('');
      setAccount('');
      loadRecipients();
    } catch (err: any) {
      alert(`Erro ao cadastrar recebedor: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const getBankName = (code: string) => {
    switch (code) {
      case '260': return 'Nubank (Nu Pagamentos)';
      case '001': return 'Banco do Brasil';
      case '341': return 'Itaú Unibanco';
      case '237': return 'Bradesco';
      case '033': return 'Santander';
      case '077': return 'Banco Inter';
      case '290': return 'PagBank';
      default: return `Banco (${code})`;
    }
  };

  // Calculations for Simulator
  const gatewayProcessingFee = (simSaleAmount * 0.0299) + 0.49;
  const platformRevenue = (simSaleAmount * (simPlatformFeePercent / 100));
  const sellerPayout = Math.max(0, simSaleAmount - gatewayProcessingFee - platformRevenue);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Divisão de Pagamentos & Sellers (Marketplace Split)
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
              Split Engine D+0
            </span>
          </div>
          <p className="text-xs text-fintech-muted font-mono mt-0.5">
            Cadastre vendedores parceiros e configure a divisão automática de receitas diretamente na liquidação do Banco Central.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Seller</span>
        </button>
      </div>

      {/* Interactive Split Simulator Sandbox */}
      <div className="glass-panel p-6 rounded-2xl border border-fintech-border relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-fintech-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Simulador Interativo de Split de Venda</h3>
              <p className="text-[11px] text-fintech-muted font-mono">Calcule a retenção de comissão e o repasse líquido para o seller em tempo real.</p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-fintech-surface border border-fintech-border text-slate-400">
            MOTOR DETERMINÍSTICO
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
          {/* Controls */}
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Valor Bruto da Venda (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                <input
                  type="number"
                  step="10"
                  min="10"
                  value={simSaleAmount}
                  onChange={(e) => setSimSaleAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white font-bold focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Comissão da Plataforma (Take Rate):</span>
                <span className="text-purple-400 font-bold">{simPlatformFeePercent}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={simPlatformFeePercent}
                onChange={(e) => setSimPlatformFeePercent(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Seller Destinatário do Split</label>
              <select
                value={simSelectedSeller}
                onChange={(e) => setSimSelectedSeller(e.target.value)}
                className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-purple-400"
              >
                {recipients.length === 0 ? (
                  <option value="">Nenhum seller cadastrado</option>
                ) : (
                  recipients.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({getBankName(r.bankCode)})</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Visual Breakdown Diagram */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-fintech-bg/80 border border-fintech-border flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              
              {/* Box 1: Gateway Fee */}
              <div className="p-3 rounded-xl bg-fintech-surface border border-fintech-border">
                <span className="text-[10px] text-fintech-rose block font-bold">1. TAXA GATEWAY</span>
                <span className="text-base font-extrabold text-white mt-1 block">R$ {gatewayProcessingFee.toFixed(2)}</span>
                <span className="text-[9px] text-fintech-muted">2.99% + R$ 0,49</span>
              </div>

              {/* Box 2: Platform Take */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <span className="text-[10px] text-purple-400 block font-bold">2. SUA PLATAFORMA</span>
                <span className="text-base font-extrabold text-purple-300 mt-1 block">R$ {platformRevenue.toFixed(2)}</span>
                <span className="text-[9px] text-purple-400/80">{simPlatformFeePercent}% de comissão</span>
              </div>

              {/* Box 3: Seller Payout */}
              <div className="p-3 rounded-xl bg-fintech-emerald/10 border border-fintech-emerald/30">
                <span className="text-[10px] text-fintech-emerald block font-bold">3. REPASSE AO SELLER</span>
                <span className="text-base font-extrabold text-fintech-emerald mt-1 block">R$ {sellerPayout.toFixed(2)}</span>
                <span className="text-[9px] text-fintech-emerald/80">Liquidação bancária D+0</span>
              </div>

            </div>

            {/* Split Progress Bar */}
            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="w-full h-3 rounded-full bg-fintech-surface overflow-hidden flex">
                <div 
                  style={{ width: `${(gatewayProcessingFee / simSaleAmount) * 100}%` }} 
                  className="bg-fintech-rose" 
                  title="Taxa Gateway"
                />
                <div 
                  style={{ width: `${(platformRevenue / simSaleAmount) * 100}%` }} 
                  className="bg-purple-500" 
                  title="Comissão Marketplace"
                />
                <div 
                  style={{ width: `${(sellerPayout / simSaleAmount) * 100}%` }} 
                  className="bg-fintech-emerald" 
                  title="Seller Payout"
                />
              </div>
              <div className="flex justify-between text-slate-400 pt-1">
                <span>R$ 0,00</span>
                <span className="text-white font-bold">Total da Venda: R$ {simSaleAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sellers List Cards Grid */}
      <div>
        <h3 className="font-bold text-white text-base mb-4 font-sans flex items-center gap-2">
          <Building2 className="w-4 h-4 text-purple-400" />
          <span>Sellers & Vendedores Cadastrados</span>
          <span className="text-xs font-mono text-fintech-muted">({recipients.length})</span>
        </h3>

        {recipients.length === 0 && !loading ? (
          <div className="glass-panel p-12 rounded-2xl border border-fintech-border text-center font-mono space-y-3">
            <UserCheck className="w-10 h-10 text-fintech-muted mx-auto" />
            <p className="text-slate-300 text-sm">Nenhum seller cadastrado para split de pagamentos.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Cadastrar Primeiro Seller
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipients.map((recipient) => (
              <div 
                key={recipient.id}
                className="glass-panel glass-panel-hover p-5 rounded-2xl border border-fintech-border flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-fintech-border">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono text-xs font-bold">
                        {recipient.bankCode}
                      </div>
                      <span className="font-bold text-white text-xs truncate max-w-[170px]">{recipient.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-fintech-emerald/10 border border-fintech-emerald/30 text-fintech-emerald text-[9px] font-mono font-bold">
                      ATIVO
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Instituição:</span>
                      <span className="text-white font-medium truncate max-w-[150px]">{getBankName(recipient.bankCode)}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>Documento:</span>
                      <span className="text-slate-300">{maskCpfCnpj(recipient.document)}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>Agência / Conta:</span>
                      <span className="text-fintech-neon font-bold">{recipient.agency} / {recipient.account}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-fintech-border/60 flex items-center justify-between text-[10px] font-mono text-fintech-muted">
                  <span>ID: {recipient.id.slice(0, 8)}...</span>
                  <span className="text-purple-400 font-bold">Repasse SPI Direto</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Recipient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel border border-fintech-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-fintech-border">
              <h3 className="font-bold text-white text-base">Novo Seller para Split</h3>
              <button onClick={() => setShowModal(false)} className="text-fintech-muted hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateRecipient} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Razão Social / Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Magazine Varejo Eireli"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CNPJ ou CPF do Seller</label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0001-00"
                  value={document}
                  onChange={(e) => setDocument(maskCpfCnpj(e.target.value))}
                  className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Código do Banco (ISPB/COMPE)</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="260">260 - Nu Pagamentos (Nubank)</option>
                  <option value="001">001 - Banco do Brasil</option>
                  <option value="341">341 - Itaú Unibanco</option>
                  <option value="237">237 - Bradesco</option>
                  <option value="033">033 - Santander</option>
                  <option value="077">077 - Banco Inter</option>
                  <option value="290">290 - PagBank</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Agência</label>
                  <input
                    type="text"
                    required
                    placeholder="0001"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Conta com Dígito</label>
                  <input
                    type="text"
                    required
                    placeholder="123456-7"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-fintech-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-fintech-surface hover:bg-fintech-border text-white rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Salvando...' : 'Salvar Seller'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
