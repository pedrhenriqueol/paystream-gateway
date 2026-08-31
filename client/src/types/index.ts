export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CHARGEBACK';
export type WebhookStatus = 'DELIVERED' | 'FAILED' | 'RETRYING';

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  plan?: string;
  apiKeyLive: string;
  webhookSecret: string;
  webhookUrl?: string;
  feePercent: number;
  feeFixed: number;
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
  name: string;
  document: string;
  bankCode: string;
  agency: string;
  account: string;
  _count?: {
    splits: number;
  };
}

export interface Transaction {
  id: string;
  externalId?: string;
  amount: number;
  netAmount: number;
  feeAmount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  customerName: string;
  customerEmail: string;
  customerDoc: string;
  pixQrCode?: string;
  pixPayload?: string;
  cardLastDigits?: string;
  cardBrand?: string;
  installments: number;
  paidAt?: string;
  createdAt: string;
  splits?: {
    id: string;
    amount: number;
    recipient: Recipient;
  }[];
}

export interface WebhookLog {
  id: string;
  event: string;
  payload: any;
  signature: string;
  endpointUrl: string;
  responseStatus?: number;
  status: WebhookStatus;
  createdAt: string;
  transaction?: {
    id: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: TransactionStatus;
  };
}

export interface DashboardMetrics {
  totalProcessed: string;
  netRevenue: string;
  totalFees: string;
  totalTransactions: number;
  paidTransactions: number;
  approvalRate: string;
  totalRecipients: number;
}
