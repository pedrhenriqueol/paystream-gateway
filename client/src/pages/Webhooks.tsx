import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { WebhookLog } from '../types';
import { Key, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const Webhooks: React.FC = () => {
  const { merchant } = useAuth();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [webhookUrl, setWebhookUrl] = useState(merchant?.webhookUrl || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/webhooks/logs');
      setLogs(res.data.webhooks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      await api.patch('/webhooks/endpoint', { webhookUrl });
      setMsg('Endpoint de webhook atualizado com sucesso!');
    } catch (err: any) {
      setMsg(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Webhooks & Assinatura HMAC-SHA256</h1>
        <p className="text-sm text-gray-400 mt-0.5">Notificação em tempo real de liquidação de pagamentos para sua plataforma de e-commerce.</p>
      </div>

      <div className="p-6 bg-pay-card/80 border border-pay-border rounded-2xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-pay-accent" />
          <span>Credenciais & Endpoint de Notificação</span>
        </h3>

        {msg && (
          <div className="p-3 rounded-xl bg-pay-accent/10 border border-pay-accent/30 text-pay-accent text-xs">
            {msg}
          </div>
        )}

        <form onSubmit={handleSaveUrl} className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">URL de Destino (Endpoint no seu servidor)</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://api.sualoja.com.br/webhooks/paystream"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-pay-accent hover:bg-pay-accentHover text-white font-medium rounded-xl cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Endpoint'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">Segredo de Assinatura HMAC (whsec_*)</label>
            <input
              type="text"
              readOnly
              value={merchant?.webhookSecret || 'whsec_••••••••••••••••••••••••'}
              className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-gray-400 font-mono select-all"
            />
          </div>
        </form>
      </div>

      <div className="bg-pay-card/60 border border-pay-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-pay-border flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">Disparos Recentes de Webhook</h3>
          <button onClick={loadLogs} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-mono">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-pay-darker/60 border-b border-pay-border text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Evento</th>
                <th className="py-3 px-4">URL de Destino</th>
                <th className="py-3 px-4">Assinatura HMAC</th>
                <th className="py-3 px-4">HTTP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pay-border/40 text-gray-300">
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 italic">
                    Nenhum disparo de webhook registrado. Realize uma transação para testar.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-pay-dark/40 transition-colors">
                    <td className="py-3 px-4 text-gray-400">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</td>
                    <td className="py-3 px-4 font-bold text-pay-accent">{log.event}</td>
                    <td className="py-3 px-4 truncate max-w-xs">{log.endpointUrl}</td>
                    <td className="py-3 px-4 text-[10px] text-gray-500">{log.signature.slice(0, 16)}...</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-pay-emerald/10 border border-pay-emerald/30 text-pay-emerald font-bold">
                        {log.responseStatus || 200} OK
                      </span>
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
