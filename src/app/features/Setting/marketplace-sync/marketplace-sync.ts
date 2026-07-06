import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import {
  MarketplaceSyncService,
  MarketplaceSettings,
  MarketplaceOrder,
  MarketplaceSource,
  OrderStatus,
} from '../../../core/services/marketplace-sync.service';

type SubTab = 'settings' | 'orders';

interface MarketplaceField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  secret?: boolean;
  hint?: string;
}

interface MarketplaceConfig {
  id: MarketplaceSource;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  docsUrl: string;
  fields: MarketplaceField[];
}

@Component({
  selector: 'app-marketplace-sync',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './marketplace-sync.html',
  styleUrl: './marketplace-sync.scss',
})
export class MarketplaceSync implements OnInit, OnDestroy {
  @ViewChild('orderDetailModal') orderDetailModal!: TemplateRef<any>;
  @ViewChild('unifiedLedgerInput') unifiedLedgerInput?: ElementRef<HTMLInputElement>;
  @ViewChild('feeLedgerInput') feeLedgerInput?: ElementRef<HTMLInputElement>;

  activeSubTab: SubTab = 'settings';
  settingsForm!: FormGroup;
  settingsSaving = false;
  syncing = false;
  currentSettings!: MarketplaceSettings;

  marketplaces: MarketplaceConfig[] = [
    {
      id: 'noon',
      name: 'Noon',
      label: 'noon.com',
      description: 'Sync Noon seller orders and reconcile payouts into your unified marketplace ledger.',
      icon: 'bi bi-sun',
      color: 'linear-gradient(135deg, #feee00 0%, #f5a623 100%)',
      docsUrl: 'https://seller.noon.com/',
      fields: [
        { key: 'seller_id', label: 'Seller ID', placeholder: 'Noon seller ID', required: true },
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', required: true, secret: true },
        { key: 'api_secret', label: 'API Secret', placeholder: 'Enter API secret', required: true, secret: true },
        { key: 'warehouse_id', label: 'Warehouse ID', placeholder: 'FBN warehouse ID', hint: 'Required for FBN orders' },
      ],
    },
    {
      id: 'amazon',
      name: 'Amazon.ae',
      label: 'Amazon UAE',
      description: 'Connect Amazon Seller Central (SP-API) to pull Amazon.ae orders into one ledger.',
      icon: 'bi bi-box-seam',
      color: 'linear-gradient(135deg, #ff9900 0%, #232f3e 100%)',
      docsUrl: 'https://sellercentral.amazon.ae/',
      fields: [
        { key: 'seller_id', label: 'Seller ID', placeholder: 'Amazon seller ID', required: true },
        { key: 'client_id', label: 'LWA Client ID', placeholder: 'amzn1.application-oa2-client.xxx', required: true },
        { key: 'client_secret', label: 'Client Secret', placeholder: 'Enter client secret', required: true, secret: true },
        { key: 'refresh_token', label: 'Refresh Token', placeholder: 'SP-API refresh token', required: true, secret: true },
        { key: 'marketplace_id', label: 'Marketplace ID', placeholder: 'A2VIGQ35RCS4UG', hint: 'Amazon.ae marketplace ID' },
      ],
    },
  ];

  expandedMarketplace: MarketplaceSource | null = 'noon';
  visibleSecrets: Record<string, boolean> = {};

  orders: MarketplaceOrder[] = [];
  filteredOrders: MarketplaceOrder[] = [];
  orderSearch = '';
  sourceFilter: 'all' | MarketplaceSource = 'all';
  statusFilter: 'all' | OrderStatus = 'all';
  selectedOrder: MarketplaceOrder | null = null;
  selectAll = false;

  // Ledger search - unified
  ledgers: any[] = [];
  filteredLedgers: any[] = [];
  unifiedLedgerSearch = '';
  showUnifiedLedgerDropdown = false;
  activeUnifiedLedgerIndex = -1;
  selectedUnifiedLedger: any = null;
  unifiedLedgerContext: 'unified' | 'fee' = 'unified';

  // Ledger search - fee
  feeLedgerSearch = '';
  showFeeLedgerDropdown = false;
  activeFeeLedgerIndex = -1;
  selectedFeeLedger: any = null;

  ledgerLoading = false;

  private modalRef?: NgbModalRef;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    private modalService: NgbModal,
    private marketplaceService: MarketplaceSyncService
  ) {
    this.initForms();
  }

  ngOnInit() {
    this.loadSettings();
    this.refreshOrders();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms() {
    const controls: Record<string, any> = {
      enabled: [false],
      auto_sync_interval: ['manual'],
      create_invoice_on_reconcile: [false],
    };

    this.marketplaces.forEach(mp => {
      controls[`${mp.id}_enabled`] = [false];
      controls[`${mp.id}_auto_reconcile`] = [false];
      mp.fields.forEach(field => {
        controls[`${mp.id}_${field.key}`] = [field.key === 'marketplace_id' ? 'A2VIGQ35RCS4UG' : ''];
      });
    });

    this.settingsForm = this.fb.group(controls);
  }

  switchSubTab(tab: SubTab) {
    this.activeSubTab = tab;
    if (tab === 'orders') this.refreshOrders();
  }

  loadSettings() {
    this.marketplaceService.getSettings().subscribe(settings => {
      this.currentSettings = settings;
      this.patchSettingsForm(settings);
    });
  }

  private patchSettingsForm(s: MarketplaceSettings) {
    const patch: Record<string, any> = {
      enabled: s.enabled,
      auto_sync_interval: s.autoSyncInterval,
      create_invoice_on_reconcile: s.createInvoiceOnReconcile,
    };

    this.marketplaces.forEach(mp => {
      const data = s.marketplaces[mp.id];
      patch[`${mp.id}_enabled`] = data?.enabled ?? false;
      patch[`${mp.id}_auto_reconcile`] = data?.auto_reconcile ?? false;
      mp.fields.forEach(field => {
        patch[`${mp.id}_${field.key}`] = (data as any)?.[field.key] || '';
      });
    });

    this.settingsForm.patchValue(patch);

    if (s.unifiedLedgerId && s.unifiedLedgerName) {
      this.selectedUnifiedLedger = { id: s.unifiedLedgerId, name: s.unifiedLedgerName };
      this.unifiedLedgerSearch = s.unifiedLedgerName;
    }
    if (s.feeLedgerId && s.feeLedgerName) {
      this.selectedFeeLedger = { id: s.feeLedgerId, name: s.feeLedgerName };
      this.feeLedgerSearch = s.feeLedgerName;
    }
  }

  private buildSettingsPayload(): MarketplaceSettings {
    const v = this.settingsForm.value;
    const marketplaces: MarketplaceSettings['marketplaces'] = {
      noon: this.buildMarketplaceData('noon'),
      amazon: this.buildMarketplaceData('amazon'),
    };

    return {
      enabled: v.enabled,
      unifiedLedgerId: this.selectedUnifiedLedger?.id ?? null,
      unifiedLedgerName: this.selectedUnifiedLedger?.name || '',
      feeLedgerId: this.selectedFeeLedger?.id ?? null,
      feeLedgerName: this.selectedFeeLedger?.name || '',
      autoSyncInterval: v.auto_sync_interval,
      createInvoiceOnReconcile: v.create_invoice_on_reconcile,
      marketplaces,
    };
  }

  private buildMarketplaceData(id: MarketplaceSource) {
    const mp = this.marketplaces.find(m => m.id === id)!;
    const data: any = {
      enabled: this.settingsForm.get(`${id}_enabled`)?.value ?? false,
      auto_reconcile: this.settingsForm.get(`${id}_auto_reconcile`)?.value ?? false,
    };
    mp.fields.forEach(field => {
      data[field.key] = this.settingsForm.get(`${id}_${field.key}`)?.value || '';
    });
    return data;
  }

  saveSettings() {
    this.settingsSaving = true;
    const payload = this.buildSettingsPayload();
    this.marketplaceService.saveSettings(payload).subscribe(() => {
      this.currentSettings = payload;
      this.settingsSaving = false;
      this.toast.show('Success', 'Marketplace settings saved', 'success');
    });
  }

  toggleMarketplaceExpand(id: MarketplaceSource) {
    this.expandedMarketplace = this.expandedMarketplace === id ? null : id;
  }

  onMarketplaceToggle(id: MarketplaceSource) {
    if (this.settingsForm.get(`${id}_enabled`)?.value) {
      this.expandedMarketplace = id;
    }
  }

  isMarketplaceConfigured(id: MarketplaceSource): boolean {
    return this.marketplaceService.isMarketplaceConfigured(id, this.buildSettingsPayload());
  }

  secretKey(mpId: string, fieldKey: string): string {
    return `${mpId}_${fieldKey}`;
  }

  isSecretVisible(mpId: string, fieldKey: string): boolean {
    return !!this.visibleSecrets[this.secretKey(mpId, fieldKey)];
  }

  toggleSecretVisibility(mpId: string, fieldKey: string) {
    const key = this.secretKey(mpId, fieldKey);
    this.visibleSecrets[key] = !this.visibleSecrets[key];
  }

  testConnection(id: MarketplaceSource) {
    const mp = this.marketplaces.find(m => m.id === id);
    if (!mp) return;
    const missing = mp.fields.filter(
      f => f.required && !this.settingsForm.get(`${id}_${f.key}`)?.value?.trim()
    );
    if (missing.length) {
      this.toast.show('Validation', `Please fill in ${missing.map(f => f.label).join(', ')}`, 'warning');
      return;
    }
    this.toast.show('Connection Test', `${mp.name} credentials saved locally. Backend verification pending.`, 'success');
  }

  // Ledger dropdown
  fetchLedgers() {
    this.ledgerLoading = true;
    this.api.post<any>('/journal-voucher/list-all-ledgers/', { company: this.api.getUserCompany() }).subscribe({
      next: res => {
        this.ledgerLoading = false;
        this.ledgers = res?.status === 200 ? res.data || [] : [];
        this.filterLedgers();
      },
      error: () => {
        this.ledgerLoading = false;
        this.ledgers = [];
        this.filteredLedgers = [];
      },
    });
  }

  filterLedgers() {
    const term = this.unifiedLedgerContext === 'unified'
      ? this.unifiedLedgerSearch.trim().toLowerCase()
      : this.feeLedgerSearch.trim().toLowerCase();

    this.filteredLedgers = term
      ? this.ledgers.filter(l => (l.name || '').toLowerCase().includes(term))
      : [...this.ledgers];

    if (this.unifiedLedgerContext === 'unified') {
      this.activeUnifiedLedgerIndex = this.filteredLedgers.length ? 0 : -1;
    } else {
      this.activeFeeLedgerIndex = this.filteredLedgers.length ? 0 : -1;
    }
  }

  onUnifiedLedgerFocus() {
    this.unifiedLedgerContext = 'unified';
    this.showUnifiedLedgerDropdown = true;
    this.showFeeLedgerDropdown = false;
    if (!this.ledgers.length) this.fetchLedgers();
    else this.filterLedgers();
    setTimeout(() => this.unifiedLedgerInput?.nativeElement?.focus(), 0);
  }

  onFeeLedgerFocus() {
    this.unifiedLedgerContext = 'fee';
    this.showFeeLedgerDropdown = true;
    this.showUnifiedLedgerDropdown = false;
    if (!this.ledgers.length) this.fetchLedgers();
    else this.filterLedgers();
    setTimeout(() => this.feeLedgerInput?.nativeElement?.focus(), 0);
  }

  onUnifiedLedgerInput() {
    this.unifiedLedgerContext = 'unified';
    this.selectedUnifiedLedger = null;
    this.showUnifiedLedgerDropdown = true;
    this.filterLedgers();
  }

  onFeeLedgerInput() {
    this.unifiedLedgerContext = 'fee';
    this.selectedFeeLedger = null;
    this.showFeeLedgerDropdown = true;
    this.filterLedgers();
  }

  selectLedger(ledger: any) {
    if (this.unifiedLedgerContext === 'unified') {
      this.selectedUnifiedLedger = ledger;
      this.unifiedLedgerSearch = ledger.name || '';
      this.showUnifiedLedgerDropdown = false;
    } else {
      this.selectedFeeLedger = ledger;
      this.feeLedgerSearch = ledger.name || '';
      this.showFeeLedgerDropdown = false;
    }
  }

  clearUnifiedLedger() {
    this.selectedUnifiedLedger = null;
    this.unifiedLedgerSearch = '';
  }

  clearFeeLedger() {
    this.selectedFeeLedger = null;
    this.feeLedgerSearch = '';
  }

  onLedgerKeydown(event: KeyboardEvent, context: 'unified' | 'fee') {
    const isOpen = context === 'unified' ? this.showUnifiedLedgerDropdown : this.showFeeLedgerDropdown;
    const activeIdx = context === 'unified' ? this.activeUnifiedLedgerIndex : this.activeFeeLedgerIndex;

    if (!isOpen) {
      if (event.key === 'ArrowDown') {
        context === 'unified' ? this.onUnifiedLedgerFocus() : this.onFeeLedgerFocus();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.filteredLedgers.length) {
          const next = Math.min(activeIdx + 1, this.filteredLedgers.length - 1);
          if (context === 'unified') this.activeUnifiedLedgerIndex = next;
          else this.activeFeeLedgerIndex = next;
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.filteredLedgers.length) {
          const prev = Math.max(activeIdx - 1, 0);
          if (context === 'unified') this.activeUnifiedLedgerIndex = prev;
          else this.activeFeeLedgerIndex = prev;
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (activeIdx >= 0 && this.filteredLedgers[activeIdx]) {
          this.unifiedLedgerContext = context;
          this.selectLedger(this.filteredLedgers[activeIdx]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.showUnifiedLedgerDropdown = false;
        this.showFeeLedgerDropdown = false;
        break;
    }
  }

  // Orders
  refreshOrders() {
    this.orders = this.marketplaceService.listOrders();
    this.applyOrderFilters();
  }

  applyOrderFilters() {
    let list = [...this.orders];
    const q = this.orderSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        o =>
          o.orderId.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.items.some(i => i.sku.toLowerCase().includes(q))
      );
    }
    if (this.sourceFilter !== 'all') {
      list = list.filter(o => o.source === this.sourceFilter);
    }
    if (this.statusFilter !== 'all') {
      list = list.filter(o => o.status === this.statusFilter);
    }
    this.filteredOrders = list;
  }

  onOrderSearchChange() { this.applyOrderFilters(); }
  onSourceFilterChange() { this.applyOrderFilters(); }
  onStatusFilterChange() { this.applyOrderFilters(); }

  syncNow() {
    const settings = this.buildSettingsPayload();
    if (!settings.marketplaces.noon.enabled && !settings.marketplaces.amazon.enabled) {
      this.toast.show('Validation', 'Enable at least one marketplace to sync', 'warning');
      return;
    }
    this.syncing = true;
    const result = this.marketplaceService.syncOrders(settings);
    this.syncing = false;
    this.refreshOrders();
    this.toast.show('Sync Complete', result.added
      ? `Synced ${result.added} new order(s) locally — backend integration pending`
      : 'Refreshed existing orders — backend integration pending', 'success');
  }

  reconcileOrder(order: MarketplaceOrder) {
    const settings = this.buildSettingsPayload();
    if (!settings.unifiedLedgerId) {
      this.toast.show('Validation', 'Configure a unified target ledger in Settings first', 'warning');
      return;
    }
    const result = this.marketplaceService.reconcileOrder(order.id, settings);
    if (result) {
      this.toast.show('Success', `Order ${order.orderId} reconciled to ${settings.unifiedLedgerName}`, 'success');
      this.refreshOrders();
    }
  }

  reconcileSelected() {
    const selected = this.filteredOrders.filter(o => o.selected && o.status !== 'reconciled');
    if (!selected.length) {
      this.toast.show('Validation', 'Select pending/synced orders to reconcile', 'warning');
      return;
    }
    const settings = this.buildSettingsPayload();
    if (!settings.unifiedLedgerId) {
      this.toast.show('Validation', 'Configure a unified target ledger in Settings first', 'warning');
      return;
    }
    const count = this.marketplaceService.reconcileOrders(selected.map(o => o.id), settings);
    this.toast.show('Success', `Reconciled ${count} order(s)`, 'success');
    this.refreshOrders();
  }

  reconcileAllPending() {
    const pending = this.orders.filter(o => o.status === 'synced' || o.status === 'pending');
    if (!pending.length) {
      this.toast.show('Info', 'No pending orders to reconcile', 'info');
      return;
    }
    const settings = this.buildSettingsPayload();
    if (!settings.unifiedLedgerId) {
      this.toast.show('Validation', 'Configure a unified target ledger in Settings first', 'warning');
      return;
    }
    const count = this.marketplaceService.reconcileOrders(pending.map(o => o.id), settings);
    this.toast.show('Success', `Reconciled ${count} order(s)`, 'success');
    this.refreshOrders();
  }

  markFailed(order: MarketplaceOrder) {
    if (this.marketplaceService.markOrderFailed(order.id)) {
      this.toast.show('Updated', `Order ${order.orderId} marked as failed`, 'warning');
      this.refreshOrders();
    }
  }

  openOrderDetail(order: MarketplaceOrder) {
    this.selectedOrder = order;
    this.modalRef = this.modalService.open(this.orderDetailModal, { size: 'md' });
  }

  closeModal() { this.modalRef?.dismiss(); }

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    this.filteredOrders.forEach(o => {
      if (o.status !== 'reconciled') o.selected = this.selectAll;
    });
  }

  toggleOrderSelect(order: MarketplaceOrder) {
    order.selected = !order.selected;
  }

  sourceLabel(source: MarketplaceSource): string {
    return source === 'noon' ? 'Noon' : 'Amazon.ae';
  }

  statusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      pending: 'Pending', synced: 'Synced', reconciled: 'Reconciled', failed: 'Failed',
    };
    return map[status] || status;
  }

  get selectedOrderCount(): number {
    return this.filteredOrders.filter(o => o.selected && o.status !== 'reconciled').length;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.ledger-search-select')) {
      this.showUnifiedLedgerDropdown = false;
      this.showFeeLedgerDropdown = false;
    }
  }
}
