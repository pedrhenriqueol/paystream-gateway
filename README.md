# PayStream Gateway ── B2B Payment Settlement Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.28-000000?style=flat-square&logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](LICENSE)

Infraestrutura corporativa para orquestração de pagamentos Pix instantâneos, liquidação multi-adquirente, regras determinísticas de split para marketplaces e entrega resiliente de webhooks assinados criptograficamente.

Projetado para operar como motor transacional de alto rendimento, o PayStream isola dados por merchant via multi-tenancy estrito no PostgreSQL, garante processamento livre de duplicidades através de chaves de idempotência e assegura conformidade no trânsito de dados financeiros.

---

## 1. Arquitetura do Sistema & Fluxo de Dados

O ciclo de vida transacional processa cobranças de forma síncrona com mitigação de race conditions e distribui eventos assincronamente via webhooks autenticados.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Cliente Final
    participant Client as Merchant Checkout (Web/Mobile)
    participant Gateway as PayStream Core (Fastify API)
    participant DB as PostgreSQL (Supabase Scoped)
    participant Split as Motor de Liquidação (Split Engine)
    participant Webhook as Dispatcher de Webhooks (HMAC-SHA256)
    participant MerchantServer as Servidor do Merchant

    Customer->>Client: Confirma Pagamento (Pix / Cartão)
    Client->>Gateway: POST /api/v1/transactions/process (com Idempotency-Key)
    
    critical Verificação de Idempotência
        Gateway->>DB: Busca transação com a mesma Idempotency-Key
        alt Chave já existente (Replay)
            DB-->>Gateway: Retorna registro existente
            Gateway-->>Client: 200 OK (X-Idempotent-Replay: true)
        else Nova Transação
            Gateway->>DB: Cria registro da transação (PENDING / PAID)
        end
    end

    opt Regras de Split Configuradas
        Gateway->>Split: Aplica taxa percentual/fixa do gateway e liquida saldo dos Sellers
        Split->>DB: Registra SplitRule com retenção de custódia
    end

    alt Transação Confirmada (PAID)
        Gateway->>Webhook: Enfileira evento transaction.paid
        Webhook->>Webhook: Gera assinatura HMAC-SHA256 (t=timestamp, v1=hash)
        Webhook->>MerchantServer: POST /webhook (X-PayStream-Signature: t=..., v1=...)
        MerchantServer-->>Webhook: 200 OK
        Webhook->>DB: Atualiza WebhookLog (status: DELIVERED, attempts: 1)
    end

    Gateway-->>Client: 201 Created (QRCode Pix / Confirmação de Cartão)
```

### 1.1. Isolamento Multi-Tenant & Segurança Estrutural
* **Isolamento de Dados por Tenant:** Todas as entidades (`Transaction`, `Recipient`, `SplitRule`, `WebhookLog`, `User`) são estritamente vinculadas a um `merchantId`. Nenhuma consulta cruza fronteiras entre merchants.
* **Chaves de Idempotência (`Idempotency-Key`):** Requisições com o cabeçalho `Idempotency-Key` ou `X-Idempotency-Key` são armazenadas e validadas dentro de uma janela de retenção de 24 horas, prevenindo double-charging por instabilidade de rede ou cliques repetidos no checkout.
* **Proteção contra Força Bruta (Account Lockout):** Monitoramento de tentativas de autenticação com limite de 5 falhas consecutivas por conta. Bloqueio automático por 15 minutos com status HTTP `429 Too Many Requests`.

---

## 2. Capacidades Técnicas & Engenharia

### ▪ Pix & Cartão de Crédito Transparentes
* **Pix SPI Instantâneo:** Geração de payload Copia e Cola (`000201...`) e renderização vetorial de QR Code em tempo de execução via biblioteca nativa.
* **Tokenização e Conformidade PCI:** Cartões de crédito são autorizados diretamente no motor transacional. Apenas os 4 últimos dígitos (`cardLastDigits`) e a bandeira (`cardBrand`) são persistidos no banco de dados. Números brutos e códigos de segurança (CVV) nunca são armazenados ou expostos em logs.

### ▪ Motor Determinístico de Split (D+0)
* **Cálculo de Liquidação:** Permite a divisão do valor bruto da transação entre o marketplace e múltiplos vendedores parceiros (`recipients`).
* **Hierarquia de Desconto:**
  1. Dedução determinística das taxas do gateway (`grossAmount * feePercent + feeFixed`).
  2. Alocação de receitas líquidas diretamente para cada seller com regras parametrizáveis por valor monetário.
  3. Prevenção de saldos negativos com validação de limite transacional.

### ▪ Webhooks Assinados & Proteção Anti-Replay
* **Assinatura HMAC-SHA256:** Cada notificação enviada contém o cabeçalho `X-PayStream-Signature: t={timestamp},v1={hash}`, assinado digitalmente com o segredo exclusivo (`webhookSecret`) do merchant.
* **Tolerância a Replay Attacks:** Implementação do padrão de tolerância estrita de 5 minutos (300 segundos). Requisições com defasagem temporal são rejeitadas.
* **Mitigação de Timing Attacks:** Verificação segura de hashes utilizando `crypto.timingSafeEqual`.

### ▪ Console Financeiro (Frontend)
* Interface corporativa construída em React 18, Vite e Tailwind CSS, sem ruídos visuais de IA, priorizando telemetria em tempo real, auditoria de ledger com download em CSV e validação de extrato com checksum SHA-256.

---

## 3. Matriz de Rotas & Contratos de API

Prefixos suportados: `/api/v1` (padrão corporativo), `/api` e `/` (fallback direto).

| Método | Endpoint | Autenticação | Descrição Técnica |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register-merchant` | Pública | Provisiona novo merchant, gera `apiKeyLive` (`ps_live_...`), `webhookSecret` (`whsec_...`) e usuário master. |
| `POST` | `/api/v1/auth/login` | Pública | Autentica com `merchantSlug`, `email` e `password`. Possui proteção contra força bruta (5 tentativas máx). |
| `GET` | `/api/v1/auth/me` | Bearer JWT | Retorna o perfil do merchant autenticado, taxas contratuais e status do plano. |
| `POST` | `/api/v1/auth/rotate-keys` | Bearer JWT | Revoga credenciais antigas e emite novo par de chaves de API mediante validação de senha administrativa. |
| `POST` | `/api/v1/transactions/process` | API Key Header/Body | Processa cobrança Pix ou Cartão de Crédito. Suporta header `Idempotency-Key` contra cobrança dupla. |
| `POST` | `/api/v1/transactions/:id/simulate-pix-paid` | Pública / Sandbox | Simula a notificação de liquidação do Banco Central (BACEN) para confirmação de Pix em sandbox. |
| `GET` | `/api/v1/transactions` | Bearer JWT | Consulta ledger transacional paginado do merchant com filtros por método (`PIX`, `CREDIT_CARD`) e status. |
| `GET` | `/api/v1/transactions/export-statement` | Bearer JWT | Emite extrato de conciliação financeira com TPV, taxas retidas e hash de integridade SHA-256 (`X-Statement-Checksum`). |
| `POST` | `/api/v1/recipients` | Bearer JWT | Registra recebedor (seller/parceiro) com dados bancários (ISPB/COMPE, agência e conta) para regras de split. |
| `GET` | `/api/v1/recipients` | Bearer JWT | Lista todos os sellers credenciados para divisão de pagamentos. |
| `GET` | `/api/v1/webhooks/logs` | Bearer JWT | Retorna histórico dos últimos 50 disparos de webhook com status HTTP e payloads. |
| `PATCH` | `/api/v1/webhooks/endpoint` | Bearer JWT | Atualiza a URL de destino HTTP para recebimento das notificações do gateway. |
| `POST` | `/api/v1/webhooks/test-ping` | Bearer JWT | Simula disparo de evento `transaction.paid`, assina via HMAC-SHA256 e audita a entrega (timeout de 4s). |
| `POST` | `/api/v1/webhooks/verify-signature` | Bearer JWT | Utilitário para validar assinatura `X-PayStream-Signature` com tolerância anti-replay de 5 minutos. |

---

## 4. Setup & Execução Local

### 4.1. Pré-requisitos
* Node.js 18.x ou 20.x LTS
* npm ou pnpm
* Instância PostgreSQL (local ou Supabase)

### 4.2. Estrutura do Repositório
```
paystream-gateway/
├── client/                 # Console Administrativo & Checkout (React + Vite + Tailwind)
│   ├── src/
│   │   ├── api/            # Cliente Axios com injeção de JWT e normalização de rotas
│   │   ├── components/     # Componentes de UI, layout e telemetria
│   │   ├── context/        # AuthContext com cache Stale-While-Revalidate
│   │   └── pages/          # Dashboard, Transactions, Webhooks, Recipients, Checkout
│   └── package.json
├── server/                 # Motor de Pagamentos & Split API (Fastify + Prisma)
│   ├── prisma/             # Schema do banco de dados e seeds
│   ├── src/
│   │   ├── config/         # Validação de variáveis de ambiente via Zod
│   │   ├── middlewares/    # Autenticação JWT e guardas de rota
│   │   ├── modules/        # Domínios: auth, transactions, recipients, webhooks, dashboard
│   │   └── server.ts       # Inicialização do Fastify e injeção de plugins
│   └── package.json
└── README.md
```

### 4.3. Configuração de Variáveis de Ambiente

Crie o arquivo `server/.env`:
```env
# Porta de escuta da API Fastify
PORT=3334

# String de conexão com o PostgreSQL (Supabase / Postgres nativo com Transaction Pooler)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Segredo criptográfico para emissão e validação de tokens JWT (HS256)
JWT_SECRET="paystream-enterprise-fintech-jwt-secret-key-2026!"

# URL de origem do cliente para autorização de CORS e cookies de sessão
CLIENT_URL="http://localhost:5173"

# Ambiente de execução (development / production)
NODE_ENV="development"
```

Crie o arquivo `client/.env` (opcional em desenvolvimento, fallback para `localhost:3334`):
```env
# URL base do back-end Fastify
VITE_API_URL="http://localhost:3334/api/v1"
```

### 4.4. Inicialização Passo a Passo

1. **Instalar dependências:**
   ```bash
   # No diretório raiz do back-end
   cd server
   npm install

   # No diretório do front-end
   cd ../client
   npm install
   ```

2. **Provisionar banco de dados:**
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

3. **Popular banco com dados de demonstração (Opcional):**
   ```bash
   npm run seed
   ```

4. **Executar os serviços:**
   ```bash
   # Terminal 1: Back-end API (Fastify)
   cd server
   npm run dev

   # Terminal 2: Front-end Console (Vite)
   cd client
   npm run dev
   ```

5. **Acesso aos serviços:**
   * **Console Web & Checkout Sandbox:** `http://localhost:5173`
   * **API Gateway:** `http://localhost:3334`
   * **Credenciais de Demonstração (Seed):**
     * Slug: `techstore`
     * E-mail: `admin@techstore.com`
     * Senha: `admin@123`

---

## 5. Licença

Este projeto é distribuído sob os termos da licença [MIT](LICENSE).
