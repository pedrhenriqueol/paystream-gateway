import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate } from '../../middlewares/auth.js';
import { dispatchWebhook } from '../../shared/services/webhookDispatcher.js';

export async function transactionRoutes(app: FastifyInstance) {
  // ── 1. CHECKOUT PÚBLICO / API DE PAGAMENTO (Com Idempotência Atômica & Split Seguro) ──
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

    // Chave de Idempotência (previne cobrança dupla e race conditions)
    const idempotencyKey = (
      request.headers['idempotency-key'] ||
      request.headers['x-idempotency-key']
    ) as string | undefined;

    const merchant = await prisma.merchant.findUnique({
      where: { apiKeyLive: body.merchantApiKey }
    });

    if (!merchant) {
      throw new AppError('Chave de API do Merchant inválida.', 401);
    }

    const targetExternalId = body.externalId || idempotencyKey;

    // Checagem prévia de Idempotência
    if (targetExternalId) {
      const existingTx = await prisma.transaction.findFirst({
        where: {
          merchantId: merchant.id,
          externalId: targetExternalId
        },
        include: { splits: true }
      });

      if (existingTx) {
        reply.header('X-Idempotent-Replay', 'true');
        if (idempotencyKey) {
          reply.header('X-Idempotency-Key', idempotencyKey);
        }
        return reply.status(200).send({
          message: 'Transação retornada de forma idempotente (já processada anteriormente sem dupla cobrança).',
          idempotent: true,
          transaction: {
            id: existingTx.id,
            amount: existingTx.amount,
            status: existingTx.status,
            paymentMethod: existingTx.paymentMethod,
            pixPayload: existingTx.pixPayload,
            pixQrCode: existingTx.pixQrCode,
            cardLastDigits: existingTx.cardLastDigits,
            cardBrand: existingTx.cardBrand,
            paidAt: existingTx.paidAt
          }
        });
      }
    }

    // ── ARITMÉTICA ESTREITA EM CENTAVOS (Prevenção de Perdas Fracionárias) ──
    const grossCents = Math.round(body.amount * 100);
    const feePercentCents = Math.round((grossCents * Number(merchant.feePercent)) / 100);
    const feeFixedCents = Math.round(Number(merchant.feeFixed) * 100);
    const totalFeeCents = feePercentCents + feeFixedCents;
    const netCents = grossCents - totalFeeCents;

    const grossAmount = grossCents / 100;
    const feeAmount = totalFeeCents / 100;
    const netAmount = netCents / 100;

    // ── VALIDAÇÃO MATEMÁTICA DE SPLIT (taxa_gateway + soma(sellers) === valor_bruto) ──
    if (body.splits && body.splits.length > 0) {
      const totalSplitsCents = body.splits.reduce((acc, s) => acc + Math.round(s.amount * 100), 0);

      if (totalFeeCents + totalSplitsCents !== grossCents) {
        throw new AppError(
          `Inconsistência contábil no split de pagamento: a soma dos repasses aos sellers (R$ ${(totalSplitsCents / 100).toFixed(2)}) com a taxa do gateway (R$ ${(totalFeeCents / 100).toFixed(2)}) totaliza R$ ${((totalFeeCents + totalSplitsCents) / 100).toFixed(2)}, divergindo do valor bruto da transação (R$ ${(grossCents / 100).toFixed(2)}).`,
          422
        );
      }
    }

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

      // Sanitização imediata: nunca mantém PAN ou CVV em memória
      body.creditCard.cardNumber = '****';
      body.creditCard.cvv = '***';

      status = 'PAID';
      paidAt = new Date();
    }

    // ── PERSISTÊNCIA ATÔMICA COM PROTEÇÃO CONTRA RACE CONDITION (P2002) ──
    let transaction: any = null;
    try {
      transaction = await prisma.$transaction(async (tx) => {
        const created = await tx.transaction.create({
          data: {
            merchantId: merchant.id,
            externalId: targetExternalId,
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

        if (body.splits && body.splits.length > 0) {
          for (const split of body.splits) {
            await tx.splitRule.create({
              data: {
                transactionId: created.id,
                recipientId: split.recipientId,
                amount: Math.round(split.amount * 100) / 100
              }
            });
          }
        }

        return created;
      });
    } catch (err: any) {
      // Se houver conflito de unicidade por requisições concorrentes idênticas, resolve de forma idempotente
      if (err.code === 'P2002' && targetExternalId) {
        const racedTx = await prisma.transaction.findFirst({
          where: {
            merchantId: merchant.id,
            externalId: targetExternalId
          }
        });

        if (racedTx) {
          reply.header('X-Idempotent-Replay', 'true');
          if (idempotencyKey) {
            reply.header('X-Idempotency-Key', idempotencyKey);
          }
          return reply.status(200).send({
            message: 'Transação retornada de forma idempotente (concorrência resolvida com integridade).',
            idempotent: true,
            transaction: {
              id: racedTx.id,
              amount: racedTx.amount,
              status: racedTx.status,
              paymentMethod: racedTx.paymentMethod,
              pixPayload: racedTx.pixPayload,
              pixQrCode: racedTx.pixQrCode,
              cardLastDigits: racedTx.cardLastDigits,
              cardBrand: racedTx.cardBrand,
              paidAt: racedTx.paidAt
            }
          });
        }
      }
      throw err;
    }

    // Disparo assíncrono de webhook com retentativas e HMAC assinado
    if (status === 'PAID' && merchant.webhookUrl) {
      dispatchWebhook({
        merchantId: merchant.id,
        transactionId: transaction.id,
        event: 'transaction.paid',
        payload: {
          id: transaction.id,
          amount: Number(transaction.amount),
          status: transaction.status,
          paidAt: transaction.paidAt
        },
        endpointUrl: merchant.webhookUrl,
        secret: merchant.webhookSecret
      });
    }

    if (idempotencyKey) {
      reply.header('X-Idempotency-Key', idempotencyKey);
    }

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
      return t;
    });

    // Disparo assíncrono de webhook
    if (transaction.merchant.webhookUrl) {
      dispatchWebhook({
        merchantId: transaction.merchant.id,
        transactionId: updated.id,
        event: 'transaction.paid',
        payload: {
          id: updated.id,
          amount: Number(updated.amount),
          status: updated.status,
          paidAt: updated.paidAt
        },
        endpointUrl: transaction.merchant.webhookUrl,
        secret: transaction.merchant.webhookSecret
      });
    }

    return reply.send({ message: 'Pagamento PIX liquidado instantaneamente!', transaction: updated });
  });

  // ── 3. EXPORTAR EXTRATO DE CONCILIAÇÃO FINANCEIRA COM CHECKSUM SHA-256 ──
  app.get('/export-statement', { preHandler: [authenticate] }, async (request, reply) => {
    const { merchantId } = request.user;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId }
    });

    if (!merchant) {
      throw new AppError('Merchant não encontrado.', 404);
    }

    const transactions = await prisma.transaction.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      include: { splits: { include: { recipient: true } } }
    });

    let totalGross = 0;
    let totalFees = 0;
    let totalNet = 0;
    let paidCount = 0;
    let pendingCount = 0;

    for (const tx of transactions) {
      if (tx.status === 'PAID') {
        totalGross += Number(tx.amount);
        totalFees += Number(tx.feeAmount);
        totalNet += Number(tx.netAmount);
        paidCount++;
      } else {
        pendingCount++;
      }
    }

    const statementData = {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        document: merchant.document
      },
      summary: {
        totalTransactions: transactions.length,
        paidCount,
        pendingCount,
        totalGross: Number(totalGross.toFixed(2)),
        totalFees: Number(totalFees.toFixed(2)),
        totalNet: Number(totalNet.toFixed(2))
      },
      transactions: transactions.map(t => ({
        id: t.id,
        externalId: t.externalId,
        date: t.createdAt.toISOString(),
        paymentMethod: t.paymentMethod,
        status: t.status,
        customerName: t.customerName,
        customerDoc: t.customerDoc,
        amount: Number(t.amount),
        feeAmount: Number(t.feeAmount),
        netAmount: Number(t.netAmount),
        splitsCount: t.splits.length
      })),
      generatedAt: new Date().toISOString()
    };

    // Gera Checksum SHA-256 de integridade contábil
    const checksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(statementData))
      .digest('hex');

    reply.header('X-Statement-Checksum', `sha256:${checksum}`);

    return reply.send({
      ...statementData,
      checksum: `sha256:${checksum}`
    });
  });

  // ── 4. LISTAR TRANSAÇÕES DO MERCHANT (PROTEGIDO) ──
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
      take: 100
    });

    return reply.send({ transactions });
  });
}
