import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';
import {
  IntegrationService,
  IntegrationSettings,
  IntegrationPartner,
  CareemOrder,
  CareemOrdersMeta,
} from '../../../core/services/integration.service';

type SubTab = 'connections' | 'orders';

interface PartnerField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  secret?: boolean;
  hint?: string;
}

interface PartnerConfig {
  id: IntegrationPartner;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  docsUrl: string;
  fields: PartnerField[];
}

@Component({
  selector: 'app-integration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './integration.html',
  styleUrl: './integration.scss',
})
export class Integration implements OnInit {
  @ViewChild('orderDetailModal') orderDetailModal!: TemplateRef<any>;

  activeSubTab: SubTab = 'connections';
  settingsForm!: FormGroup;
  settingsSaving = false;
  currentSettings!: IntegrationSettings;
  visibleSecrets: Record<string, boolean> = {};

  partners: PartnerConfig[] = [
    {
      id: 'careem',
      name: 'Careem',
      label: 'Orders API',
      description:
        'Connect Careem with Client ID and Client Secret to pull orders into your software.',
      icon: 'bi bi-bicycle',
      color: 'linear-gradient(135deg, #00e784 0%, #0a0a0a 100%)',
      docsUrl: 'https://www.careem.com/',
      fields: [
        {
          key: 'client_id',
          label: 'Client ID',
          placeholder: 'Enter Careem Client ID',
          required: true,
        },
        {
          key: 'client_secret',
          label: 'Client Secret',
          placeholder: 'Enter Careem Client Secret',
          required: true,
          secret: true,
        },
      ],
    },
  ];

  orders: CareemOrder[] = [];
  filteredOrders: CareemOrder[] = [];
  ordersMeta: CareemOrdersMeta | null = null;
  ordersLoading = false;
  orderSearch = '';
  statusFilter = 'all';
  selectedOrder: CareemOrder | null = null;
  private modalRef?: NgbModalRef;

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private modalService: NgbModal,
    private integrationService: IntegrationService
  ) {
    this.initForms();
  }

  ngOnInit() {
    this.loadSettings();
  }

  private initForms() {
    const controls: Record<string, any> = {
      enabled: [false],
    };

    this.partners.forEach(p => {
      controls[`${p.id}_enabled`] = [false];
      p.fields.forEach(field => {
        controls[`${p.id}_${field.key}`] = [''];
      });
    });

    this.settingsForm = this.fb.group(controls);
  }

  switchSubTab(tab: SubTab) {
    this.activeSubTab = tab;
    if (tab === 'orders') this.refreshOrders();
  }

  loadSettings() {
    this.integrationService.getSettings().subscribe(settings => {
      this.currentSettings = settings;
      this.patchSettingsForm(settings);
    });
  }

  private patchSettingsForm(s: IntegrationSettings) {
    const patch: Record<string, any> = { enabled: s.enabled };

    this.partners.forEach(p => {
      const data = s.partners[p.id];
      patch[`${p.id}_enabled`] = data?.enabled ?? false;
      p.fields.forEach(field => {
        patch[`${p.id}_${field.key}`] = (data as any)?.[field.key] || '';
      });
    });

    this.settingsForm.patchValue(patch);
  }

  private buildSettingsPayload(): IntegrationSettings {
    return {
      enabled: this.settingsForm.value.enabled,
      partners: {
        careem: this.buildPartnerData('careem'),
      },
    };
  }

  private buildPartnerData(id: IntegrationPartner) {
    const partner = this.partners.find(p => p.id === id)!;
    const data: any = {
      enabled: this.settingsForm.get(`${id}_enabled`)?.value ?? false,
    };
    partner.fields.forEach(field => {
      data[field.key] = this.settingsForm.get(`${id}_${field.key}`)?.value || '';
    });
    return data;
  }

  saveSettings() {
    this.settingsSaving = true;
    const payload = this.buildSettingsPayload();
    // Preserve has_secret from last load so Ready badge stays correct after save without retyping secret
    if (this.currentSettings?.partners?.careem?.has_secret) {
      payload.partners.careem.has_secret = true;
    }
    this.integrationService.saveSettings(payload).subscribe({
      next: (res: any) => {
        this.settingsSaving = false;
        if (res?.status === 200) {
          this.currentSettings = payload;
          if (res.data?.has_secret) {
            this.currentSettings.partners.careem.has_secret = true;
          }
          this.toast.show('Success', 'Integration settings saved', 'success');
          this.loadSettings();
        } else {
          this.toast.show('Error', res?.error || 'Failed to save settings', 'danger');
        }
      },
      error: () => {
        this.settingsSaving = false;
        this.toast.show('Error', 'Failed to save settings', 'danger');
      },
    });
  }

  isPartnerConfigured(id: IntegrationPartner): boolean {
    const payload = this.buildSettingsPayload();
    if (this.currentSettings?.partners?.[id]?.has_secret) {
      payload.partners[id].has_secret = true;
    }
    return this.integrationService.isPartnerConfigured(id, payload);
  }

  secretKey(partnerId: string, fieldKey: string): string {
    return `${partnerId}_${fieldKey}`;
  }

  isSecretVisible(partnerId: string, fieldKey: string): boolean {
    return !!this.visibleSecrets[this.secretKey(partnerId, fieldKey)];
  }

  toggleSecretVisibility(partnerId: string, fieldKey: string) {
    const key = this.secretKey(partnerId, fieldKey);
    this.visibleSecrets[key] = !this.visibleSecrets[key];
  }

  testConnection(id: IntegrationPartner) {
    const partner = this.partners.find(p => p.id === id);
    if (!partner) return;

    const clientId = (this.settingsForm.get(`${id}_client_id`)?.value || '').trim();
    const clientSecret = (this.settingsForm.get(`${id}_client_secret`)?.value || '').trim();
    const hasSavedSecret = !!this.currentSettings?.partners?.[id]?.has_secret;

    if (!clientId) {
      this.toast.show('Validation', 'Please fill in Client ID', 'warning');
      return;
    }
    if (!clientSecret && !hasSavedSecret) {
      this.toast.show('Validation', 'Please fill in Client Secret', 'warning');
      return;
    }

    this.integrationService.testConnection(clientId, clientSecret).subscribe({
      next: (res: any) => {
        if (res?.status === 200) {
          this.toast.show(
            'Success',
            res.message || `${partner.name} token obtained successfully`,
            'success'
          );
        } else {
          this.toast.show('Error', res?.error || 'Token request failed', 'danger');
        }
      },
      error: () => {
        this.toast.show('Error', 'Token request failed', 'danger');
      },
    });
  }

  refreshOrders() {
    this.ordersLoading = true;
    this.integrationService.getCareemOrders().subscribe({
      next: (res: any) => {
        this.ordersLoading = false;
        if (res?.status === 200) {
          this.orders = res.data || [];
          this.ordersMeta = res.meta || null;
          this.applyOrderFilters();
        } else {
          this.orders = [];
          this.ordersMeta = null;
          this.applyOrderFilters();
          this.toast.show('Error', res?.error || 'Failed to load Careem orders', 'danger');
        }
      },
      error: () => {
        this.ordersLoading = false;
        this.orders = [];
        this.ordersMeta = null;
        this.applyOrderFilters();
        this.toast.show('Error', 'Failed to load Careem orders', 'danger');
      },
    });
  }

  reloadSampleOrders() {
    const settings = this.buildSettingsPayload();
    if (!settings.partners.careem.enabled) {
      this.toast.show('Validation', 'Enable Careem integration first', 'warning');
      return;
    }
    if (!this.isPartnerConfigured('careem')) {
      this.toast.show('Validation', 'Enter Client ID and Client Secret first', 'warning');
      return;
    }
    this.ordersLoading = true;
    this.integrationService.refreshCareemOrders().subscribe({
      next: (res: any) => {
        this.ordersLoading = false;
        if (res?.status === 200) {
          this.orders = res.data || [];
          this.ordersMeta = res.meta || null;
          this.applyOrderFilters();
          this.toast.show(
            'Orders',
            `Loaded ${this.orders.length} Careem order(s)`,
            'success'
          );
        } else {
          this.orders = [];
          this.ordersMeta = null;
          this.applyOrderFilters();
          this.toast.show('Error', res?.error || 'Failed to refresh Careem orders', 'danger');
        }
      },
      error: () => {
        this.ordersLoading = false;
        this.orders = [];
        this.ordersMeta = null;
        this.applyOrderFilters();
        this.toast.show('Error', 'Failed to refresh Careem orders', 'danger');
      },
    });
  }

  applyOrderFilters() {
    let list = [...this.orders];
    const q = this.orderSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        o =>
          String(o.id).includes(q) ||
          (o.customer?.name || '').toLowerCase().includes(q) ||
          (o.branch?.name || '').toLowerCase().includes(q) ||
          (o.status || '').toLowerCase().includes(q) ||
          (o.notes || '').toLowerCase().includes(q)
      );
    }
    if (this.statusFilter !== 'all') {
      list = list.filter(o => o.status === this.statusFilter);
    }
    this.filteredOrders = list;
  }

  onOrderSearchChange() {
    this.applyOrderFilters();
  }

  onStatusFilterChange() {
    this.applyOrderFilters();
  }

  get uniqueStatuses(): string[] {
    return [...new Set(this.orders.map(o => o.status).filter(Boolean))];
  }

  openOrderDetail(order: CareemOrder) {
    this.selectedOrder = order;
    this.modalRef = this.modalService.open(this.orderDetailModal, {
      size: 'md',
      centered: true,
      windowClass: 'integration-order-modal',
    });
  }

  closeModal() {
    this.modalRef?.dismiss();
  }

  orderTotal(order: CareemOrder): number {
    return order.price?.original_total_price ?? 0;
  }

  orderItemCount(order: CareemOrder): number {
    return (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  customerAddress(order: CareemOrder): string {
    const a = order.customer?.address;
    if (!a) return '—';
    return [a.number, a.building, a.street, a.area, a.city].filter(Boolean).join(', ');
  }
}
