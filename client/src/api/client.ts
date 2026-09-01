import axios from 'axios';

// Normalização resiliente da baseURL da API (compatível com localhost, Render, Vercel)
const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3334/api/v1';
const cleanBase = rawBaseURL.replace(/\/+$/, '');
const baseURL = cleanBase.includes('/api/v1')
  ? cleanBase
  : cleanBase.includes('/api')
    ? `${cleanBase}/v1`
    : `${cleanBase}/api/v1`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para injetar JWT de merchant
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('paystream_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento humanizado de respostas e erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Erro inesperado no gateway de pagamento.';

    if (error.response?.status === 401) {
      localStorage.removeItem('paystream_token');
    }

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const zodErrors = error.response.data.errors;
      const fieldErrors: string[] = [];
      for (const [key, val] of Object.entries(zodErrors)) {
        if (key !== '_errors' && typeof val === 'object' && val !== null && '_errors' in val) {
          const errs = (val as any)._errors;
          if (Array.isArray(errs) && errs.length > 0) {
            fieldErrors.push(`${key}: ${errs.join(', ')}`);
          }
        }
      }
      if (fieldErrors.length > 0) {
        message = `Validação: ${fieldErrors.join(' | ')}`;
      } else {
        message = error.response.data.message || message;
      }
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);
