import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../shared/errors/AppError.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await request.jwtVerify();
      return;
    }

    const token = request.cookies.access_token;
    if (!token) {
      throw new AppError('Não autenticado. Token ausente.', 401);
    }
    
    await request.jwtVerify();
  } catch (err) {
    throw new AppError('Sessão expirada ou token inválido.', 401);
  }
}
