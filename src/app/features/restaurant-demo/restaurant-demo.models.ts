export type OrderChannel = 'talabat' | 'keeta' | 'walkin';
export type OrderStatus = 'new' | 'billing' | 'paid' | 'ready';
export type PaymentState =
  | 'idle'
  | 'sent_to_terminal'
  | 'awaiting_tap'
  | 'approved'
  | 'receipt_issued';

export interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  category: string;
}

export interface OrderLineItem {
  itemId: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface RestaurantOrder {
  id: string;
  channel: OrderChannel;
  channelOrderId: string;
  customerName: string;
  items: OrderLineItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  status: OrderStatus;
  arrivedAt: string;
  paidAt: string | null;
  invoiceNumber: string | null;
  paymentRef: string | null;
  isLiveArrival?: boolean;
}

export interface MerchantProfile {
  name: string;
  nameAr: string;
  branch: string;
  trn: string;
  address: string;
  city: string;
  phone: string;
  currency: 'AED';
  vatRate: number;
}

export interface ChannelStats {
  channel: OrderChannel;
  label: string;
  orderCount: number;
  sales: number;
  vat: number;
}

export interface DashboardSummary {
  totalSales: number;
  totalVat: number;
  orderCount: number;
  paidCount: number;
  pendingCount: number;
  byChannel: ChannelStats[];
}

export interface PayoutLine {
  label: string;
  amount: number;
  kind: 'credit' | 'debit' | 'net';
}

export interface PayoutReconciliation {
  statementId: string;
  periodLabel: string;
  channel: 'talabat';
  grossOrders: number;
  commission: number;
  commissionVat: number;
  adjustments: number;
  expectedPayout: number;
  statementPayout: number;
  matched: boolean;
  lines: PayoutLine[];
  orderRefs: string[];
}

export interface TerminalSession {
  state: PaymentState;
  amount: number;
  orderId: string | null;
  authCode: string | null;
  rrn: string | null;
  cardLast4: string | null;
  message: string;
}

export interface DemoSeedOrder {
  channel: OrderChannel;
  channelOrderId: string;
  customerName: string;
  itemIds: Array<{ itemId: string; qty: number }>;
  delayMs: number;
  status?: OrderStatus;
  paid?: boolean;
}
