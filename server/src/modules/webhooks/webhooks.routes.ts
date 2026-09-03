import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../../shared/prisma.js';
import { authenticate } from '../../middlewares/auth.js';
import { AppError } from '../../shared/errors/AppError.js';
import { dispatchWebhook, generateWebhookSignature } from '../../shared/services/webhookDispatcher.js';

export async function webhookRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ── 1. LISTAR LOGS DE WEBHOOK DO MERCHANT ──
  app.get('/logs', async (request, reply) => {
    const { merchantId } = request.user;

    const webhooks = await prisma.webhookLog.findMany({
      where: { merchantId },
      include: {
        transaction: {
          select: { id: true, amount: true, paymentMethod: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return reply.send({ webhooks });
  });

  // ── 2. ATUALIZAR URL DE WEBHOOK DO MERCHANT ──
  app.patch('/endpoint', async (request, reply) => {
    const bodySchema = z.object({
      webhookUrl: z.string().url().or(z.literal(''))
    });

    const { webhookUrl } = bodySchema.parse(request.body);
    const { merchantId } = request.user;

    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: { webhookUrl: webhookUrl || null }
    });

    return reply.send({ message: 'URL de webhook atualizada!', merchant: updated });
  });

  // ── 3. DISPARAR WEBHOOK DE TESTE (SIMULAÇÃO HMAC-SHA256 COM BACKOFF) ──
  const testPingHandler = async (request: any, reply: any) => {
    const { merchantId } = request.user;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        transactions: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!merchant) {
      throw new AppError('Merchant não encontrado.', 404);
    }

    let transactionId = merchant.transactions[0]?.id;

    if (!transactionId) {
      const testTx = await prisma.transaction.create({
        data: {
          merchantId,
          amount: 249.90,
          netAmount: 242.43,
          feeAmount: 7.47,
          paymentMethod: 'PIX',
          status: 'PAID',
          customerName: 'Cliente Simulado Teste',
          customerEmail: 'sandbox@paystream.com.br',
          customerDoc: '12345678901',
          paidAt: new Date()
        }
      });
      transactionId = testTx.id;
    }

    const timestamp = Date.now();
    const eventId = `evt_${crypto.randomBytes(12).toString('hex')}`;
    const payload = {
      id: eventId,
      event: 'transaction.paid',
      created_at: new Date(timestamp).toISOString(),
      data: {
        transaction_id: transactionId,
        amount: 249.90,
        net_amount: 242.43,
        fee_amount: 7.47,
        status: 'PAID',
        payment_method: 'PIX',
        currency: 'BRL',
        merchant_slug: merchant.slug
      }
    };

    const endpointUrl = merchant.webhookUrl || 'https://webhook.site/paystream-mock-ping';
    const { signature } = generateWebhookSignature(payload, merchant.webhookSecret, timestamp);

    // Dispara via dispatcher resiliente com retentativas
    dispatchWebhook({
      merchantId,
      transactionId,
      event: 'transaction.paid',
      payload,
      endpointUrl,
      secret: merchant.webhookSecret,
      maxAttempts: 3
    });

    return reply.status(200).send({
      success: true,
      eventId,
      deliveryStatus: 'QUEUED_FOR_DELIVERY',
      timestamp,
      signature,
      responseStatus: 202,
      status: 'DELIVERING',
      deliveredAt: new Date(timestamp).toISOString(),
      message: 'Webhook enfileirado para entrega com retentativa exponencial e assinatura HMAC blindada.'
    });
  };

  app.post('/test-ping', testPingHandler);

  // ── 4. VERIFICAÇÃO DE ASSINATURA & PROTEÇÃO CONTRA REPLAY ATTACKS ──
  app.post('/verify-signature', async (request, reply) => {
    const schema = z.object({
      payload: z.any(),
      signature: z.string(), // "t=1700000000,v1=abcdef..."
      secret: z.string().optional()
    });

    const { payload, signature, secret } = schema.parse(request.body);
    const { merchantId } = request.user;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId }
    });

    const activeSecret = secret || merchant?.webhookSecret;
    if (!activeSecret) {
      throw new AppError('Chave secreta de webhook não configurada.', 400);
    }

    // Parse header "t={timestamp},v1={hash}"
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.trim().startsWith('t='));
    const hashPart = parts.find(p => p.trim().startsWith('v1='));

    if (!timestampPart || !hashPart) {
      return reply.status(400).send({
        valid: false,
        reason: 'Formato de assinatura inválido. Esperado "t={timestamp},v1={hash}".'
      });
    }

    const timestamp = Number(timestampPart.trim().replace('t=', ''));
    const receivedHash = hashPart.trim().replace('v1=', '');

    // Validação de tolerância a Replay Attack (5 minutos = 300 segundos)
    const toleranceMs = 5 * 60 * 1000;
    const timeDiff = Math.abs(Date.now() - timestamp);
    const isExpired = timeDiff > toleranceMs;

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // 1. Hash padrão com timestamp binding (Stripe/Fintech standard)
    const signedDataBound = `${timestamp}.${payloadString}`;
    const expectedHashBound = crypto
      .createHmac('sha256', activeSecret)
      .update(signedDataBound)
      .digest('hex');

    // 2. Hash legado (apenas payload) para compatibilidade
    const expectedHashLegacy = crypto
      .createHmac('sha256', activeSecret)
      .update(payloadString)
      .digest('hex');

    // Comparação em tempo constante contra Timing Attacks com validação de buffer lengths
    let isValidHash = false;
    try {
      const bufReceived = Buffer.from(receivedHash, 'hex');
      const bufExpectedBound = Buffer.from(expectedHashBound, 'hex');
      const bufExpectedLegacy = Buffer.from(expectedHashLegacy, 'hex');

      if (bufReceived.length === bufExpectedBound.length) {
        isValidHash = crypto.timingSafeEqual(bufReceived, bufExpectedBound) ||
                      crypto.timingSafeEqual(bufReceived, bufExpectedLegacy);
      }
    } catch {
      isValidHash = false;
    }

    if (isExpired) {
      return reply.status(401).send({
        valid: false,
        isExpired: true,
        reason: `Assinatura expirada (possível Replay Attack). Diferença de tempo: ${Math.round(timeDiff / 1000)}s (máximo permitido: 300s).`,
        timestamp,
        toleranceSeconds: 300
      });
    }

    return reply.send({
      valid: isValidHash,
      isExpired: false,
      timestamp,
      toleranceSeconds: 300,
      verifiedAt: new Date().toISOString()
    });
  });
}
