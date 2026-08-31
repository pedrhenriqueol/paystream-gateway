import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../shared/prisma.js';
import { authenticate } from '../../middlewares/auth.js';

export async function webhookRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ── LISTAR LOGS DE WEBHOOK DO MERCHANT ──
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

  // ── ATUALIZAR URL DE WEBHOOK DO MERCHANT ──
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
}
