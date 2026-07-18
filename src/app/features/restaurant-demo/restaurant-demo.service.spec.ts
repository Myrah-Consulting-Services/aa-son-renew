import { fakeAsync, tick } from '@angular/core/testing';
import { RestaurantDemoService } from './restaurant-demo.service';
import { LIVE_ARRIVALS, MERCHANT } from './restaurant-demo.data';

describe('RestaurantDemoService', () => {
  let service: RestaurantDemoService;

  beforeEach(() => {
    service = new RestaurantDemoService();
  });

  afterEach(() => {
    service.destroy();
  });

  it('seeds initial UAE orders and selects walk-in by default', () => {
    expect(service.orders.length).toBe(3);
    expect(service.selectedOrder?.channel).toBe('walkin');
    expect(service.merchant.trn).toBe(MERCHANT.trn);
    expect(service.vatRate).toBe(5);
  });

  it('calculates 5% VAT exclusively on line totals', () => {
    const lines = service.buildLines([
      { itemId: 'm1', qty: 2 }, // 42 * 2 = 84
      { itemId: 'm6', qty: 1 }, // 12
    ]);
    const totals = service.calculateTotals(lines);
    expect(totals.subtotal).toBe(96);
    expect(totals.vatAmount).toBe(4.8);
    expect(totals.total).toBe(100.8);
  });

  it('pushes deterministic live arrivals and resets cleanly', () => {
    const first = service.pushNextArrival();
    expect(first?.channel).toBe('talabat');
    expect(first?.channelOrderId).toBe(LIVE_ARRIVALS[0].channelOrderId);
    expect(first?.isLiveArrival).toBeTrue();
    expect(service.orders.length).toBe(4);

    const second = service.pushNextArrival();
    expect(second?.channel).toBe('keeta');
    expect(service.remainingLiveArrivals).toBe(0);
    expect(service.pushNextArrival()).toBeNull();

    service.reset();
    expect(service.orders.length).toBe(3);
    expect(service.remainingLiveArrivals).toBe(LIVE_ARRIVALS.length);
    expect(service.terminal.state).toBe('idle');
  });

  it('runs timed live feed arrivals', fakeAsync(() => {
    service.startLiveFeed();
    expect(service.feedRunning).toBeTrue();

    tick(2499);
    expect(service.orders.some(o => o.channelOrderId === LIVE_ARRIVALS[0].channelOrderId)).toBeFalse();

    tick(1);
    expect(service.orders.some(o => o.channelOrderId === LIVE_ARRIVALS[0].channelOrderId)).toBeTrue();

    tick(3000);
    expect(service.orders.some(o => o.channelOrderId === LIVE_ARRIVALS[1].channelOrderId)).toBeTrue();
    expect(service.feedRunning).toBeFalse();
  }));

  it('creates invoice then completes Pine Labs payment states', fakeAsync(() => {
    const walkIn = service.selectedOrder!;
    service.selectOrder(walkIn.id);

    const invoiced = service.ensureInvoice();
    expect(invoiced?.invoiceNumber).toMatch(/^TI-\d{4}-\d{5}$/);
    expect(invoiced?.status).toBe('billing');

    service.chargeOnTerminal();
    expect(service.terminal.state).toBe('sent_to_terminal');
    expect(service.terminal.amount).toBe(walkIn.total);

    tick(900);
    expect(service.terminal.state).toBe('awaiting_tap');

    tick(1300);
    expect(service.terminal.state).toBe('approved');
    expect(service.terminal.authCode).toBeTruthy();

    tick(1200);
    expect(service.terminal.state).toBe('receipt_issued');
    expect(service.selectedOrder?.status).toBe('paid');
    expect(service.selectedOrder?.paymentRef).toBeTruthy();
  }));

  it('builds dashboard channel totals from current orders', () => {
    const dashboard = service.getDashboard();
    expect(dashboard.orderCount).toBe(3);
    expect(dashboard.byChannel.length).toBe(3);
    expect(dashboard.totalSales).toBeGreaterThan(0);
    expect(dashboard.totalVat).toBe(
      Math.round(dashboard.byChannel.reduce((s, c) => s + c.vat, 0) * 100) / 100
    );

    const talabat = dashboard.byChannel.find(c => c.channel === 'talabat')!;
    expect(talabat.orderCount).toBe(1);
    expect(talabat.sales).toBeGreaterThan(0);
  });

  it('matches Talabat payout reconciliation against statement', () => {
    const payout = service.getPayoutReconciliation();
    expect(payout.channel).toBe('talabat');
    expect(payout.grossOrders).toBeGreaterThan(0);
    expect(payout.commission).toBe(Math.round(payout.grossOrders * 0.22 * 100) / 100);
    expect(payout.expectedPayout).toBe(payout.statementPayout);
    expect(payout.matched).toBeTrue();
    expect(payout.orderRefs.length).toBe(1);
  });

  it('adds walk-in orders from menu selections', () => {
    const order = service.addWalkInOrder([
      { itemId: 'm3', qty: 1 },
      { itemId: 'm8', qty: 2 },
    ]);
    expect(order?.channel).toBe('walkin');
    expect(order?.items.length).toBe(2);
    expect(order?.subtotal).toBe(75 + 44);
    expect(order?.vatAmount).toBe(Math.round((119 * 0.05) * 100) / 100);
    expect(service.selectedOrder?.id).toBe(order?.id);
  });
});
