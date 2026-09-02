import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../../shared/prisma.js';
import { authenticate } from '../../middlewares/auth.js';
import { AppError } from '../../shared/errors/AppError.js';

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

  // ── 3. DISPARAR WEBHOOK DE TESTE (SIMULAÇÃO HMAC-SHA256) ──
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

    const signatureHash = crypto
      .createHmac('sha256', merchant.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const formattedSignature = `t=${timestamp},v1=${signatureHash}`;
    const endpointUrl = merchant.webhookUrl || 'https://webhook.site/paystream-mock-ping';
    let responseStatus = 200;
    let deliveryStatus = 'DELIVERED';

    if (merchant.webhookUrl) {
      try {
        if (typeof fetch !== 'undefined') {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout
          const res = await fetch(merchant.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-PayStream-Signature': formattedSignature,
              'X-PayStream-Event': 'transaction.paid'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timeout);
          responseStatus = res.status;
          deliveryStatus = res.ok ? 'DELIVERED' : 'FAILED';
        }
      } catch {
        responseStatus = 504;
        deliveryStatus = 'FAILED';
      }
    } else {
      responseStatus = 200;
      deliveryStatus = 'DELIVERED';
    }

    const log = await prisma.webhookLog.create({
      data: {
        merchantId,
        transactionId,
        event: 'transaction.paid',
        payload,
        signature: formattedSignature,
        endpointUrl,
        responseStatus,
        status: deliveryStatus as any,
        attempts: 1
      },
      include: {
        transaction: {
          select: { id: true, amount: true, paymentMethod: true, status: true }
        }
      }
    });

    return reply.status(200).send({
      success: true,
      eventId,
      deliveryStatus,
      timestamp,
      signature: formattedSignature,
      responseStatus,
      status: deliveryStatus,
      deliveredAt: new Date(timestamp).toISOString(),
      log
    });
  };

  // Disparo de teste de webhook (resolvido com prefixo em /api/v1/webhooks/test-ping, /api/webhooks/test-ping e /webhooks/test-ping)
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

    const expectedHash = crypto
      .createHmac('sha256', activeSecret)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    // Comparação segura contra Timing Attacks
    let isValidHash = false;
    try {
      isValidHash = crypto.timingSafeEqual(
        Buffer.from(receivedHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );
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
