import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { WebhookLog } from '../types';
import { 
  Webhook, 
  Key, 
  RefreshCw, 
  Send, 
  Check, 
  Copy, 
  Code2, 
  ShieldCheck, 
  Activity, 
  Terminal,
  ExternalLink,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

const nodeSnippet = `// Exemplo de Verificação no Node.js com Proteção a Replay Attacks (5 min)
const crypto = require('crypto');

function verifyPayStreamWebhook(payload, signatureHeader, secret) {
  const parts = signatureHeader.split(',');
  const timestamp = Number(parts.find(p => p.trim().startsWith('t='))?.replace('t=', ''));
  const receivedHash = parts.find(p => p.trim().startsWith('v1='))?.replace('v1=', '');

  // 1. Proteção contra Replay Attack (tolerância de 5 minutos = 300.000 ms)
  const toleranceMs = 5 * 60 * 1000;
  if (Math.abs(Date.now() - timestamp) > toleranceMs) {
    throw new Error('Assinatura expirada (possível Replay Attack detectado).');
  }

  // 2. Cálculo do HMAC-SHA256 com a chave secreta
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');

  // 3. Comparação em tempo constante contra Timing Attacks
  return crypto.timingSafeEqual(
    Buffer.from(receivedHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
};`;

export const Webhooks: React.FC = () => {
  const { merchant, user, refreshSession } = useAuth();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [webhookUrl, setWebhookUrl] = useState(merchant?.webhookUrl || user?.merchant.webhookUrl || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'payload' | 'signature' | 'sdk'>('payload');
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [rotatingKeys, setRotatingKeys] = useState(false);

  const handleRotateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setRotatingKeys(true);
    try {
      const res = await api.post('/auth/rotate-keys', { adminPassword });
      if (refreshSession) await refreshSession();
      setShowRotateModal(false);
      setAdminPassword('');
      setMsg({
        type: 'success',
        text: `Chaves rotacionadas com sucesso! Nova Live Key: ${res.data.apiKeyLive.slice(0, 16)}... • Antigas chaves revogadas.`
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: `Erro ao rotacionar chaves: ${err.message}` });
    } finally {
      setRotatingKeys(false);
    }
  };

  const secret = merchant?.webhookSecret || user?.merchant.webhookSecret || 'whsec_a1b2c3d4e5f67890123456789abcdef012345678';

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

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      await api.patch('/webhooks/endpoint', { webhookUrl });
      setMsg({ type: 'success', text: 'Endpoint de webhook salvo e verificado com sucesso!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: `Falha ao salvar: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateWebhook = async () => {
    setTesting(true);
    setMsg(null);
    try {
      const res = await api.post('/webhooks/test-ping');
      await loadLogs();
      const httpStatus = res.data.responseStatus || 200;
      const statusLabel = res.data.status === 'DELIVERED' ? 'Entregue' : 'Registrado';
      const sigPreview = res.data.signature ? res.data.signature.slice(0, 24) + '...' : '';
      setMsg({ 
        type: 'success', 
        text: `Webhook disparado com sucesso! Resposta HTTP ${httpStatus} (${statusLabel}) • Assinatura HMAC: ${sigPreview}` 
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: `Erro no disparo: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const samplePayload = {
    event: "transaction.paid",
    data: {
      id: "tx_8f920a1b",
      external_id: "#ORD-9842",
      amount: 1450.00,
      net_amount: 1406.15,
      fee_amount: 43.85,
      payment_method: "PIX",
      status: "PAID",
      customer: {
        name: "Lucas Ferreira",
        document: "84930219482",
        email: "lucas.ferreira@gmail.com"
      },
      settled_at: new Date().toISOString()
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Webhooks & Criptografia HMAC-SHA256
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-fintech-neon/10 border border-fintech-neon/30 text-fintech-neon font-semibold">
              EVENT-DRIVEN
            </span>
          </div>
          <p className="text-xs text-fintech-muted font-mono mt-0.5">
            Notificações em tempo real com integridade garantida via assinatura criptográfica X-PayStream-Signature.
          </p>
        </div>

        <button
          onClick={handleSimulateWebhook}
          disabled={testing}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-950/40 hover:shadow-emerald-900/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 w-fit"
        >
          <Send className="w-4 h-4 fill-current" />
          <span>{testing ? 'Disparando Ping...' : 'Disparar Webhook de Teste'}</span>
        </button>
      </div>

      {msg && (
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            msg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span className="font-mono text-xs break-all">{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-200 text-xs px-1 cursor-pointer">✕</button>
        </motion.div>
      )}

      {/* Endpoint & Signature Config Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Endpoint Form */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-fintech-border space-y-4">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Key className="w-4 h-4 text-fintech-neon" />
            <span>Configuração do Destino HTTP</span>
          </div>

          <form onSubmit={handleSaveUrl} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">URL de Destino (Endpoint no seu servidor)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://api.sualoja.com.br/webhooks/paystream"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-fintech-surface hover:bg-fintech-surfaceHover border border-fintech-border hover:border-fintech-neon/40 text-white font-medium rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                >
                  {saving ? 'Salvando...' : 'Salvar URL'}
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400">Chave Secreta de Assinatura (Webhook Secret):</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRotateModal(true)}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] cursor-pointer hover:underline"
                    title="Revogar chaves atuais e emitir novo par"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Rotacionar Chaves</span>
                  </button>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] cursor-pointer hover:underline"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSecret ? 'Copiado!' : 'Copiar Secret'}</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                readOnly
                value={secret}
                className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-slate-400 select-all focus:outline-none font-bold"
              />
            </div>
          </form>
        </div>

        {/* Right: HMAC Security Badge */}
        <div className="glass-panel p-6 rounded-2xl border border-fintech-border flex flex-col justify-between space-y-4 font-mono text-xs">
          <div>
            <div className="flex items-center gap-2 text-fintech-emerald font-bold mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Assinatura Criptográfica</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Cada payload enviado pelo PayStream contém o header:
            </p>
            <div className="p-2.5 rounded-lg bg-fintech-bg border border-fintech-border my-2 text-fintech-neon text-[10px] break-all font-bold">
              X-PayStream-Signature: t=1725112800,v1=9f8e7d...
            </div>
            <p className="text-fintech-muted text-[10px]">
              Evita ataques de repetição (*replay attacks*) e assegura que os dados vieram do PayStream.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-fintech-surface border border-fintech-border flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Algoritmo:</span>
            <span className="text-white font-bold">HMAC-SHA256 (256-bit)</span>
          </div>
        </div>

      </div>

      {/* Developer Sandbox: Payload Inspector */}
      <div className="glass-panel p-6 rounded-2xl border border-fintech-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fintech-border">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Code2 className="w-4 h-4 text-fintech-violet" />
            <span>Exemplo de Payload & Validação de Assinatura</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('payload')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'payload' ? 'bg-fintech-neon/15 text-fintech-neon font-bold border border-fintech-neon/30' : 'text-fintech-muted hover:text-white'
              }`}
            >
              Payload JSON
            </button>
            <button
              onClick={() => setActiveTab('sdk')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'sdk' ? 'bg-fintech-neon/15 text-fintech-neon font-bold border border-fintech-neon/30' : 'text-fintech-muted hover:text-white'
              }`}
            >
              Validação no Node.js
            </button>
          </div>
        </div>

        {activeTab === 'payload' ? (
          <div className="p-4 rounded-xl bg-fintech-bg border border-fintech-border font-mono text-xs overflow-x-auto custom-scrollbar">
            <pre className="text-fintech-neon leading-relaxed">
              {JSON.stringify(samplePayload, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-fintech-bg border border-fintech-border font-mono text-xs overflow-x-auto custom-scrollbar">
            <pre className="text-slate-300 leading-relaxed font-mono text-xs overflow-x-auto">
              {nodeSnippet}
            </pre>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl border border-fintech-border overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-fintech-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm font-sans">Histórico de Disparos de Webhooks</h3>
            <p className="text-[11px] text-fintech-muted font-mono">Últimas notificações enviadas para seu endpoint</p>
          </div>
          <button 
            onClick={loadLogs} 
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-fintech-neon' : ''}`} /> Atualizar
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-fintech-bg/90 border-b border-fintech-border text-fintech-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Evento</th>
                <th className="py-3 px-4">Destino (URL)</th>
                <th className="py-3 px-4">Assinatura HMAC</th>
                <th className="py-3 px-4">Tentativas</th>
                <th className="py-3 px-4 text-right">HTTP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/50 text-slate-300">
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-fintech-muted font-mono">
                    <p className="text-sm">Nenhum disparo de webhook registrado.</p>
                    <span className="text-[11px] text-slate-600 block mt-1">Clique em "Disparar Webhook de Teste" ou faça uma transação.</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-fintech-surfaceHover/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString('pt-BR')} {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-fintech-neon">
                      {log.event}
                    </td>
                    <td className="py-3.5 px-4 truncate max-w-xs text-slate-300">
                      {log.endpointUrl}
                    </td>
                    <td className="py-3.5 px-4 text-[10px] text-slate-500 font-bold">
                      {log.signature.slice(0, 18)}...
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {log.attempts || 1}x
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-fintech-emerald/10 border border-fintech-emerald/30 text-fintech-emerald font-bold text-[10px]">
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
    
      {/* Modal de Confirmação para Rotação de Chaves */}
      {showRotateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Rotacionar Chaves de API</h3>
                <p className="text-xs text-slate-400 font-normal">Revogação imediata de credenciais antigas</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Por segurança bancária, a Live API Key e o Webhook Secret atuais serão revogados permanentemente. Suas integrações deverão ser atualizadas com as novas credenciais.
            </p>

            <form onSubmit={handleRotateKeys} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 font-sans">
                  Senha do Administrador
                </label>
                <input
                  type="password"
                  required
                  placeholder="Digite sua senha de login"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowRotateModal(false); setAdminPassword(''); }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={rotatingKeys || !adminPassword}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-semibold text-xs transition-all shadow-md shadow-rose-950/40 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {rotatingKeys ? 'Rotacionando...' : 'Confirmar e Rotacionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
