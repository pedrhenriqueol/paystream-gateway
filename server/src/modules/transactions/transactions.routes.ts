import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate } from '../../middlewares/auth.js';

export async function transactionRoutes(app: FastifyInstance) {
  // ── 1. CHECKOUT PÚBLICO / API DE PAGAMENTO (Criação de Transação) ──
  app.post('/process', async (request, reply) => {
    const processSchema = z.object({
      merchantApiKey: z.string().min(10),
      externalId: z.string().optional(),
      amount: z.number().positive(),
      paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'BOLETO']),
      customer: z.object({
        name: z.string().min(3),
        email: z.string().email(),
        document: z.string().min(11)
      }),
      creditCard: z.object({
        holderName: z.string(),
        cardNumber: z.string(),
        expiry: z.string(),
        cvv: z.string(),
        installments: z.number().int().min(1).max(12).default(1)
      }).optional(),
      splits: z.array(
        z.object({
          recipientId: z.string().uuid(),
          amount: z.number().positive()
        })
      ).optional()
    });

    const body = processSchema.parse(request.body);

    const merchant = await prisma.merchant.findUnique({
      where: { apiKeyLive: body.merchantApiKey }
    });

    if (!merchant) {
      throw new AppError('Chave de API do Merchant inválida.', 401);
    }

    // Cálculo das taxas
    const grossAmount = body.amount;
    const feeAmount = Number(((grossAmount * Number(merchant.feePercent) / 100) + Number(merchant.feeFixed)).toFixed(2));
    const netAmount = Number((grossAmount - feeAmount).toFixed(2));

    let pixPayload: string | null = null;
    let pixQrCode: string | null = null;
    let cardLastDigits: string | null = null;
    let cardBrand: string | null = null;
    let status: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING';
    let paidAt: Date | null = null;

    if (body.paymentMethod === 'PIX') {
      const txId = crypto.randomBytes(16).toString('hex');
      pixPayload = `00020126580014br.gov.bcb.pix0136${txId}520400005303986540${grossAmount.toFixed(2)}5802BR5913${merchant.name.slice(0, 13)}6009FORTALEZA62070503***6304`;
      pixQrCode = await QRCode.toDataURL(pixPayload);
    } else if (body.paymentMethod === 'CREDIT_CARD') {
      if (!body.creditCard) {
        throw new AppError('Dados do cartão de crédito obrigatórios.', 400);
      }
      const rawNumber = body.creditCard.cardNumber.replace(/\D/g, '');
      cardLastDigits = rawNumber.slice(-4);
      cardBrand = rawNumber.startsWith('4') ? 'VISA' : rawNumber.startsWith('5') ? 'MASTERCARD' : 'ELO';
      
      // Simulação de autorização instantânea com adquirente
      status = 'PAID';
      paidAt = new Date();
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          merchantId: merchant.id,
          externalId: body.externalId,
          amount: grossAmount,
          netAmount,
          feeAmount,
          paymentMethod: body.paymentMethod,
          status,
          customerName: body.customer.name,
          customerEmail: body.customer.email.toLowerCase(),
          customerDoc: body.customer.document.replace(/\D/g, ''),
          pixPayload,
          pixQrCode,
          cardLastDigits,
          cardBrand,
          installments: body.creditCard?.installments || 1,
          paidAt
        }
      });

      // Cria regras de Split se houver
      if (body.splits && body.splits.length > 0) {
        for (const split of body.splits) {
          await tx.splitRule.create({
            data: {
              transactionId: created.id,
              recipientId: split.recipientId,
              amount: split.amount
            }
          });
        }
      }

      // Se pago, registra o webhook log
      if (status === 'PAID' && merchant.webhookUrl) {
        const payload = {
          event: 'transaction.paid',
          data: {
            id: created.id,
            amount: created.amount,
            status: created.status,
            paidAt: created.paidAt
          }
        };
        const signature = crypto.createHmac('sha256', merchant.webhookSecret).update(JSON.stringify(payload)).digest('hex');

        await tx.webhookLog.create({
          data: {
            merchantId: merchant.id,
            transactionId: created.id,
            event: 'transaction.paid',
            payload,
            signature,
            endpointUrl: merchant.webhookUrl,
            status: 'DELIVERED',
            responseStatus: 200
          }
        });
      }

      return created;
    });

    return reply.status(201).send({
      message: 'Transação processada pelo gateway PayStream!',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        pixPayload: transaction.pixPayload,
        pixQrCode: transaction.pixQrCode,
        cardLastDigits: transaction.cardLastDigits,
        cardBrand: transaction.cardBrand,
        paidAt: transaction.paidAt
      }
    });
  });

  // ── 2. SIMULAR CONFIRMAÇÃO DO PIX EM TEMPO REAL ──
  app.post('/:id/simulate-pix-paid', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(request.params);

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { merchant: true }
    });

    if (!transaction) {
      throw new AppError('Transação não encontrada.', 404);
    }

    if (transaction.status === 'PAID') {
      return reply.send({ message: 'Transação já se encontra aprovada.', transaction });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      });

      if (transaction.merchant.webhookUrl) {
        const payload = {
          event: 'transaction.paid',
          data: {
            id: t.id,
            amount: t.amount,
            status: t.status,
            paidAt: t.paidAt
          }
        };
        const signature = crypto.createHmac('sha256', transaction.merchant.webhookSecret).update(JSON.stringify(payload)).digest('hex');

        await tx.webhookLog.create({
          data: {
            merchantId: transaction.merchant.id,
            transactionId: t.id,
            event: 'transaction.paid',
            payload,
            signature,
            endpointUrl: transaction.merchant.webhookUrl,
            status: 'DELIVERED',
            responseStatus: 200
          }
        });
      }

      return t;
    });

    return reply.send({ message: 'Pagamento PIX liquidado instantaneamente!', transaction: updated });
  });

  // ── 3. LISTAR TRANSAÇÕES DO MERCHANT (PROTEGIDO) ──
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { merchantId } = request.user;

    const transactions = await prisma.transaction.findMany({
      where: { merchantId },
      include: {
        splits: {
          include: { recipient: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return reply.send({ transactions });
  });
}
