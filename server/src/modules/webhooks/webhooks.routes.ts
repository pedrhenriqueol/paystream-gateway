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
  app.post('/test-ping', async (request, reply) => {
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

    const eventId = `evt_${crypto.randomBytes(12).toString('hex')}`;
    const payload = {
      id: eventId,
      event: 'transaction.paid',
      created_at: new Date().toISOString(),
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

    const signature = crypto
      .createHmac('sha256', merchant.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const formattedSignature = `t=${Date.now()},v1=${signature}`;
    const endpointUrl = merchant.webhookUrl || 'https://webhook.site/paystream-mock-ping';
    let responseStatus = 200;
    let deliveryStatus = 'DELIVERED';

    if (merchant.webhookUrl) {
      try {
        if (typeof fetch !== 'undefined') {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
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
      signature: formattedSignature,
      deliveredAt: new Date().toISOString(),
      responseStatus,
      status: deliveryStatus,
      log
    });
  });
}
