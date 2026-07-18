import { Component, HostListener, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';
import {
  DEFAULT_TEST_CREDENTIALS,
  TestDeliveryOrder,
  TestIntegrationService,
  TestIntegrationSettings,
  TestPartnerId,
} from '../../../core/services/test-integration.service';

type SubTab = 'connections' | 'orders';
type IntegrationViewMode = 'full' | 'orders-only';

interface PartnerField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  secret?: boolean;
}

interface PartnerConfig {
  id: TestPartnerId;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  fields: PartnerField[];
}

@Component({
  selector: 'app-test-integration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './test-integration.html',
  styleUrl: './test-integration.scss',
})
export class TestIntegration implements OnInit {
  /** full = settings Connections + All Orders; orders-only = Sales page All Orders view */
  @Input() viewMode: IntegrationViewMode = 'full';

  @ViewChild('invoiceModal') invoiceModal!: TemplateRef<any>;
  @ViewChild('receiptModal') receiptModal!: TemplateRef<any>;
  @ViewChild('orderDetailModal') orderDetailModal!: TemplateRef<any>;

  activeSubTab: SubTab = 'connections';
  settingsForm!: FormGroup;
  settingsSaving = false;
  testingPartner: TestPartnerId | null = null;
  currentSettings!: TestIntegrationSettings;
  visibleSecrets: Record<string, boolean> = {};
  openMenuOrderId: string | null = null;
  chargingOrderId: string | null = null;

  partners: PartnerConfig[] = [
    {
      id: 'careem',
      name: 'Careem',
      label: 'Orders API · Platform',
      description: 'Connect Careem — local dummy token + sample orders.',
      icon: 'bi bi-bicycle',
      color: 'linear-gradient(135deg, #00e784 0%, #0a0a0a 100%)',
      fields: [
        { key: 'client_id', label: 'Client ID', placeholder: 'Careem Client ID', required: true },
        {
          key: 'client_secret',
          label: 'Client Secret',
          placeholder: 'Careem Client Secret',
          required: true,
          secret: true,
        },
      ],
    },
    {
      id: 'talabat',
      name: 'Talabat',
      label: 'Delivery · Platform',
      description: 'Connect Talabat with local dummy credentials and orders.',
      icon: 'bi bi-bag-check',
      color: 'linear-gradient(135deg, #ff5a00 0%, #ff8a3d 100%)',
      fields: [
        { key: 'client_id', label: 'Client ID', placeholder: 'Talabat Client ID', required: true },
        {
          key: 'client_secret',
          label: 'API Key / Secret',
          placeholder: 'Talabat API secret',
          required: true,
          secret: true,
        },
      ],
    },
    {
      id: 'keeta',
      name: 'Keeta',
      label: 'Delivery · Platform',
      description: 'Connect Keeta with local dummy credentials and orders.',
      icon: 'bi bi-scooter',
      color: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
      fields: [
        { key: 'client_id', label: 'Client ID', placeholder: 'Keeta Client ID', required: true },
        {
          key: 'client_secret',
          label: 'Client Secret',
          placeholder: 'Keeta Client Secret',
          required: true,
          secret: true,
        },
      ],
    },
  ];

  orders: TestDeliveryOrder[] = [];
  filteredOrders: TestDeliveryOrder[] = [];
  ordersLoading = false;
  liveFetching = false;
  latestLiveIds: string[] = [];
  orderSearch = '';
  statusFilter = 'all';
  paymentStatusFilter = 'all';
  partnerFilter: 'all' | TestPartnerId = 'all';
  selectedOrder: TestDeliveryOrder | null = null;
  private modalRef?: NgbModalRef;

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private modalService: NgbModal,
    private testIntegration: TestIntegrationService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    // Settings tab = connections only; Sales page = orders only
    this.activeSubTab = this.viewMode === 'orders-only' ? 'orders' : 'connections';
    this.loadSettings();
    if (this.viewMode === 'orders-only') {
      this.refreshOrdersList(false);
    }
  }

  get showConnections(): boolean {
    return this.viewMode === 'full';
  }

  get showOrders(): boolean {
    return this.viewMode === 'orders-only';
  }

  get showSubTabs(): boolean {
    return false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuOrderId = null;
  }

  private initForms(): void {
    const controls: Record<string, any> = {};
    this.partners.forEach(p => {
      const defaults = DEFAULT_TEST_CREDENTIALS[p.id];
      controls[`${p.id}_enabled`] = [true];
      controls[`${p.id}_client_id`] = [defaults.client_id];
      controls[`${p.id}_client_secret`] = [defaults.client_secret];
    });
    this.settingsForm = this.fb.group(controls);
  }

  switchSubTab(tab: SubTab): void {
    this.activeSubTab = tab;
    if (tab === 'orders') this.refreshOrdersList(false);
  }

  loadSettings(): void {
    this.currentSettings = this.testIntegration.getSettings();
    // Persist connected-by-default so badge stays Connected after refresh
    this.testIntegration.saveSettings(this.currentSettings).subscribe();
    const patch: Record<string, any> = {};
    this.partners.forEach(p => {
      const data = this.currentSettings.partners[p.id];
      const defaults = DEFAULT_TEST_CREDENTIALS[p.id];
      patch[`${p.id}_enabled`] = data?.enabled ?? true;
      patch[`${p.id}_client_id`] = data?.client_id || defaults.client_id;
      patch[`${p.id}_client_secret`] = data?.client_secret || defaults.client_secret;
    });
    this.settingsForm.patchValue(patch);
  }

  isConnected(id: TestPartnerId): boolean {
    return !!this.currentSettings?.partners?.[id]?.connected;
  }

  secretKey(partnerId: string, fieldKey: string): string {
    return `${partnerId}_${fieldKey}`;
  }

  isSecretVisible(partnerId: string, fieldKey: string): boolean {
    return !!this.visibleSecrets[this.secretKey(partnerId, fieldKey)];
  }

  toggleSecretVisibility(partnerId: string, fieldKey: string): void {
    const key = this.secretKey(partnerId, fieldKey);
    this.visibleSecrets[key] = !this.visibleSecrets[key];
  }

  saveSettings(): void {
    this.settingsSaving = true;
    const payload = this.buildSettingsPayload();
    this.testIntegration.saveSettings(payload).subscribe({
      next: () => {
        this.settingsSaving = false;
        this.currentSettings = payload;
        this.toast.show('Success', 'Platform integration settings saved locally', 'success');
      },
      error: () => {
        this.settingsSaving = false;
        this.toast.show('Error', 'Failed to save settings', 'danger');
      },
    });
  }

  testConnection(id: TestPartnerId): void {
    const partner = this.partners.find(p => p.id === id);
    if (!partner) return;

    const clientId = (this.settingsForm.get(`${id}_client_id`)?.value || '').trim();
    const clientSecret = (this.settingsForm.get(`${id}_client_secret`)?.value || '').trim();

    if (!clientId || !clientSecret) {
      this.toast.show('Validation', `Fill ${partner.name} Client ID and Secret`, 'warning');
      return;
    }

    this.testingPartner = id;
    this.settingsForm.get(`${id}_enabled`)?.setValue(true);

    this.testIntegration.testConnection(id, clientId, clientSecret).subscribe({
      next: res => {
        this.testingPartner = null;
        if (res.status === 200) {
          this.loadSettings();
          this.toast.show('Success', res.message || `${partner.name} connected`, 'success');
          this.loadPartnerOrders(id);
        } else {
          this.toast.show('Error', res.error || 'Connection failed', 'danger');
        }
      },
      error: () => {
        this.testingPartner = null;
        this.toast.show('Error', 'Connection failed', 'danger');
      },
    });
  }

  refreshOrdersList(showToast: boolean): void {
    this.ordersLoading = true;
    setTimeout(() => {
      this.orders = this.testIntegration.listOrders();
      this.applyOrderFilters();
      this.ordersLoading = false;
      if (showToast) {
        this.toast.show('Orders', `${this.orders.length} test order(s) loaded`, 'success');
      }
    }, 200);
  }

  reloadSampleOrders(): void {
    this.ordersLoading = true;
    setTimeout(() => {
      const connected = (['careem', 'talabat', 'keeta'] as TestPartnerId[]).filter(
        p => this.isConnected(p) || this.settingsForm.get(`${p}_enabled`)?.value
      );
      this.orders = this.testIntegration.refreshOrders(connected.length ? connected : undefined);
      this.latestLiveIds = [];
      this.applyOrderFilters();
      this.ordersLoading = false;
      this.toast.show(
        'Orders',
        `Refreshed ${this.orders.length} local dummy order(s)`,
        'success'
      );
    }, 450);
  }

  /** Append random live orders only — never mutates existing order states. */
  fetchLiveData(): void {
    if (this.liveFetching || this.ordersLoading) return;
    this.liveFetching = true;

    setTimeout(() => {
      const { orders, added } = this.testIntegration.fetchLiveOrders();
      this.orders = orders;
      this.latestLiveIds = added.map(o => o.id);
      this.applyOrderFilters();
      this.liveFetching = false;

      const labels = added.map(o => `${this.partnerLabel(o.partner)} ${o.externalId}`).join(', ');
      this.toast.show(
        'Live fetch',
        `${added.length} new order(s) arrived · ${labels}. Existing orders unchanged.`,
        'success'
      );

      // Clear highlight after a few seconds
      setTimeout(() => {
        this.latestLiveIds = [];
      }, 4000);
    }, 700);
  }

  isLiveArrival(orderId: string): boolean {
    return this.latestLiveIds.includes(orderId);
  }

  private loadPartnerOrders(partner: TestPartnerId): void {
    this.testIntegration.refreshOrders([partner]);
    this.orders = this.testIntegration.listOrders();
    this.partnerFilter = 'all';
    this.activeSubTab = 'orders';
    this.applyOrderFilters();
  }

  applyOrderFilters(): void {
    let list = [...this.orders];
    if (this.partnerFilter !== 'all') {
      list = list.filter(o => o.partner === this.partnerFilter);
    }
    const q = this.orderSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        o =>
          o.externalId.toLowerCase().includes(q) ||
          o.invoiceNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.branch.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q) ||
          o.paymentStatus.toLowerCase().includes(q) ||
          o.items.some(i => i.name.toLowerCase().includes(q))
      );
    }
    if (this.statusFilter !== 'all') {
      list = list.filter(o => o.status === this.statusFilter);
    }
    if (this.paymentStatusFilter !== 'all') {
      list = list.filter(o => o.paymentStatus === this.paymentStatusFilter);
    }
    this.filteredOrders = list;
  }

  onOrderSearchChange(): void {
    this.applyOrderFilters();
  }

  onStatusFilterChange(): void {
    this.applyOrderFilters();
  }

  onPaymentStatusFilterChange(): void {
    this.applyOrderFilters();
  }

  onPartnerFilterChange(): void {
    this.applyOrderFilters();
  }

  get uniqueStatuses(): string[] {
    return [...new Set(this.orders.map(o => o.status).filter(Boolean))];
  }

  get totalOrders(): number {
    return this.orders.length;
  }

  get totalSales(): number {
    return this.round2(this.orders.reduce((sum, order) => sum + order.total, 0));
  }

  get paidOrders(): number {
    return this.orders.filter(order => order.paymentStatus === 'paid').length;
  }

  get paidAmount(): number {
    return this.round2(
      this.orders
        .filter(order => order.paymentStatus === 'paid')
        .reduce((sum, order) => sum + order.total, 0)
    );
  }

  get awaitingPaymentOrders(): number {
    return this.orders.filter(order =>
      order.paymentStatus === 'pending' ||
      order.paymentStatus === 'failed' ||
      order.paymentStatus === 'awaiting_mobile'
    ).length;
  }

  get awaitingPaymentAmount(): number {
    return this.round2(
      this.orders
        .filter(
          order =>
            order.paymentStatus === 'pending' ||
            order.paymentStatus === 'failed' ||
            order.paymentStatus === 'awaiting_mobile'
        )
        .reduce((sum, order) => sum + order.total, 0)
    );
  }

  get totalVat(): number {
    return this.round2(this.orders.reduce((sum, order) => sum + order.vatAmount, 0));
  }

  partnerLabel(id: TestPartnerId): string {
    return this.testIntegration.partnerLabel(id);
  }

  paymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      paid: 'Paid',
      pending: 'Pending',
      failed: 'Failed',
      refunded: 'Refunded',
      awaiting_mobile: 'Awaiting mobile',
    };
    return map[status] || status;
  }

  canChargeOnTerminal(order: TestDeliveryOrder): boolean {
    return order.paymentStatus === 'pending' || order.paymentStatus === 'failed';
  }

  isAwaitingMobile(order: TestDeliveryOrder): boolean {
    return order.paymentStatus === 'awaiting_mobile';
  }

  /** Send amount to terminal/mobile only — does NOT mark paid. */
  chargeOnTerminal(order: TestDeliveryOrder, event?: Event): void {
    event?.stopPropagation();
    this.openMenuOrderId = null;

    if (order.paymentStatus === 'paid') {
      this.toast.show('Info', 'This order is already paid', 'info');
      return;
    }
    if (order.paymentStatus === 'awaiting_mobile') {
      this.toast.show(
        'Awaiting mobile',
        `AED ${order.total.toFixed(2)} already sent. Waiting for payment on terminal / mobile.`,
        'info'
      );
      return;
    }
    if (!this.canChargeOnTerminal(order)) return;
    if (this.chargingOrderId) return;

    const amount = order.total.toFixed(2);
    this.chargingOrderId = order.id;

    // Mark as awaiting mobile — Paid only after mobile confirms
    const updated = this.testIntegration.updatePaymentStatus(order.id, 'awaiting_mobile');
    this.chargingOrderId = null;

    if (!updated) {
      this.toast.show('Error', 'Could not send payment to terminal', 'danger');
      return;
    }

    this.orders = this.testIntegration.listOrders();
    this.applyOrderFilters();
    if (this.selectedOrder?.id === order.id) {
      this.selectedOrder = updated;
    }

    this.toast.show(
      'Pine Labs terminal',
      `AED ${amount} payment details sent to terminal / mobile. Please process the payment — status will stay unpaid until mobile confirms.`,
      'info'
    );
  }

  /** Demo: simulate mobile/terminal confirming the payment. */
  confirmMobilePayment(order: TestDeliveryOrder, event?: Event): void {
    event?.stopPropagation();
    this.openMenuOrderId = null;

    if (order.paymentStatus !== 'awaiting_mobile') {
      this.toast.show('Info', 'Charge on terminal first, then confirm from mobile', 'info');
      return;
    }

    const amount = order.total.toFixed(2);
    const updated = this.testIntegration.updatePaymentStatus(order.id, 'paid');
    if (!updated) {
      this.toast.show('Error', 'Could not update payment status', 'danger');
      return;
    }

    this.orders = this.testIntegration.listOrders();
    this.applyOrderFilters();
    if (this.selectedOrder?.id === order.id) {
      this.selectedOrder = updated;
    }

    this.toast.show(
      'Payment successful',
      `Mobile / terminal confirmed · AED ${amount} paid`,
      'success'
    );
    setTimeout(() => this.openReceipt(updated), 250);
  }

  toggleActionMenu(orderId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuOrderId = this.openMenuOrderId === orderId ? null : orderId;
  }

  /** Eye button → invoice modal */
  openInvoice(order: TestDeliveryOrder, event?: Event): void {
    event?.stopPropagation();
    this.openMenuOrderId = null;
    this.selectedOrder = order;
    this.modalRef = this.modalService.open(this.invoiceModal, {
      size: 'md',
      centered: true,
      windowClass: 'integration-order-modal',
    });
  }

  /** 3-dot → detailed order modal */
  openOrderDetail(order: TestDeliveryOrder, event?: Event): void {
    event?.stopPropagation();
    this.openMenuOrderId = null;
    this.selectedOrder = order;
    this.modalRef = this.modalService.open(this.orderDetailModal, {
      size: 'lg',
      centered: true,
      windowClass: 'integration-order-modal',
    });
  }

  openInvoiceFromDetail(): void {
    const order = this.selectedOrder;
    if (!order) return;
    this.modalRef?.dismiss();
    this.modalRef = undefined;
    setTimeout(() => this.openInvoice(order), 120);
  }

  openReceipt(order: TestDeliveryOrder, event?: Event): void {
    event?.stopPropagation();
    this.openMenuOrderId = null;
    if (order.paymentStatus !== 'paid') {
      this.toast.show('Payment pending', 'Receipt is available after successful payment', 'warning');
      return;
    }
    this.selectedOrder = order;
    this.modalRef?.dismiss();
    this.modalRef = undefined;
    setTimeout(() => {
      this.modalRef = this.modalService.open(this.receiptModal, {
        size: 'sm',
        centered: true,
        windowClass: 'integration-receipt-modal',
      });
    }, 120);
  }

  printReceipt(): void {
    const order = this.selectedOrder;
    if (!order || order.paymentStatus !== 'paid') return;

    const itemRows = order.items
      .map(
        item => `
          <tr>
            <td>${item.quantity} × ${item.name}</td>
            <td style="text-align:right">AED ${item.total_price.toFixed(2)}</td>
          </tr>`
      )
      .join('');
    const popup = window.open('', '_blank', 'width=420,height=720');
    if (!popup) {
      this.toast.show('Print blocked', 'Please allow pop-ups to print the receipt', 'warning');
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Receipt ${order.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; width: 300px; margin: 20px auto; color: #111; }
            .center { text-align: center; }
            .muted { color: #555; font-size: 12px; }
            .rule { border-top: 1px dashed #777; margin: 12px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            td { padding: 4px 0; vertical-align: top; }
            .total { font-size: 16px; font-weight: 700; }
            @media print { body { margin: 0 auto; } }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin-bottom:4px">Al Manara Kitchen</h2>
            <div class="muted">Al Quoz Industrial Area 3, Dubai</div>
            <div class="muted">TRN: 100312345600003</div>
            <div class="rule"></div>
            <strong>PAYMENT RECEIPT</strong>
            <div class="muted">${order.invoiceNumber} · ${order.externalId}</div>
          </div>
          <div class="rule"></div>
          <table>${itemRows}</table>
          <div class="rule"></div>
          <table>
            <tr><td>Subtotal</td><td style="text-align:right">AED ${order.subtotal.toFixed(2)}</td></tr>
            <tr><td>VAT 5%</td><td style="text-align:right">AED ${order.vatAmount.toFixed(2)}</td></tr>
            <tr><td>Delivery</td><td style="text-align:right">AED ${order.deliveryFee.toFixed(2)}</td></tr>
            <tr class="total"><td>Total paid</td><td style="text-align:right">AED ${order.total.toFixed(2)}</td></tr>
          </table>
          <div class="rule"></div>
          <div class="muted">Payment: ${order.paymentType}</div>
          <div class="muted">Reference: ${order.paymentReference || '—'}</div>
          <div class="muted">Paid: ${new Date(order.paidAt || order.createdAt).toLocaleString()}</div>
          <p class="center muted">Thank you</p>
          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  closeModal(): void {
    this.modalRef?.dismiss();
  }

  itemCount(order: TestDeliveryOrder): number {
    return order.items.reduce((s, i) => s + i.quantity, 0);
  }

  private buildSettingsPayload(): TestIntegrationSettings {
    const partners = {} as TestIntegrationSettings['partners'];
    this.partners.forEach(p => {
      const prev = this.currentSettings?.partners?.[p.id];
      const clientId = this.settingsForm.get(`${p.id}_client_id`)?.value || '';
      const clientSecret = this.settingsForm.get(`${p.id}_client_secret`)?.value || '';
      partners[p.id] = {
        enabled: !!this.settingsForm.get(`${p.id}_enabled`)?.value,
        client_id: clientId,
        client_secret: clientSecret,
        // Keep Connected when demo credentials are present
        connected: !!(clientId.trim() && clientSecret.trim()) || !!prev?.connected,
        lastTestedAt: prev?.lastTestedAt ?? new Date().toISOString(),
      };
    });
    return { partners };
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
