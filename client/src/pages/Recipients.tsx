import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Recipient } from '../types';
import { Users, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Recipients: React.FC = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [bankCode, setBankCode] = useState('260');
  const [agency, setAgency] = useState('0001');
  const [account, setAccount] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recipients');
      setRecipients(res.data.recipients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecipients(); }, []);

  const handleCreateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await api.post('/recipients', {
        name: name.trim(),
        document: document.trim(),
        bankCode,
        agency,
        account: account.trim()
      });
      setName('');
      setDocument('');
      setAccount('');
      setIsModalOpen(false);
      await loadRecipients();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Recebedores & Split de Marketplace</h1>
          <p className="text-sm text-gray-400 mt-0.5">Contas bancárias de vendedores parceiros para repasse automático de comissão.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 bg-pay-accent hover:bg-pay-accentHover text-white font-medium rounded-xl transition-all shadow-lg shadow-pay-accent/25 flex items-center gap-2 text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Vendedor / Seller</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recipients.map((rec) => (
          <div key={rec.id} className="p-5 rounded-2xl bg-pay-card/70 border border-pay-border hover:border-pay-accent/50 transition-all shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-pay-dark border border-pay-border text-pay-accent">
                  Banco {rec.bankCode}
                </span>
                <span className="text-[10px] font-mono text-pay-emerald flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pay-emerald inline-block" />
                  Conta Ativa
                </span>
              </div>

              <h3 className="font-semibold text-white text-base leading-snug">{rec.name}</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">Doc: {rec.document}</p>

              <div className="mt-4 pt-3 border-t border-pay-border/60 text-xs font-mono text-gray-400 space-y-1">
                <div>Agência: <span className="text-white">{rec.agency}</span></div>
                <div>Conta: <span className="text-white">{rec.account}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-pay-border/40 text-xs text-gray-500 font-mono">
              {rec._count?.splits || 0} divisões de split recebidas
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-pay-card border border-pay-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-pay-border">
                <h3 className="font-bold text-white text-base">Novo Recebedor (Split)</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateRecipient} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Nome Completo / Razão Social *</label>
                  <input type="text" required placeholder="Ex: Loja do João" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">CPF / CNPJ *</label>
                  <input type="text" required placeholder="000.000.000-00" value={document} onChange={(e) => setDocument(e.target.value)} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Código do Banco *</label>
                    <input type="text" required placeholder="260 (Nubank)" value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Agência *</label>
                    <input type="text" required placeholder="0001" value={agency} onChange={(e) => setAgency(e.target.value)} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Conta Corrente / Chave PIX *</label>
                  <input type="text" required placeholder="1234567-8" value={account} onChange={(e) => setAccount(e.target.value)} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono" />
                </div>
                <div className="pt-3 border-t border-pay-border flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1 text-gray-400 hover:text-white">Cancelar</button>
                  <button type="submit" disabled={formLoading} className="px-4 py-1.5 bg-pay-accent text-white font-medium rounded-xl text-xs">{formLoading ? 'Salvando...' : 'Salvar Recebedor'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
