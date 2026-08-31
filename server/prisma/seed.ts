import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando dados iniciais do PayStream Gateway...');

  const passwordHash = await bcrypt.hash('pedrooliveira1227!', 12);
  const apiKeyLive = 'ps_live_8f7b2c9e1a4d6f3e5b8a0c2d4e6f8a1b3c5d7e9f';
  const webhookSecret = 'whsec_a1b2c3d4e5f67890123456789abcdef012345678';

  // 1. Criar ou atualizar Merchant Demo (TechStore)
  const merchant = await prisma.merchant.upsert({
    where: { slug: 'techstore' },
    update: {},
    create: {
      name: 'TechStore Brasil E-commerce',
      slug: 'techstore',
      document: '45892301000199',
      plan: 'ENTERPRISE',
      apiKeyLive,
      webhookSecret,
      webhookUrl: 'https://webhook.site/paystream-demo-endpoint',
      feePercent: 2.99,
      feeFixed: 0.49
    }
  });

  // 2. Criar Usuário Admin do Merchant
  await prisma.user.upsert({
    where: {
      merchantId_email: {
        merchantId: merchant.id,
        email: 'admin@techstore.com'
      }
    },
    update: {},
    create: {
      merchantId: merchant.id,
      name: 'Pedro Henrique (Diretor Financeiro)',
      email: 'admin@techstore.com',
      passwordHash,
      role: 'MERCHANT_ADMIN'
    }
  });

  // 3. Criar Sellers para Split de Pagamento
  const seller1 = await prisma.recipient.create({
    data: {
      merchantId: merchant.id,
      name: 'Eletrônicos Express Importadora',
      document: '12345678000100',
      bankCode: '260',
      agency: '0001',
      account: '984210-4'
    }
  });

  const seller2 = await prisma.recipient.create({
    data: {
      merchantId: merchant.id,
      name: 'GamerGear Acessórios',
      document: '98765432000111',
      bankCode: '341',
      agency: '1540',
      account: '33201-9'
    }
  });

  // 4. Criar Transações Reais de Teste (PIX e Cartão)
  const tx1 = await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      externalId: '#ORD-9842',
      amount: 1450.00,
      netAmount: 1406.15,
      feeAmount: 43.85,
      paymentMethod: 'CREDIT_CARD',
      status: 'PAID',
      customerName: 'Lucas Ferreira',
      customerEmail: 'lucas.ferreira@gmail.com',
      customerDoc: '84930219482',
      cardLastDigits: '4242',
      cardBrand: 'MASTERCARD',
      installments: 3,
      paidAt: new Date(Date.now() - 3600000)
    }
  });

  await prisma.splitRule.create({
    data: {
      transactionId: tx1.id,
      recipientId: seller1.id,
      amount: 1200.00
    }
  });

  const tx2 = await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      externalId: '#ORD-9843',
      amount: 289.90,
      netAmount: 280.74,
      feeAmount: 9.16,
      paymentMethod: 'PIX',
      status: 'PAID',
      customerName: 'Mariana Duarte',
      customerEmail: 'mariana.duarte@hotmail.com',
      customerDoc: '19482039401',
      pixPayload: '00020126580014br.gov.bcb.pix01369843-paystream520400005303986540289.905802BR5913TechStore6009FORTALEZA62070503***6304',
      paidAt: new Date(Date.now() - 7200000)
    }
  });

  await prisma.webhookLog.create({
    data: {
      merchantId: merchant.id,
      transactionId: tx2.id,
      event: 'transaction.paid',
      payload: {
        id: tx2.id,
        amount: 289.90,
        status: 'PAID',
        paymentMethod: 'PIX'
      },
      signature: 'sha256_9f8e7d6c5b4a3210fe98dcba',
      endpointUrl: 'https://webhook.site/paystream-demo-endpoint',
      status: 'DELIVERED',
      responseStatus: 200
    }
  });

  console.log('✅ Banco semeado com sucesso! Credenciais: admin@techstore.com / pedrooliveira1227! (slug: techstore)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
