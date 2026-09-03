import crypto from 'crypto';
import { prisma } from '../prisma.js';

interface DispatchWebhookOptions {
  merchantId: string;
  transactionId: string;
  event: string;
  payload: any;
  endpointUrl: string;
  secret: string;
  maxAttempts?: number;
}

/**
 * Cria a assinatura HMAC-SHA256 vinculando deterministicamente o timestamp ao payload.
 * Padrão Stripe/Fintech: HMAC(secret, `${timestamp}.${payloadString}`)
 */
export function generateWebhookSignature(payload: any, secret: string, timestamp: number = Date.now()): { signature: string; timestamp: number } {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signedData = `${timestamp}.${payloadString}`;
  const hash = crypto.createHmac('sha256', secret).update(signedData).digest('hex');
  return {
    signature: `t=${timestamp},v1=${hash}`,
    timestamp
  };
}

/**
 * Disparador assíncrono e resiliente de webhooks com timeout adaptativo,
 * retentativas com exponential backoff e persistência no WebhookLog.
 */
export async function dispatchWebhook(options: DispatchWebhookOptions): Promise<void> {
  const {
    merchantId,
    transactionId,
    event,
    payload,
    endpointUrl,
    secret,
    maxAttempts = 3
  } = options;

  // Executa em background sem bloquear o retorno HTTP da transação
  setImmediate(async () => {
    const { signature, timestamp } = generateWebhookSignature(payload, secret);
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    let currentAttempt = 1;
    let finalStatus: 'DELIVERED' | 'FAILED' = 'FAILED';
    let responseStatus: number | null = null;

    while (currentAttempt <= maxAttempts) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-PayStream-Signature': signature,
            'X-PayStream-Event': event,
            'X-PayStream-Timestamp': String(timestamp),
            'X-PayStream-Attempt': String(currentAttempt)
          },
          body: payloadString,
          signal: controller.signal
        });

        clearTimeout(timeout);
        responseStatus = response.status;

        if (response.ok) {
          finalStatus = 'DELIVERED';
          break; // Sucesso na entrega
        }
      } catch (err: any) {
        responseStatus = err.name === 'AbortError' ? 504 : 502;
      }

      // Se falhou e ainda restam tentativas, aplica backoff exponencial com jitter
      if (currentAttempt < maxAttempts) {
        const backoffMs = Math.min(1000 * Math.pow(2, currentAttempt - 1) + Math.random() * 200, 5000);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
      currentAttempt++;
    }

    // Persiste no banco de dados o log de entrega verificado
    try {
      await prisma.webhookLog.create({
        data: {
          merchantId,
          transactionId,
          event,
          payload,
          signature,
          endpointUrl,
          responseStatus,
          status: finalStatus,
          attempts: Math.min(currentAttempt, maxAttempts)
        }
      });
    } catch (err) {
      console.error('Falha ao persistir WebhookLog:', err);
    }
  });
}
