import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  CHANNEL_LABELS,
  INITIAL_ORDERS,
  LIVE_ARRIVALS,
  MENU,
  MERCHANT,
  TALABAT_COMMISSION_RATE,
  TALABAT_COMMISSION_VAT_RATE,
} from './restaurant-demo.data';
import {
  DashboardSummary,
  DemoSeedOrder,
  MenuItem,
  MerchantProfile,
  OrderChannel,
  OrderLineItem,
  PaymentState,
  PayoutReconciliation,
  RestaurantOrder,
  TerminalSession,
} from './restaurant-demo.models';

@Injectable()
export class RestaurantDemoService {
  readonly merchant: MerchantProfile = MERCHANT;
  readonly menu: MenuItem[] = MENU;
  readonly vatRate = MERCHANT.vatRate;

  private invoiceSeq = 120;
  private orderSeq = 100;
  private liveIndex = 0;
  private feedTimers: Array<{ id: ReturnType<typeof setTimeout>; kind: 'arrival' | 'terminal' }> = [];

  private readonly ordersSubject = new BehaviorSubject<RestaurantOrder[]>([]);
  private readonly selectedIdSubject = new BehaviorSubject<string | null>(null);
  private readonly terminalSubject = new BehaviorSubject<TerminalSession>(this.emptyTerminal());
  private readonly feedRunningSubject = new BehaviorSubject<boolean>(false);
  private readonly flashIdSubject = new BehaviorSubject<string | null>(null);

  readonly orders$ = this.ordersSubject.asObservable();
  readonly selectedId$ = this.selectedIdSubject.asObservable();
  readonly terminal$ = this.terminalSubject.asObservable();
  readonly feedRunning$ = this.feedRunningSubject.asObservable();
  readonly flashId$ = this.flashIdSubject.asObservable();

  constructor() {
    this.reset();
  }

  get orders(): RestaurantOrder[] {
    return this.ordersSubject.value;
  }

  get selectedOrder(): RestaurantOrder | null {
    const id = this.selectedIdSubject.value;
    return this.orders.find(o => o.id === id) ?? null;
  }

  get terminal(): TerminalSession {
    return this.terminalSubject.value;
  }

  get feedRunning(): boolean {
    return this.feedRunningSubject.value;
  }

  get remainingLiveArrivals(): number {
    return Math.max(0, LIVE_ARRIVALS.length - this.liveIndex);
  }

  reset(): void {
    this.clearFeedTimers();
    this.feedRunningSubject.next(false);
    this.liveIndex = 0;
    this.invoiceSeq = 120;
    this.orderSeq = 100;
    this.flashIdSubject.next(null);
    this.terminalSubject.next(this.emptyTerminal());

    const seeded = INITIAL_ORDERS.map(seed => this.buildOrderFromSeed(seed, false));
    this.ordersSubject.next(seeded);

    const walkIn = seeded.find(o => o.channel === 'walkin' && o.status === 'new');
    this.selectedIdSubject.next(walkIn?.id ?? seeded[0]?.id ?? null);
  }

  selectOrder(orderId: string): void {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;
    this.selectedIdSubject.next(orderId);
    if (order.status === 'paid') {
      this.terminalSubject.next({
        state: 'receipt_issued',
        amount: order.total,
        orderId: order.id,
        authCode: order.paymentRef?.slice(-6) ?? 'PL88421',
        rrn: `7844${order.channelOrderId.replace(/\D/g, '').slice(-8)}`,
        cardLast4: '4421',
        message: 'Payment already captured on Pine Labs terminal',
      });
    } else {
      this.terminalSubject.next(this.emptyTerminal());
    }
  }

  startLiveFeed(): void {
    if (this.feedRunning || this.remainingLiveArrivals === 0) return;
    this.clearArrivalTimers();
    this.feedRunningSubject.next(true);
    this.scheduleRemainingArrivals();
  }

  /** Manual fallback for filming if auto-timer is missed. */
  pushNextArrival(): RestaurantOrder | null {
    if (this.liveIndex >= LIVE_ARRIVALS.length) return null;
    const seed = LIVE_ARRIVALS[this.liveIndex];
    this.liveIndex++;
    if (this.liveIndex >= LIVE_ARRIVALS.length) {
      this.clearFeedTimers();
      this.feedRunningSubject.next(false);
    }
    return this.ingestLiveOrder(seed);
  }

  addWalkInOrder(itemSelections: Array<{ itemId: string; qty: number }>): RestaurantOrder | null {
    const lines = this.buildLines(itemSelections);
    if (!lines.length) return null;

    this.orderSeq++;
    const totals = this.calculateTotals(lines);
    const order: RestaurantOrder = {
      id: `ord-${this.orderSeq}`,
      channel: 'walkin',
      channelOrderId: `WI-${1040 + this.orderSeq}`,
      customerName: 'Walk-in Counter',
      items: lines,
      ...totals,
      status: 'new',
      arrivedAt: new Date().toISOString(),
      paidAt: null,
      invoiceNumber: null,
      paymentRef: null,
    };

    this.ordersSubject.next([order, ...this.orders]);
    this.selectedIdSubject.next(order.id);
    this.flashOrder(order.id);
    this.terminalSubject.next(this.emptyTerminal());
    return order;
  }

  ensureInvoice(orderId?: string): RestaurantOrder | null {
    const id = orderId ?? this.selectedIdSubject.value;
    if (!id) return null;
    const orders = [...this.orders];
    const idx = orders.findIndex(o => o.id === id);
    if (idx < 0) return null;

    const order = { ...orders[idx] };
    if (!order.invoiceNumber) {
      this.invoiceSeq++;
      order.invoiceNumber = `TI-${new Date().getFullYear()}-${String(this.invoiceSeq).padStart(5, '0')}`;
    }
    if (order.status === 'new') {
      order.status = 'billing';
    }
    orders[idx] = order;
    this.ordersSubject.next(orders);
    return order;
  }

  chargeOnTerminal(): void {
    const order = this.ensureInvoice();
    if (!order || order.status === 'paid') return;

    this.terminalSubject.next({
      state: 'sent_to_terminal',
      amount: order.total,
      orderId: order.id,
      authCode: null,
      rrn: null,
      cardLast4: null,
      message: 'Amount sent to Pine Labs terminal…',
    });

    this.clearTimersByKind('terminal');
    this.feedTimers.push(
      { id: setTimeout(() => this.advancePayment('awaiting_tap'), 900), kind: 'terminal' },
      { id: setTimeout(() => this.advancePayment('approved'), 2200), kind: 'terminal' },
      { id: setTimeout(() => this.advancePayment('receipt_issued'), 3400), kind: 'terminal' },
    );
  }

  getDashboard(): DashboardSummary {
    const channels: OrderChannel[] = ['talabat', 'keeta', 'walkin'];
    const byChannel = channels.map(channel => {
      const list = this.orders.filter(o => o.channel === channel);
      return {
        channel,
        label: CHANNEL_LABELS[channel],
        orderCount: list.length,
        sales: this.round2(list.reduce((s, o) => s + o.total, 0)),
        vat: this.round2(list.reduce((s, o) => s + o.vatAmount, 0)),
      };
    });

    return {
      totalSales: this.round2(byChannel.reduce((s, c) => s + c.sales, 0)),
      totalVat: this.round2(byChannel.reduce((s, c) => s + c.vat, 0)),
      orderCount: this.orders.length,
      paidCount: this.orders.filter(o => o.status === 'paid').length,
      pendingCount: this.orders.filter(o => o.status !== 'paid').length,
      byChannel,
    };
  }

  getPayoutReconciliation(): PayoutReconciliation {
    const talabatOrders = this.orders.filter(o => o.channel === 'talabat');
    const grossOrders = this.round2(talabatOrders.reduce((s, o) => s + o.total, 0));
    const commission = this.round2(grossOrders * TALABAT_COMMISSION_RATE);
    const commissionVat = this.round2(commission * TALABAT_COMMISSION_VAT_RATE);
    const adjustments = -3.5;
    const expectedPayout = this.round2(grossOrders - commission - commissionVat + adjustments);
    const statementPayout = expectedPayout;

    return {
      statementId: 'TLB-PAY-2026-0718',
      periodLabel: 'Today · Lunch rush',
      channel: 'talabat',
      grossOrders,
      commission,
      commissionVat,
      adjustments,
      expectedPayout,
      statementPayout,
      matched: Math.abs(expectedPayout - statementPayout) < 0.01,
      orderRefs: talabatOrders.map(o => o.channelOrderId),
      lines: [
        { label: 'Gross order value (incl. VAT)', amount: grossOrders, kind: 'credit' },
        { label: `Commission (${(TALABAT_COMMISSION_RATE * 100).toFixed(0)}%)`, amount: -commission, kind: 'debit' },
        { label: 'VAT on commission (5%)', amount: -commissionVat, kind: 'debit' },
        { label: 'Delivery fee adjustment', amount: adjustments, kind: 'debit' },
        { label: 'Expected payout', amount: expectedPayout, kind: 'net' },
      ],
    };
  }

  calculateTotals(lines: OrderLineItem[]): { subtotal: number; vatAmount: number; total: number } {
    const subtotal = this.round2(lines.reduce((s, l) => s + l.lineTotal, 0));
    const vatAmount = this.round2(subtotal * (this.vatRate / 100));
    const total = this.round2(subtotal + vatAmount);
    return { subtotal, vatAmount, total };
  }

  buildLines(itemSelections: Array<{ itemId: string; qty: number }>): OrderLineItem[] {
    const lines: OrderLineItem[] = [];
    for (const sel of itemSelections) {
      if (sel.qty <= 0) continue;
      const menuItem = this.menu.find(m => m.id === sel.itemId);
      if (!menuItem) continue;
      lines.push({
        itemId: menuItem.id,
        name: menuItem.name,
        qty: sel.qty,
        unitPrice: menuItem.price,
        lineTotal: this.round2(menuItem.price * sel.qty),
      });
    }
    return lines;
  }

  channelLabel(channel: OrderChannel): string {
    return CHANNEL_LABELS[channel] ?? channel;
  }

  destroy(): void {
    this.clearFeedTimers();
  }

  private scheduleRemainingArrivals(): void {
    const startIndex = this.liveIndex;
    // Anchor at 0 when starting fresh so first arrival waits its full delayMs.
    const anchorMs = startIndex > 0 ? LIVE_ARRIVALS[startIndex].delayMs : 0;
    for (let i = startIndex; i < LIVE_ARRIVALS.length; i++) {
      const seed = LIVE_ARRIVALS[i];
      const delay = Math.max(0, seed.delayMs - anchorMs);
      const id = setTimeout(() => {
        if (this.liveIndex !== i) return;
        this.liveIndex++;
        this.ingestLiveOrder(seed);
        if (this.liveIndex >= LIVE_ARRIVALS.length) {
          this.feedRunningSubject.next(false);
        }
      }, delay);
      this.feedTimers.push({ id, kind: 'arrival' });
    }
  }

  private ingestLiveOrder(seed: DemoSeedOrder): RestaurantOrder {
    const order = this.buildOrderFromSeed(seed, true);
    this.ordersSubject.next([order, ...this.orders]);
    this.flashOrder(order.id);
    return order;
  }

  private buildOrderFromSeed(seed: DemoSeedOrder, isLiveArrival: boolean): RestaurantOrder {
    this.orderSeq++;
    const lines = this.buildLines(seed.itemIds);
    const totals = this.calculateTotals(lines);
    const paid = !!seed.paid || seed.status === 'paid';
    let invoiceNumber: string | null = null;
    let paymentRef: string | null = null;

    if (paid || seed.status === 'billing') {
      this.invoiceSeq++;
      invoiceNumber = `TI-${new Date().getFullYear()}-${String(this.invoiceSeq).padStart(5, '0')}`;
    }
    if (paid) {
      paymentRef = `PL-${seed.channelOrderId.replace(/\W/g, '').slice(-8)}`;
    }

    return {
      id: `ord-${this.orderSeq}`,
      channel: seed.channel,
      channelOrderId: seed.channelOrderId,
      customerName: seed.customerName,
      items: lines,
      ...totals,
      status: paid ? 'paid' : seed.status ?? 'new',
      arrivedAt: new Date().toISOString(),
      paidAt: paid ? new Date().toISOString() : null,
      invoiceNumber,
      paymentRef,
      isLiveArrival,
    };
  }

  private advancePayment(state: PaymentState): void {
    const current = this.terminalSubject.value;
    const order = this.orders.find(o => o.id === current.orderId);
    if (!order) return;

    if (state === 'awaiting_tap') {
      this.terminalSubject.next({
        ...current,
        state,
        message: 'Present card on Pine Labs terminal',
      });
      return;
    }

    if (state === 'approved') {
      this.terminalSubject.next({
        ...current,
        state,
        authCode: '884421',
        rrn: `7844${Date.now().toString().slice(-8)}`,
        cardLast4: '4421',
        message: 'Payment approved',
      });
      return;
    }

    if (state === 'receipt_issued') {
      const orders = [...this.orders];
      const idx = orders.findIndex(o => o.id === order.id);
      if (idx >= 0) {
        const updated: RestaurantOrder = {
          ...orders[idx],
          status: 'paid',
          paidAt: new Date().toISOString(),
          paymentRef: `PL-${current.authCode ?? '884421'}`,
          invoiceNumber:
            orders[idx].invoiceNumber ??
            `TI-${new Date().getFullYear()}-${String(++this.invoiceSeq).padStart(5, '0')}`,
        };
        orders[idx] = updated;
        this.ordersSubject.next(orders);
      }

      this.terminalSubject.next({
        ...current,
        state,
        message: 'Receipt issued · Billing & payment complete',
      });
    }
  }

  private flashOrder(orderId: string): void {
    this.flashIdSubject.next(orderId);
    setTimeout(() => {
      if (this.flashIdSubject.value === orderId) {
        this.flashIdSubject.next(null);
      }
    }, 2800);
  }

  private emptyTerminal(): TerminalSession {
    return {
      state: 'idle',
      amount: 0,
      orderId: null,
      authCode: null,
      rrn: null,
      cardLast4: null,
      message: 'Ready for charge',
    };
  }

  private clearArrivalTimers(): void {
    this.clearTimersByKind('arrival');
  }

  private clearTimersByKind(kind: 'terminal' | 'arrival'): void {
    this.feedTimers = this.feedTimers.filter(t => {
      if (t.kind === kind) {
        clearTimeout(t.id);
        return false;
      }
      return true;
    });
  }

  private clearFeedTimers(): void {
    this.feedTimers.forEach(t => clearTimeout(t.id));
    this.feedTimers = [];
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
