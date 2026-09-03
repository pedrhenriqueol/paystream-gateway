import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Transaction, PaymentMethod, TransactionStatus } from '../types';
import { 
  Layers, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ArrowUpRight, 
  CreditCard, 
  QrCode, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  X, 
  ExternalLink,
  Copy,
  Check,
  Split,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

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

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSimulatePixPaid = async (txId: string) => {
    setSimulating(txId);
    try {
      await api.post(`/transactions/${txId}/simulate-pix-paid`);
      await loadTransactions();
      if (selectedTx && selectedTx.id === txId) {
        setSelectedTx(prev => prev ? { ...prev, status: 'PAID', paidAt: new Date().toISOString() } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(null);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.externalId && tx.externalId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || tx.paymentMethod === methodFilter;
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const [statementChecksum, setStatementChecksum] = useState<string | null>(null);

  const exportAuditedStatement = async () => {
    try {
      const res = await api.get('/transactions/export-statement');
      const data = res.data;
      setStatementChecksum(data.checksum);

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `paystream_extrato_conciliacao_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      console.error("Falha ao exportar extrato:", err.message);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'External ID', 'Data', 'Metodo', 'Status', 'Cliente', 'CPF/CNPJ', 'Valor Bruto', 'Fee Gateway', 'Valor Liquido'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      tx.externalId || '',
      new Date(tx.createdAt).toISOString(),
      tx.paymentMethod,
      tx.status,
      `"${tx.customerName.replace(/"/g, '""')}"`,
      tx.customerDoc,
      Number(tx.amount).toFixed(2),
      Number(tx.feeAmount).toFixed(2),
      Number(tx.netAmount).toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `paystream_conciliacao_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Ledger Financeiro & Transações
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-fintech-surface border border-fintech-border text-fintech-neon font-semibold">
              {transactions.length} registros
            </span>
          </div>
          <p className="text-xs text-fintech-muted font-mono mt-0.5">
            Conciliação de transações multi-método, detalhamento de splits e liquidação instantânea.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-sans"
            title="Exportar Planilha de Conciliação em CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Planilha CSV</span>
          </button>

          <button
            onClick={exportAuditedStatement}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs text-emerald-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-sans font-medium shadow-xs"
            title="Exportar Extrato Oficial Auditado com Checksum SHA-256"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Extrato Auditado (SHA-256)</span>
          </button>

          <button
            onClick={loadTransactions}
            className="p-2 bg-fintech-surface hover:bg-fintech-surfaceHover border border-fintech-border hover:border-fintech-neon/40 text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Atualizar Livro Caixa"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-fintech-neon' : ''}`} />
          </button>
        </div>
      </div>

      {statementChecksum && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Checksum de Auditoria Contábil: <strong className="text-white">{statementChecksum}</strong></span>
          </div>
          <button onClick={() => setStatementChecksum(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </motion.div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-fintech-border flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-fintech-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, e-mail, pedido ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fintech-neon font-mono transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Method Filter */}
          <div className="flex items-center gap-1 bg-fintech-bg p-1 rounded-xl border border-fintech-border text-xs font-mono">
            {['ALL', 'PIX', 'CREDIT_CARD'].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                  methodFilter === m 
                    ? 'bg-fintech-neon/15 text-fintech-neon font-bold border border-fintech-neon/30' 
                    : 'text-fintech-muted hover:text-white'
                }`}
              >
                {m === 'ALL' ? 'Todos Métodos' : m === 'PIX' ? 'PIX' : 'Cartão'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-fintech-bg p-1 rounded-xl border border-fintech-border text-xs font-mono">
            {['ALL', 'PAID', 'PENDING'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                  statusFilter === s 
                    ? 'bg-fintech-emerald/15 text-fintech-emerald font-bold border border-fintech-emerald/30' 
                    : 'text-fintech-muted hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'Todos Status' : s === 'PAID' ? 'Aprovadas' : 'Pendentes'}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-2xl border border-fintech-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-mono min-w-[850px]">
            <thead className="bg-fintech-bg/90 border-b border-fintech-border text-fintech-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Identificador / Data</th>
                <th className="py-3 px-4">Comprador</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Valor Bruto</th>
                <th className="py-3 px-4">Fee Gateway</th>
                <th className="py-3 px-4">Líquido</th>
                <th className="py-3 px-4">Split</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={9} className="py-4 px-4">
                      <div className="h-4 bg-slate-800/60 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400">
                        <Filter className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-200">Nenhuma transação encontrada</p>
                      <p className="text-xs text-slate-500 font-sans">
                        Não existem transações registradas para os filtros aplicados
                        {methodFilter !== 'ALL' ? ` • Método: ${methodFilter === 'PIX' ? 'PIX' : 'Cartão'}` : ''}
                        {statusFilter !== 'ALL' ? ` • Status: ${statusFilter === 'PAID' ? 'Aprovadas' : 'Pendentes'}` : ''}
                        {searchTerm ? ` • Busca: "${searchTerm}"` : ''}.
                      </p>
                      {(methodFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm) && (
                        <button
                          type="button"
                          onClick={() => {
                            setMethodFilter('ALL');
                            setStatusFilter('ALL');
                            setSearchTerm('');
                          }}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer font-sans shadow-xs"
                        >
                          Limpar todos os filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-fintech-surfaceHover/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white group-hover:text-fintech-neon transition-colors flex items-center gap-1.5">
                        <span>{tx.externalId || `#TX-${tx.id.slice(0, 8)}`}</span>
                        <ChevronRight className="w-3 h-3 text-fintech-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[10px] text-fintech-muted block mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR')} • {new Date(tx.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <p className="font-medium text-white text-xs">{tx.customerName}</p>
                      <span className="text-[10px] text-fintech-muted font-mono">{tx.customerEmail}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-fintech-bg border border-fintech-border text-[10px] font-bold text-fintech-neon flex items-center gap-1 w-fit">
                        {tx.paymentMethod === 'PIX' ? <QrCode className="w-3 h-3 text-fintech-neon" /> : <CreditCard className="w-3 h-3 text-fintech-violet" />}
                        <span>{tx.paymentMethod === 'CREDIT_CARD' ? `${tx.cardBrand || 'CARD'} (${tx.installments}x)` : 'PIX'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      R$ {Number(tx.amount).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-fintech-rose">
                      - R$ {Number(tx.feeAmount).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-fintech-emerald">
                      R$ {Number(tx.netAmount).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4">
                      {tx.splits && tx.splits.length > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Split className="w-2.5 h-2.5" />
                          <span>{tx.splits.length} Seller(s)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 w-fit ${
                        tx.status === 'PAID'
                          ? 'bg-fintech-emerald/10 border-fintech-emerald/30 text-fintech-emerald'
                          : tx.status === 'PENDING'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-fintech-rose/10 border-fintech-rose/30 text-fintech-rose'
                      }`}>
                        {tx.status === 'PAID' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {tx.status === 'PENDING' && <Clock className="w-2.5 h-2.5" />}
                        <span>{tx.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {tx.status === 'PENDING' && tx.paymentMethod === 'PIX' ? (
                        <button
                          onClick={() => handleSimulatePixPaid(tx.id)}
                          disabled={simulating === tx.id}
                          className="px-2.5 py-1 bg-fintech-emerald/20 hover:bg-fintech-emerald/30 border border-fintech-emerald/40 text-fintech-emerald rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 ml-auto"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{simulating === tx.id ? 'Liquidando...' : 'Simular Baixa PIX'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-fintech-muted font-mono">D+1 Liquidado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Drawer / Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass-panel border-l sm:border border-fintech-border w-full max-w-xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl p-6 shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar relative"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-fintech-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-fintech-neon/10 border border-fintech-neon/30 flex items-center justify-center text-fintech-neon font-bold">
                      #
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Detalhes da Transação</h3>
                      <p className="text-[11px] text-fintech-muted font-mono">{selectedTx.id}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="p-1.5 rounded-lg text-fintech-muted hover:text-white hover:bg-fintech-surface cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-3 gap-3 my-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-fintech-bg border border-fintech-border">
                    <span className="text-[10px] text-fintech-muted block">STATUS</span>
                    <span className={`font-bold ${selectedTx.status === 'PAID' ? 'text-fintech-emerald' : 'text-amber-400'}`}>
                      {selectedTx.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-fintech-bg border border-fintech-border">
                    <span className="text-[10px] text-fintech-muted block">MÉTODO</span>
                    <span className="font-bold text-fintech-neon">{selectedTx.paymentMethod}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-fintech-bg border border-fintech-border">
                    <span className="text-[10px] text-fintech-muted block">VALOR LÍQUIDO</span>
                    <span className="font-bold text-fintech-emerald">R$ {Number(selectedTx.netAmount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-3 py-3 border-t border-fintech-border text-xs font-mono">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dados do Comprador</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Nome: <span className="text-white font-sans font-medium">{selectedTx.customerName}</span></div>
                    <div>Documento: <span className="text-white">{selectedTx.customerDoc}</span></div>
                    <div className="col-span-2">E-mail: <span className="text-white">{selectedTx.customerEmail}</span></div>
                  </div>
                </div>

                {/* Payment Specifics (PIX or Card) */}
                <div className="space-y-3 py-3 border-t border-fintech-border text-xs font-mono">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Metadados de Pagamento</h4>
                  
                  {selectedTx.paymentMethod === 'PIX' ? (
                    <div className="p-3 rounded-xl bg-fintech-bg border border-fintech-border space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-fintech-muted">PIX Copia e Cola Payload:</span>
                        <button 
                          onClick={() => {
                            if (selectedTx.pixPayload) {
                              navigator.clipboard.writeText(selectedTx.pixPayload);
                              setCopiedPayload(true);
                              setTimeout(() => setCopiedPayload(false), 2000);
                            }
                          }}
                          className="text-fintech-neon hover:underline flex items-center gap-1 text-[10px] cursor-pointer"
                        >
                          {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPayload ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 break-all bg-fintech-surface p-2 rounded-lg border border-fintech-border/50">
                        {selectedTx.pixPayload || 'Payload EMVCo SPI gerado'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-fintech-bg border border-fintech-border grid grid-cols-2 gap-2 text-[11px]">
                      <div>Bandeira: <span className="text-white font-bold">{selectedTx.cardBrand}</span></div>
                      <div>Final do Cartão: <span className="text-white font-bold">•••• {selectedTx.cardLastDigits}</span></div>
                      <div>Parcelamento: <span className="text-white">{selectedTx.installments}x sem juros</span></div>
                      <div>Autorização: <span className="text-fintech-emerald font-bold">Aprovada NSU-84920</span></div>
                    </div>
                  )}
                </div>

                {/* Splits Information */}
                {selectedTx.splits && selectedTx.splits.length > 0 && (
                  <div className="space-y-3 py-3 border-t border-fintech-border text-xs font-mono">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Split className="w-3.5 h-3.5" />
                      <span>Divisão de Split (Marketplace)</span>
                    </h4>
                    <div className="space-y-2">
                      {selectedTx.splits.map((s) => (
                        <div key={s.id} className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-white">{s.recipient?.name || 'Seller'}</span>
                            <span className="text-[10px] text-fintech-muted block">Banco: {s.recipient?.bankCode} • Ag: {s.recipient?.agency}</span>
                          </div>
                          <span className="font-bold text-purple-300">R$ {Number(s.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-fintech-border flex justify-end gap-2">
                {selectedTx.status === 'PENDING' && selectedTx.paymentMethod === 'PIX' && (
                  <button
                    onClick={() => handleSimulatePixPaid(selectedTx.id)}
                    disabled={simulating === selectedTx.id}
                    className="px-4 py-2 bg-fintech-emerald hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-fintech-emerald/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{simulating === selectedTx.id ? 'Confirmando...' : 'Confirmar Liquidação PIX'}</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedTx(null)}
                  className="px-4 py-2 bg-fintech-surface hover:bg-fintech-border text-white text-xs font-mono rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
