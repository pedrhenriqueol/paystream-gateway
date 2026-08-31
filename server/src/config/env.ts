import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3334),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16).default('paystream-super-secret-jwt-key-2026!'),
  CLIENT_URL: z.string().default('http://localhost:5174')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Erro crítico: Variáveis de ambiente inválidas:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
