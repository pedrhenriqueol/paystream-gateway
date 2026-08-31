import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate } from '../../middlewares/auth.js';

export async function recipientRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ── 1. LISTAR RECEBEDORES / VENDEDORES DO MARKETPLACE ──
  app.get('/', async (request, reply) => {
    const { merchantId } = request.user;

    const recipients = await prisma.recipient.findMany({
      where: { merchantId },
      include: {
        _count: { select: { splits: true } }
      },
      orderBy: { name: 'asc' }
    });

    return reply.send({ recipients });
  });

  // ── 2. CADASTRAR RECEBEDOR / SELLER COM CONTA BANCÁRIA ──
  app.post('/', async (request, reply) => {
    const createSchema = z.object({
      name: z.string().min(3).max(120),
      document: z.string().min(11).max(18),
      bankCode: z.string().min(2).max(10),
      agency: z.string().min(1).max(10),
      account: z.string().min(3).max(30)
    });

    const body = createSchema.parse(request.body);
    const { merchantId } = request.user;

    const recipient = await prisma.recipient.create({
      data: {
        merchantId,
        name: body.name,
        document: body.document.replace(/\D/g, ''),
        bankCode: body.bankCode,
        agency: body.agency,
        account: body.account
      }
    });

    return reply.status(201).send({ recipient });
  });
}
