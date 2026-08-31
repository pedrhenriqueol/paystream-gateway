import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Transaction } from '../types';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions');
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTransactions(); }, []);

  const handleSimulatePixPaid = async (txId: string) => {
    setSimulating(txId);
    try {
      await api.post(`/transactions/${txId}/simulate-pix-paid`);
      await loadTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transações & Livro Caixa</h1>
          <p className="text-sm text-gray-400 mt-0.5">Histórico completo de pagamentos recebidos via PIX e Cartão.</p>
        </div>

        <button
          onClick={loadTransactions}
          className="px-3.5 py-2 bg-pay-card hover:bg-pay-border border border-pay-border rounded-xl text-xs font-medium text-gray-300 flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      <div className="bg-pay-card/60 border border-pay-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-pay-darker/60 border-b border-pay-border text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Valor Bruto</th>
                <th className="py-3 px-4">Taxa</th>
                <th className="py-3 px-4">Líquido</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pay-border/40 text-gray-300">
              {transactions.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 italic">
                    Nenhuma transação encontrada. Vá até "Checkout Demo" para simular uma compra.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-pay-dark/40 transition-colors">
                    <td className="py-3.5 px-4 text-gray-400">
                      {new Date(tx.createdAt).toLocaleTimeString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-medium text-white">
                      <div>{tx.customerName}</div>
                      <span className="text-[10px] text-gray-500 font-mono">{tx.customerEmail}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-pay-dark border border-pay-border/80 text-[10px] font-bold text-pay-accent">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      R$ {Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-pay-rose">
                      - R$ {Number(tx.feeAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-pay-emerald">
                      R$ {Number(tx.netAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        tx.status === 'PAID'
                          ? 'bg-pay-emerald/10 border-pay-emerald/30 text-pay-emerald'
                          : 'bg-pay-amber/10 border-pay-amber/30 text-pay-amber'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {tx.status === 'PENDING' && tx.paymentMethod === 'PIX' ? (
                        <button
                          onClick={() => handleSimulatePixPaid(tx.id)}
                          disabled={simulating === tx.id}
                          className="px-2.5 py-1 bg-pay-emerald/20 hover:bg-pay-emerald/30 border border-pay-emerald/40 text-pay-emerald rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {simulating === tx.id ? 'Confirmando...' : '⚡ Confirmar PIX'}
                        </button>
                      ) : (
                        <span className="text-gray-500 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
