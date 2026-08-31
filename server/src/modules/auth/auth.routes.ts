import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticate } from '../../middlewares/auth.js';

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
        apiKeyLive: result.merchant.apiKeyLive
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      }
    });
  });

  // ── 2. LOGIN DE MERCHANT ──
  app.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      merchantSlug: z.string().min(2),
      email: z.string().email(),
      password: z.string()
    });

    const { merchantSlug, email, password } = loginSchema.parse(request.body);

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
      throw new AppError('Credenciais inválidas.', 401);
    }

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

  // ── 4. LOGOUT ──
  app.post('/logout', async (request, reply) => {
    reply.clearCookie('access_token', { path: '/' });
    return reply.send({ message: 'Sessão finalizada com sucesso.' });
  });
}
