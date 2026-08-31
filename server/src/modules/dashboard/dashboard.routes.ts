import { FastifyInstance } from 'fastify';
import { prisma } from '../../shared/prisma.js';
import { authenticate } from '../../middlewares/auth.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/metrics', async (request, reply) => {
    const { merchantId } = request.user;

    const [
      totalVolumePaid,
      totalCount,
      paidCount,
      recentTransactions,
      recipientsCount
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { merchantId, status: 'PAID' },
        _sum: { amount: true, netAmount: true, feeAmount: true }
      }),
      prisma.transaction.count({ where: { merchantId } }),
      prisma.transaction.count({ where: { merchantId, status: 'PAID' } }),
      prisma.transaction.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.recipient.count({ where: { merchantId } })
    ]);

    const totalProcessed = Number(totalVolumePaid._sum.amount || 0);
    const netRevenue = Number(totalVolumePaid._sum.netAmount || 0);
    const totalFees = Number(totalVolumePaid._sum.feeAmount || 0);
    const approvalRate = totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) + '%' : '100%';

    return reply.send({
      metrics: {
        totalProcessed: totalProcessed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        netRevenue: netRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        totalFees: totalFees.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        totalTransactions: totalCount,
        paidTransactions: paidCount,
        approvalRate,
        totalRecipients: recipientsCount
      },
      recentTransactions
    });
  });
}
