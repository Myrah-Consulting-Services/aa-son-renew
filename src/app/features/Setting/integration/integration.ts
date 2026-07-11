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
  WebhookEvent,
  WebhookEventStatus,
} from '../../../core/services/integration.service';

type SubTab = 'connections' | 'webhooks';

interface PartnerField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  secret?: boolean;
  hint?: string;
  readonly?: boolean;
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
  @ViewChild('eventDetailModal') eventDetailModal!: TemplateRef<any>;

  activeSubTab: SubTab = 'connections';
  settingsForm!: FormGroup;
  settingsSaving = false;
  currentSettings!: IntegrationSettings;
  visibleSecrets: Record<string, boolean> = {};
  expandedPartner: IntegrationPartner | null = 'careem';

  partners: PartnerConfig[] = [
    {
      id: 'careem',
      name: 'Careem',
      label: 'Delivery & Orders',
      description:
        'Connect Careem via webhook so order and payment events sync into your software. Configure credentials and the webhook endpoint Careem will call.',
      icon: 'bi bi-bicycle',
      color: 'linear-gradient(135deg, #00e784 0%, #0a0a0a 100%)',
      docsUrl: 'https://www.careem.com/',
      fields: [
        {
          key: 'merchant_id',
          label: 'Merchant ID',
          placeholder: 'Careem merchant / partner ID',
          required: true,
        },
        {
          key: 'api_key',
          label: 'API Key',
          placeholder: 'Enter API key',
          required: true,
          secret: true,
        },
        {
          key: 'api_secret',
          label: 'API Secret',
          placeholder: 'Enter API secret',
          required: true,
          secret: true,
        },
        {
          key: 'webhook_url',
          label: 'Webhook URL',
          placeholder: 'https://your-app/api/webhooks/careem',
          required: true,
          readonly: true,
          hint: 'Provide this URL to Careem so they can push events to your software',
        },
        {
          key: 'webhook_secret',
          label: 'Webhook Secret',
          placeholder: 'Shared secret for signature verification',
          required: true,
          secret: true,
          hint: 'Used to verify incoming Careem webhook signatures',
        },
      ],
    },
  ];

  events: WebhookEvent[] = [];
  filteredEvents: WebhookEvent[] = [];
  eventSearch = '';
  statusFilter: 'all' | WebhookEventStatus = 'all';
  selectedEvent: WebhookEvent | null = null;
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
    this.refreshEvents();
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
      this.integrationService.careemEvents.forEach(ev => {
        controls[`${p.id}_event_${ev.replace(/\./g, '_')}`] = [true];
      });
    });

    this.settingsForm = this.fb.group(controls);
  }

  switchSubTab(tab: SubTab) {
    this.activeSubTab = tab;
    if (tab === 'webhooks') this.refreshEvents();
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
        let value = (data as any)?.[field.key] || '';
        if (field.key === 'webhook_url' && !value) {
          value = this.integrationService.getDefaultWebhookUrl(p.id);
        }
        patch[`${p.id}_${field.key}`] = value;
      });
      this.integrationService.careemEvents.forEach(ev => {
        const key = `${p.id}_event_${ev.replace(/\./g, '_')}`;
        patch[key] = data?.events?.includes(ev) ?? true;
      });
    });

    this.settingsForm.patchValue(patch);
  }

  private buildSettingsPayload(): IntegrationSettings {
    const v = this.settingsForm.value;
    return {
      enabled: v.enabled,
      partners: {
        careem: this.buildPartnerData('careem'),
      },
    };
  }

  private buildPartnerData(id: IntegrationPartner) {
    const partner = this.partners.find(p => p.id === id)!;
    const data: any = {
      enabled: this.settingsForm.get(`${id}_enabled`)?.value ?? false,
      events: [] as string[],
    };
    partner.fields.forEach(field => {
      data[field.key] = this.settingsForm.get(`${id}_${field.key}`)?.value || '';
    });
    this.integrationService.careemEvents.forEach(ev => {
      const key = `${id}_event_${ev.replace(/\./g, '_')}`;
      if (this.settingsForm.get(key)?.value) {
        data.events.push(ev);
      }
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

  togglePartnerExpand(id: IntegrationPartner) {
    this.expandedPartner = this.expandedPartner === id ? null : id;
  }

  onPartnerToggle(id: IntegrationPartner) {
    if (this.settingsForm.get(`${id}_enabled`)?.value) {
      this.expandedPartner = id;
      const urlCtrl = this.settingsForm.get(`${id}_webhook_url`);
      if (urlCtrl && !urlCtrl.value) {
        urlCtrl.setValue(this.integrationService.getDefaultWebhookUrl(id));
      }
    }
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

  copyWebhookUrl(id: IntegrationPartner) {
    const url = this.settingsForm.get(`${id}_webhook_url`)?.value || '';
    if (!url) {
      this.toast.show('Info', 'No webhook URL to copy', 'info');
      return;
    }
    navigator.clipboard?.writeText(url).then(
      () => this.toast.show('Copied', 'Webhook URL copied to clipboard', 'success'),
      () => this.toast.show('Error', 'Could not copy URL', 'danger')
    );
  }

  testConnection(id: IntegrationPartner) {
    const partner = this.partners.find(p => p.id === id);
    if (!partner) return;
    const missing = partner.fields.filter(
      f => f.required && !f.readonly && !this.settingsForm.get(`${id}_${f.key}`)?.value?.trim()
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
      `${partner.name} credentials saved locally. Webhook connect API pending.`,
      'success'
    );
  }

  get careemEventList(): string[] {
    return this.integrationService.careemEvents;
  }

  eventControlName(partnerId: string, event: string): string {
    return `${partnerId}_event_${event.replace(/\./g, '_')}`;
  }

  // Webhook events
  refreshEvents() {
    this.events = this.integrationService.listWebhookEvents();
    this.applyEventFilters();
  }

  applyEventFilters() {
    let list = [...this.events];
    const q = this.eventSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        e =>
          e.eventType.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q) ||
          String((e.payload as any)?.id || '').toLowerCase().includes(q) ||
          String((e.payload as any)?.customer?.name || '').toLowerCase().includes(q)
      );
    }
    if (this.statusFilter !== 'all') {
      list = list.filter(e => e.status === this.statusFilter);
    }
    this.filteredEvents = list;
  }

  onEventSearchChange() {
    this.applyEventFilters();
  }

  onStatusFilterChange() {
    this.applyEventFilters();
  }

  simulateWebhook() {
    const settings = this.buildSettingsPayload();
    if (!settings.partners.careem.enabled) {
      this.toast.show('Validation', 'Enable Careem integration first', 'warning');
      return;
    }
    this.integrationService.simulateWebhook('careem');
    this.refreshEvents();
    this.toast.show('Webhook', 'Simulated Careem webhook received (dummy)', 'success');
  }

  openEventDetail(event: WebhookEvent) {
    this.selectedEvent = event;
    this.modalRef = this.modalService.open(this.eventDetailModal, { size: 'md' });
  }

  closeModal() {
    this.modalRef?.dismiss();
  }

  markProcessed(event: WebhookEvent) {
    if (this.integrationService.markEventProcessed(event.id)) {
      this.toast.show('Updated', 'Event marked as processed', 'success');
      this.refreshEvents();
    }
  }

  markFailed(event: WebhookEvent) {
    if (this.integrationService.markEventFailed(event.id)) {
      this.toast.show('Updated', 'Event marked as failed', 'warning');
      this.refreshEvents();
    }
  }

  statusLabel(status: WebhookEventStatus): string {
    const map: Record<WebhookEventStatus, string> = {
      received: 'Received',
      processed: 'Processed',
      failed: 'Failed',
      pending: 'Pending',
    };
    return map[status] || status;
  }

  partnerLabel(partner: IntegrationPartner): string {
    return partner === 'careem' ? 'Careem' : partner;
  }

  payloadPreview(event: WebhookEvent): string {
    return JSON.stringify(event.payload, null, 2);
  }

  eventOrderId(event: WebhookEvent): string {
    return String(event.payload?.['id'] ?? '—');
  }

  eventCustomer(event: WebhookEvent): string {
    const customer = event.payload?.['customer'] as { name?: string } | undefined;
    return customer?.name || '—';
  }

  eventAmount(event: WebhookEvent): number {
    return Number(event.payload?.['amount'] ?? 0);
  }
}
