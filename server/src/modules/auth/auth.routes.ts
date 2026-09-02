import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate } from '../../middlewares/auth.js';

// Cache em memória para proteção contra Brute Force no Login
interface FailedAttempt {
  count: number;
  lockedUntil: number | null;
}
const failedLoginAttempts = new Map<string, FailedAttempt>();

export async function authRoutes(app: FastifyInstance) {
  // ── 1. REGISTRAR NOVO MERCHANT (LOJA / MARKETPLACE) ──
  app.post('/register-merchant', async (request, reply) => {
    const registerSchema = z.object({
      merchantName: z.string().min(3).max(120),
      merchantSlug: z.string().min(3).max(60),
      document: z.string().min(11).max(18),
      adminName: z.string().min(3).max(100),
      email: z.string().email(),
      password: z.string().min(8)
    });

    const { merchantName, merchantSlug, document, adminName, email, password } = registerSchema.parse(request.body);

    const existingMerchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug.toLowerCase() }
    });

    if (existingMerchant) {
      throw new AppError('Este slug de e-commerce já está em uso.', 409);
    }

    const apiKeyLive = `ps_live_${crypto.randomBytes(24).toString('hex')}`;
    const webhookSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({
        data: {
          name: merchantName,
          slug: merchantSlug.toLowerCase(),
          document: document.replace(/\D/g, ''),
          apiKeyLive,
          webhookSecret,
          feePercent: 2.99,
          feeFixed: 0.49
        }
      });

      const user = await tx.user.create({
        data: {
          merchantId: merchant.id,
          name: adminName,
          email: email.toLowerCase(),
          passwordHash,
          role: 'MERCHANT_ADMIN'
        }
      });

      return { merchant, user };
    });

    const token = app.jwt.sign(
      {
        sub: result.user.id,
        merchantId: result.merchant.id,
        role: result.user.role
      },
      { expiresIn: '7d' }
    );

    reply.setCookie('access_token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60
    });

    return reply.status(201).send({
      token,
      merchant: {
        id: result.merchant.id,
        name: result.merchant.name,
        slug: result.merchant.slug,
        apiKeyLive: result.merchant.apiKeyLive,
        webhookSecret: result.merchant.webhookSecret
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      }
    });
  });

  // ── 2. LOGIN DE MERCHANT COM PROTEÇÃO CONTRA FORÇA BRUTA ──
  app.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      merchantSlug: z.string().min(2),
      email: z.string().email(),
      password: z.string()
    });

    const { merchantSlug, email, password } = loginSchema.parse(request.body);
    const lockKey = `${merchantSlug.toLowerCase()}:${email.toLowerCase()}`;

    // Verificação de Account Lockout
    const attempt = failedLoginAttempts.get(lockKey);
    if (attempt?.lockedUntil && Date.now() < attempt.lockedUntil) {
      const remainingMinutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
      throw new AppError(
        `Conta temporariamente bloqueada por excesso de tentativas (5 falhas consecutivas). Tente novamente em ${remainingMinutes} minuto(s).`,
        429
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug.toLowerCase() }
    });

    if (!merchant) {
      throw new AppError('Merchant ou e-commerce não encontrado.', 404);
    }

    const user = await prisma.user.findUnique({
      where: { merchantId_email: { merchantId: merchant.id, email: email.toLowerCase() } }
    });

    if (!user) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      const currentCount = (attempt?.count || 0) + 1;
      if (currentCount >= 5) {
        failedLoginAttempts.set(lockKey, { count: currentCount, lockedUntil: Date.now() + 15 * 60 * 1000 });
        throw new AppError('Conta temporariamente bloqueada por segurança após 5 tentativas inválidas. Aguarde 15 minutos.', 429);
      } else {
        failedLoginAttempts.set(lockKey, { count: currentCount, lockedUntil: null });
        throw new AppError(`Credenciais inválidas. Tentativa ${currentCount} de 5 antes do bloqueio temporário.`, 401);
      }
    }

    // Reset de tentativas em caso de sucesso
    failedLoginAttempts.delete(lockKey);

    const token = app.jwt.sign(
      {
        sub: user.id,
        merchantId: merchant.id,
        role: user.role
      },
      { expiresIn: '7d' }
    );

    reply.setCookie('access_token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60
    });

    return reply.send({
      token,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        apiKeyLive: merchant.apiKeyLive,
        webhookSecret: merchant.webhookSecret,
        feePercent: merchant.feePercent,
        feeFixed: merchant.feeFixed
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });

  // ── 3. ME (SESSÃO ATIVA) ──
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const { sub: userId, merchantId } = request.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            apiKeyLive: true,
            webhookSecret: true,
            webhookUrl: true,
            feePercent: true,
            feeFixed: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return reply.send({ user });
  });

  // ── 4. ROTAÇÃO & REVOGAÇÃO DE CHAVES DE API ──
  app.post('/rotate-keys', { preHandler: [authenticate] }, async (request, reply) => {
    const rotateSchema = z.object({
      adminPassword: z.string().min(1, 'Senha do administrador obrigatória para autorizar rotação.')
    });

    const { adminPassword } = rotateSchema.parse(request.body);
    const { sub: userId, merchantId } = request.user;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const passwordMatch = await bcrypt.compare(adminPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError('Senha do administrador incorreta. Rotação de chaves não autorizada.', 403);
    }

    const newApiKeyLive = `ps_live_${crypto.randomBytes(24).toString('hex')}`;
    const newWebhookSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        apiKeyLive: newApiKeyLive,
        webhookSecret: newWebhookSecret
      }
    });

    return reply.send({
      message: 'Chaves de API rotacionadas e credenciais antigas revogadas com sucesso.',
      apiKeyLive: updatedMerchant.apiKeyLive,
      webhookSecret: updatedMerchant.webhookSecret,
      rotatedAt: new Date().toISOString()
    });
  });

  // ── 5. LOGOUT ──
  app.post('/logout', async (request, reply) => {
    reply.clearCookie('access_token', { path: '/' });
    return reply.send({ message: 'Sessão finalizada com sucesso.' });
  });
}
