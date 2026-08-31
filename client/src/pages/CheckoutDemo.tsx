import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { maskCardNumber, maskExpiry } from '../utils/masks';
import { CreditCard, QrCode, CheckCircle2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const CheckoutDemo: React.FC = () => {
  const { merchant } = useAuth();
  const [method, setMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  
  const [name, setName] = useState('João Pedro da Silva');
  const [email, setEmail] = useState('joao.silva@email.com');
  const [document, setDocument] = useState('123.456.789-00');
  const [amount, setAmount] = useState(189.90);

  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [holderName, setHolderName] = useState('JOAO P SILVA');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [installments, setInstallments] = useState(1);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/transactions/process', {
        merchantApiKey: merchant?.apiKeyLive,
        amount: Number(amount),
        paymentMethod: method,
        customer: { name, email, document },
        creditCard: method === 'CREDIT_CARD' ? { cardNumber, holderName, expiry, cvv, installments: Number(installments) } : undefined
      });
      setResult(res.data.transaction);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (result?.pixPayload) {
      navigator.clipboard.writeText(result.pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Checkout Transparente Demo</h1>
        <p className="text-sm text-gray-400 mt-0.5">Ambiente de teste para simulação de vendas com geração de PIX e Cartão de Crédito.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 bg-pay-card/80 border border-pay-border rounded-2xl shadow-xl">
          <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('PIX')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer ${
                  method === 'PIX' ? 'bg-pay-accent/15 border-pay-accent text-white' : 'bg-pay-darker border-pay-border text-gray-400'
                }`}
              >
                <QrCode className="w-4 h-4 text-pay-emerald" />
                <span>PIX Instantâneo</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CREDIT_CARD')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer ${
                  method === 'CREDIT_CARD' ? 'bg-pay-accent/15 border-pay-accent text-white' : 'bg-pay-darker border-pay-border text-gray-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-pay-accent" />
                <span>Cartão de Crédito</span>
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-gray-400 mb-1">Nome do Comprador</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">E-mail</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">CPF</label>
                  <input type="text" required value={document} onChange={(e) => setDocument(e.target.value)} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono" />
                </div>
              </div>
            </div>

            {method === 'CREDIT_CARD' && (
              <div className="space-y-3 pt-2 border-t border-pay-border/60">
                <div>
                  <label className="block text-gray-400 mb-1">Número do Cartão</label>
                  <input type="text" required value={cardNumber} onChange={(e) => setCardNumber(maskCardNumber(e.target.value))} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-1">Validade</label>
                    <input type="text" required value={expiry} onChange={(e) => setExpiry(maskExpiry(e.target.value))} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">CVV</label>
                    <input type="text" required maxLength={4} value={cvv} onChange={(e) => setCvv(e.target.value)} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Parcelas</label>
                    <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))} className="w-full px-3 py-2 bg-pay-darker border border-pay-border rounded-xl text-white font-mono">
                      <option value={1}>1x de R$ {amount.toFixed(2)}</option>
                      <option value={2}>2x de R$ {(amount/2).toFixed(2)}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-pay-accent hover:bg-pay-accentHover text-white font-bold rounded-xl shadow-lg shadow-pay-accent/25 transition-all cursor-pointer disabled:opacity-50 text-sm"
            >
              {loading ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)}`}
            </button>
          </form>
        </div>

        <div className="p-6 bg-pay-card/80 border border-pay-border rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-3">Resumo do Pedido</h3>
            <div className="p-3 rounded-xl bg-pay-darker border border-pay-border text-xs space-y-2">
              <div className="flex justify-between text-gray-400"><span>Produto:</span><span className="text-white">Headset Gamer Pro</span></div>
              <div className="flex justify-between text-gray-400"><span>Frete:</span><span className="text-pay-emerald">Grátis</span></div>
              <div className="pt-2 border-t border-pay-border flex justify-between font-bold text-sm text-white"><span>Total:</span><span className="text-pay-accent font-mono">R$ {amount.toFixed(2)}</span></div>
            </div>

            {result && (
              <div className="mt-4 p-4 rounded-xl bg-pay-darker border border-pay-border text-center">
                {result.paymentMethod === 'PIX' ? (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-pay-emerald block">Escaneie o QR Code PIX:</span>
                    {result.pixQrCode && <img src={result.pixQrCode} alt="PIX" className="w-36 h-36 mx-auto rounded-lg border border-pay-border p-1 bg-white" />}
                    <button onClick={handleCopyPix} className="w-full py-2 px-3 bg-pay-card hover:bg-pay-border border border-pay-border text-xs text-white rounded-lg flex items-center justify-center gap-1 font-mono cursor-pointer">
                      {copied ? <Check className="w-3.5 h-3.5 text-pay-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar Chave PIX'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-4 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-pay-emerald mx-auto" />
                    <span className="font-bold text-white text-sm block">Pagamento Aprovado!</span>
                    <span className="text-[10px] text-gray-400 font-mono">Cartão Final {result.cardLastDigits} ({result.cardBrand})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
