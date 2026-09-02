import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3334),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16).default('paystream-super-secret-jwt-key-2026!'),
  CLIENT_URL: z.string().default('http://localhost:5174')
});

let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Erro crítico: Variáveis de ambiente inválidas:', error.format());
  }
  process.exit(1);
}

export const env = parsedEnv;
