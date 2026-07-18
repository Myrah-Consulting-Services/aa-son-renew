import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  DashboardSummary,
  MenuItem,
  MerchantProfile,
  OrderChannel,
  PayoutReconciliation,
  RestaurantOrder,
  TerminalSession,
} from './restaurant-demo.models';
import { RestaurantDemoService } from './restaurant-demo.service';

type DemoSection = 'orders' | 'bill' | 'terminal' | 'dashboard' | 'reconcile';

@Component({
  selector: 'app-restaurant-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [RestaurantDemoService],
  templateUrl: './restaurant-demo.html',
  styleUrl: './restaurant-demo.scss',
})
export class RestaurantDemo implements OnInit, OnDestroy {
  merchant!: MerchantProfile;
  menu: MenuItem[] = [];
  orders: RestaurantOrder[] = [];
  selected: RestaurantOrder | null = null;
  terminal!: TerminalSession;
  dashboard!: DashboardSummary;
  payout!: PayoutReconciliation;
  feedRunning = false;
  flashId: string | null = null;
  remainingArrivals = 0;

  activeSection: DemoSection = 'orders';
  walkInQty: Record<string, number> = {};
  toastMessage = '';
  private toastTimer?: ReturnType<typeof setTimeout>;
  private subs = new Subscription();

  constructor(private demo: RestaurantDemoService) {}

  ngOnInit(): void {
    this.merchant = this.demo.merchant;
    this.menu = this.demo.menu;
    this.resetWalkInQty();

    this.subs.add(this.demo.orders$.subscribe(orders => {
      this.orders = orders;
      this.refreshDerived();
    }));
    this.subs.add(this.demo.selectedId$.subscribe(() => {
      this.selected = this.demo.selectedOrder;
      this.refreshDerived();
    }));
    this.subs.add(this.demo.terminal$.subscribe(t => {
      this.terminal = t;
      if (t.state === 'receipt_issued') {
        this.showToast('Payment confirmed on Pine Labs terminal');
      }
    }));
    this.subs.add(this.demo.feedRunning$.subscribe(v => (this.feedRunning = v)));
    this.subs.add(this.demo.flashId$.subscribe(id => {
      this.flashId = id;
      if (id) {
        const order = this.orders.find(o => o.id === id);
        if (order?.isLiveArrival) {
          this.showToast(`${this.channelLabel(order.channel)} order arrived · ${order.channelOrderId}`);
        }
      }
    }));

    this.refreshDerived();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.demo.destroy();
  }

  goTo(section: DemoSection): void {
    this.activeSection = section;
    if (section === 'bill' && this.selected) {
      this.demo.ensureInvoice(this.selected.id);
      this.selected = this.demo.selectedOrder;
    }
    if (section === 'dashboard' || section === 'reconcile') {
      this.refreshDerived();
    }
  }

  selectOrder(order: RestaurantOrder): void {
    this.demo.selectOrder(order.id);
    this.selected = this.demo.selectedOrder;
    this.activeSection = 'orders';
  }

  startLiveFeed(): void {
    this.demo.startLiveFeed();
    this.remainingArrivals = this.demo.remainingLiveArrivals;
    this.showToast('Live feed started — orders will arrive automatically');
  }

  pushNextArrival(): void {
    const order = this.demo.pushNextArrival();
    this.remainingArrivals = this.demo.remainingLiveArrivals;
    if (!order) {
      this.showToast('No more scheduled arrivals');
    }
  }

  resetDemo(): void {
    this.demo.reset();
    this.resetWalkInQty();
    this.activeSection = 'orders';
    this.remainingArrivals = this.demo.remainingLiveArrivals;
    this.showToast('Demo reset — ready to record');
  }

  incrementWalkIn(itemId: string): void {
    this.walkInQty[itemId] = (this.walkInQty[itemId] || 0) + 1;
  }

  decrementWalkIn(itemId: string): void {
    this.walkInQty[itemId] = Math.max(0, (this.walkInQty[itemId] || 0) - 1);
  }

  get walkInSelectionCount(): number {
    return Object.values(this.walkInQty).reduce((s, q) => s + q, 0);
  }

  addWalkIn(): void {
    const selections = Object.entries(this.walkInQty)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, qty }));
    const order = this.demo.addWalkInOrder(selections);
    if (!order) {
      this.showToast('Select at least one menu item');
      return;
    }
    this.resetWalkInQty();
    this.showToast(`Walk-in order ${order.channelOrderId} added`);
  }

  openBill(): void {
    if (!this.selected) return;
    this.demo.ensureInvoice(this.selected.id);
    this.selected = this.demo.selectedOrder;
    this.activeSection = 'bill';
  }

  chargeOnTerminal(): void {
    if (!this.selected || this.selected.status === 'paid') return;
    this.activeSection = 'terminal';
    this.demo.chargeOnTerminal();
    this.selected = this.demo.selectedOrder;
  }

  channelLabel(channel: OrderChannel): string {
    return this.demo.channelLabel(channel);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      new: 'New',
      billing: 'Billing',
      paid: 'Paid',
      ready: 'Ready',
    };
    return map[status] || status;
  }

  terminalStateLabel(state: string): string {
    const map: Record<string, string> = {
      idle: 'Ready',
      sent_to_terminal: 'Sent to terminal',
      awaiting_tap: 'Awaiting card tap',
      approved: 'Approved',
      receipt_issued: 'Receipt issued',
    };
    return map[state] || state;
  }

  trackByOrderId(_: number, order: RestaurantOrder): string {
    return order.id;
  }

  private refreshDerived(): void {
    this.selected = this.demo.selectedOrder;
    this.dashboard = this.demo.getDashboard();
    this.payout = this.demo.getPayoutReconciliation();
    this.remainingArrivals = this.demo.remainingLiveArrivals;
  }

  private resetWalkInQty(): void {
    this.walkInQty = {};
    this.menu.forEach(m => (this.walkInQty[m.id] = 0));
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMessage = ''), 3200);
  }
}
