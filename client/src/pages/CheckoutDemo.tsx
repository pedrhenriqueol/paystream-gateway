import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { maskCardNumber, maskExpiry, maskCpfCnpj } from '../utils/masks';
import { 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag, 
  Clock, 
  Lock, 
  RefreshCw,
  ArrowRight,
  Split,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CheckoutDemo: React.FC = () => {
  const { merchant, user } = useAuth();
  const [method, setMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  
  // Customer
  const [name, setName] = useState('João Pedro Oliveira');
  const [email, setEmail] = useState('pedro.cliente@exemplo.com');
  const [document, setDocument] = useState('458.923.010-99');
  const [amount, setAmount] = useState<number>(349.90);

  // Credit Card
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [holderName, setHolderName] = useState('JOAO P OLIVEIRA');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [installments, setInstallments] = useState(1);

  // Flow State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 min
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiKey = merchant?.apiKeyLive || user?.merchant.apiKeyLive;

  useEffect(() => {
    let timer: any;
    if (result && result.paymentMethod === 'PIX') {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [result]);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMessage(null);
    setCountdown(900);

    try {
      // Gera chave de idempotência exclusiva para proteção contra double-click/dupla cobrança
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await api.post('/transactions/process', {
        merchantApiKey: apiKey,
        externalId: idempotencyKey,
        amount: Number(amount),
        paymentMethod: method,
        customer: { name, email, document },
        creditCard: method === 'CREDIT_CARD' ? { cardNumber, holderName, expiry, cvv, installments: Number(installments) } : undefined
      }, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      setResult(res.data.transaction);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha no processamento do pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (result?.pixPayload) {
      navigator.clipboard.writeText(result.pixPayload);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    }
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('5')) return 'MASTERCARD';
    if (clean.startsWith('6')) return 'ELO';
    if (clean.startsWith('3')) return 'AMEX';
    return 'CREDIT';
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Checkout Sandbox Transparente
          </h1>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-fintech-neon/10 border border-fintech-neon/30 text-fintech-neon font-semibold">
            PCI-DSS COMPLIANT
          </span>
        </div>
        <p className="text-xs text-fintech-muted font-mono mt-0.5">
          Simule uma experiência real de pagamento direto no seu e-commerce com motor de alta conversão.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Form & 3D Visual Card */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Credit Card Visual Card */}
          {method === 'CREDIT_CARD' && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full aspect-[1.586/1] max-w-sm mx-auto rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-fintech-neon/40 p-6 shadow-2xl shadow-fintech-neon/10 relative overflow-hidden flex flex-col justify-between text-white font-mono"
            >
              {/* Chip & Brand */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-8 rounded-md bg-gradient-to-r from-yellow-300 to-amber-500 border border-amber-600/50 shadow-inner flex items-center justify-center opacity-90">
                  <div className="w-8 h-5 border border-amber-800/40 rounded-[2px]" />
                </div>
                <span className="font-extrabold tracking-widest text-sm text-fintech-neon">
                  {getCardBrand(cardNumber)}
                </span>
              </div>

              {/* Number */}
              <div className="tracking-[0.25em] text-lg font-bold text-slate-100 drop-shadow">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>

              {/* Holder & Expiry */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block tracking-widest">TITULAR</span>
                  <span className="font-bold tracking-wider truncate max-w-[170px] block">
                    {holderName.toUpperCase() || 'NOME DO TITULAR'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block tracking-widest">VALIDADE</span>
                  <span className="font-bold tracking-wider">{expiry || 'MM/AA'}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Box */}
          <div className="glass-panel p-6 rounded-2xl border border-fintech-border space-y-5">
            
            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('PIX')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs font-mono transition-all cursor-pointer ${
                  method === 'PIX'
                    ? 'bg-fintech-neon/15 border-fintech-neon text-fintech-neon shadow-lg shadow-fintech-neon/15'
                    : 'bg-fintech-bg border-fintech-border text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>PIX Instantâneo</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CREDIT_CARD')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs font-mono transition-all cursor-pointer ${
                  method === 'CREDIT_CARD'
                    ? 'bg-fintech-neon/15 border-fintech-neon text-fintech-neon shadow-lg shadow-fintech-neon/15'
                    : 'bg-fintech-bg border-fintech-border text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cartão de Crédito</span>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs font-mono">
              
              {/* Buyer Info */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">1. Dados do Comprador</span>
                
                <div>
                  <label className="block text-slate-400 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">E-mail</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">CPF / CNPJ</label>
                    <input
                      type="text"
                      required
                      value={document}
                      onChange={(e) => setDocument(maskCpfCnpj(e.target.value))}
                      className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                    />
                  </div>
                </div>
              </div>

              {/* Card Info */}
              {method === 'CREDIT_CARD' && (
                <div className="space-y-3 pt-3 border-t border-fintech-border">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">2. Dados do Cartão</span>
                  
                  <div>
                    <label className="block text-slate-400 mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                      className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nome Impresso no Cartão</label>
                    <input
                      type="text"
                      required
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Validade</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={(e) => setExpiry(maskExpiry(e.target.value))}
                        className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">CVV</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Parcelas</label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-fintech-bg border border-fintech-border rounded-xl text-white focus:outline-none focus:border-fintech-neon"
                      >
                        <option value={1}>1x de R$ {amount.toFixed(2)}</option>
                        <option value={2}>2x de R$ {(amount / 2).toFixed(2)}</option>
                        <option value={3}>3x de R$ {(amount / 3).toFixed(2)}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-fintech-neon via-cyan-400 to-fintech-neon hover:opacity-90 text-black font-extrabold rounded-xl shadow-xl shadow-fintech-neon/20 transition-all cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 fill-current" />
                <span>{loading ? 'Processando Autorização...' : `Confirmar Pagamento de R$ ${amount.toFixed(2)}`}</span>
              </button>

            </form>
          </div>

        </div>

        {/* Right Column: Order Summary & Dynamic Settlement State */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Order Summary Card */}
          <div className="glass-panel p-6 rounded-2xl border border-fintech-border space-y-4">
            <div className="flex items-center gap-2 font-bold text-white text-base pb-3 border-b border-fintech-border">
              <ShoppingBag className="w-4 h-4 text-fintech-neon" />
              <span>Resumo do Pedido Demo</span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-fintech-bg border border-fintech-border flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Servidor Cloud Enterprise v3</span>
                  <span className="text-[10px] text-fintech-muted">Plano Anual • SLA 99.99%</span>
                </div>
                <span className="font-bold text-white">R$ {amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-400 pt-1">
                <span>Subtotal:</span>
                <span className="text-white">R$ {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Taxa de Processamento:</span>
                <span className="text-fintech-emerald">Inclusa</span>
              </div>
              <div className="pt-2 border-t border-fintech-border flex justify-between font-bold text-sm text-white">
                <span>Total a Pagar:</span>
                <span className="text-fintech-neon font-mono">R$ {amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Result Card (PIX or Card Settlement) */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-panel p-6 rounded-2xl border border-fintech-neon/40 shadow-2xl shadow-fintech-neon/10 space-y-4 text-center font-mono"
              >
                {result.paymentMethod === 'PIX' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-fintech-border">
                      <span className="text-fintech-emerald font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-fintech-emerald animate-ping" />
                        PIX SPI Gerado
                      </span>
                      <span className="text-fintech-muted flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Expira em: <strong className="text-amber-400">{formatTimer(countdown)}</strong>
                      </span>
                    </div>

                    {result.pixQrCode && (
                      <div className="p-3 bg-white rounded-2xl w-fit mx-auto shadow-2xl border-2 border-fintech-neon relative group">
                        <img src={result.pixQrCode} alt="PIX QR Code" className="w-44 h-44 mx-auto" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[11px] text-slate-400 block">Código Copia e Cola:</span>
                      <button
                        onClick={handleCopyPix}
                        className="w-full py-2.5 px-4 bg-fintech-bg hover:bg-fintech-surfaceHover border border-fintech-border hover:border-fintech-neon/40 text-xs text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all font-bold"
                      >
                        {copiedPix ? <Check className="w-4 h-4 text-fintech-emerald" /> : <Copy className="w-4 h-4 text-fintech-neon" />}
                        <span>{copiedPix ? 'Chave Copiada com Sucesso!' : 'Copiar Código PIX'}</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-fintech-muted leading-relaxed">
                      Após o pagamento no seu banco, a baixa ocorre instantaneamente via Webhook em menos de 1 segundo.
                    </p>
                  </div>
                ) : (
                  <div className="py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-fintech-emerald/10 border border-fintech-emerald/30 flex items-center justify-center mx-auto text-fintech-emerald">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white text-lg font-sans">Pagamento Aprovado!</h3>
                    <p className="text-xs text-slate-400">
                      Cartão final <strong className="text-white">{result.cardLastDigits}</strong> ({result.cardBrand})
                    </p>
                    <span className="inline-block px-3 py-1 rounded-full bg-fintech-surface border border-fintech-border text-[10px] text-fintech-emerald font-bold">
                      NSU-98420 • LIQUIDAÇÃO IMEDIATA
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </motion.div>
  );
};
