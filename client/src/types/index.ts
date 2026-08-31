export type MerchantPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CHARGEBACK';
export type WebhookStatus = 'DELIVERED' | 'FAILED' | 'RETRYING';

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  document: string;
  plan: MerchantPlan;
  apiKeyLive: string;
  webhookSecret: string;
  webhookUrl?: string | null;
  feePercent: number;
  feeFixed: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  merchant: Merchant;
}

export interface Recipient {
  id: string;
  merchantId: string;
  name: string;
  document: string;
  bankCode: string;
  agency: string;
  account: string;
  createdAt: string;
}

export interface SplitRule {
  id: string;
  transactionId: string;
  recipientId: string;
  amount: number;
  percent?: number | null;
  recipient?: Recipient;
}

export interface Transaction {
  id: string;
  merchantId: string;
  externalId?: string | null;
  amount: number;
  netAmount: number;
  feeAmount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  customerName: string;
  customerEmail: string;
  customerDoc: string;
  pixQrCode?: string | null;
  pixPayload?: string | null;
  cardLastDigits?: string | null;
  cardBrand?: string | null;
  installments: number;
  paidAt?: string | null;
  createdAt: string;
  splits?: SplitRule[];
}

export interface WebhookLog {
  id: string;
  merchantId: string;
  transactionId: string;
  event: string;
  payload: any;
  signature: string;
  endpointUrl: string;
  responseStatus?: number | null;
  status: WebhookStatus;
  attempts?: number;
  createdAt: string;
}

export interface DashboardMetrics {
  totalProcessed: string;
  netRevenue: string;
  totalFees: string;
  paidTransactions: number;
  totalRecipients: number;
  approvalRate: string;
}
