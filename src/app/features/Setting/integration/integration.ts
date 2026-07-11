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
    this.refreshOrders();
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
    this.integrationService.saveSettings(payload).subscribe(() => {
      this.currentSettings = payload;
      this.settingsSaving = false;
      this.toast.show('Success', 'Integration settings saved', 'success');
    });
  }

  isPartnerConfigured(id: IntegrationPartner): boolean {
    return this.integrationService.isPartnerConfigured(id, this.buildSettingsPayload());
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
    const missing = partner.fields.filter(
      f => f.required && !this.settingsForm.get(`${id}_${f.key}`)?.value?.trim()
    );
    if (missing.length) {
      this.toast.show(
        'Validation',
        `Please fill in ${missing.map(f => f.label).join(', ')}`,
        'warning'
      );
      return;
    }
    this.toast.show(
      'Connection Test',
      `${partner.name} Client ID / Secret saved locally. Orders API connect pending.`,
      'success'
    );
  }

  refreshOrders() {
    const response = this.integrationService.getCareemOrders();
    this.orders = response.data || [];
    this.ordersMeta = response.meta || null;
    this.applyOrderFilters();
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
    const response = this.integrationService.refreshCareemOrders();
    this.orders = response.data || [];
    this.ordersMeta = response.meta || null;
    this.applyOrderFilters();
    this.toast.show('Orders', `Loaded ${this.orders.length} Careem sample order(s)`, 'success');
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
