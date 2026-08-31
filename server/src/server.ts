import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';

import { env } from './config/env.js';
import { AppError } from './shared/errors/AppError.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { transactionRoutes } from './modules/transactions/transactions.routes.js';
import { recipientRoutes } from './modules/recipients/recipients.routes.js';
import { webhookRoutes } from './modules/webhooks/webhooks.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';

const app = fastify({
  logger: env.NODE_ENV === 'development'
});

async function bootstrap() {
  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || origin.includes('localhost') || origin.includes('vercel.app') || origin === env.CLIENT_URL) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false }
  });

  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  // ── ROTAS DA API ──
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(transactionRoutes, { prefix: '/api/v1/transactions' });
  await app.register(recipientRoutes, { prefix: '/api/v1/recipients' });
  await app.register(webhookRoutes, { prefix: '/api/v1/webhooks' });
  await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });

  // ── TRATAMENTO CENTRALIZADO DE ERROS ──
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: 'Erro de validação nos dados enviados.',
        errors: error.format()
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.message
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      message: 'Erro interno no gateway de pagamento.'
    });
  });

  // ── HEALTHCHECK ──
  app.get('/health', async () => ({ status: 'ok', service: 'PayStream Enterprise Gateway API', timestamp: new Date() }));

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 PayStream Gateway Server rodando na porta ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
