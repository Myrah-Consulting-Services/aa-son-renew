import { Injectable } from '@angular/core';
import { Api } from './api';
import { Observable, of } from 'rxjs';

export type IntegrationPartner = 'careem';
export type WebhookEventStatus = 'received' | 'processed' | 'failed' | 'pending';

export interface IntegrationConnectionSettings {
  enabled: boolean;
  merchant_id: string;
  api_key: string;
  api_secret: string;
  webhook_url: string;
  webhook_secret: string;
  events: string[];
}

export interface IntegrationSettings {
  enabled: boolean;
  partners: {
    careem: IntegrationConnectionSettings;
  };
}

export interface WebhookEvent {
  id: string;
  partner: IntegrationPartner;
  eventType: string;
  payload: Record<string, unknown>;
  status: WebhookEventStatus;
  receivedAt: string;
  processedAt: string | null;
  message: string;
}

const CAREEM_EVENTS = [
  'order.created',
  'order.updated',
  'order.cancelled',
  'order.delivered',
  'payment.completed',
];

const DEFAULT_CAREEM: IntegrationConnectionSettings = {
  enabled: false,
  merchant_id: '',
  api_key: '',
  api_secret: '',
  webhook_url: '',
  webhook_secret: '',
  events: [...CAREEM_EVENTS],
};

const DEFAULT_SETTINGS: IntegrationSettings = {
  enabled: false,
  partners: {
    careem: { ...DEFAULT_CAREEM },
  },
};

@Injectable({ providedIn: 'root' })
export class IntegrationService {
  readonly careemEvents = CAREEM_EVENTS;

  constructor(private api: Api) {}

  private companyId(): number {
    return this.api.getUserCompany() ?? 1;
  }

  private settingsKey(): string {
    return `integration_settings_${this.companyId()}`;
  }

  private eventsKey(): string {
    return `integration_webhook_events_${this.companyId()}`;
  }

  getSettings(): Observable<IntegrationSettings> {
    return of(this.loadSettingsFromStorage());
  }

  saveSettings(settings: IntegrationSettings): Observable<boolean> {
    localStorage.setItem(this.settingsKey(), JSON.stringify(settings));
    return of(true);
  }

  isPartnerConfigured(partner: IntegrationPartner, settings: IntegrationSettings): boolean {
    const p = settings.partners[partner];
    if (!p?.enabled) return false;
    return !!(
      p.merchant_id?.trim() &&
      p.api_key?.trim() &&
      p.api_secret?.trim() &&
      p.webhook_secret?.trim()
    );
  }

  getDefaultWebhookUrl(partner: IntegrationPartner): string {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.example.com';
    return `${base}/api/webhooks/${partner}`;
  }

  listWebhookEvents(): WebhookEvent[] {
    const events = this.readJson<WebhookEvent[]>(this.eventsKey(), []);
    if (events.length) {
      return events.sort(
        (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );
    }
    const seed = this.seedCareemEvents();
    localStorage.setItem(this.eventsKey(), JSON.stringify(seed));
    return seed;
  }

  /** Simulate receiving a Careem webhook (dummy). */
  simulateWebhook(partner: IntegrationPartner = 'careem'): WebhookEvent {
    const event = this.buildDummyEvent(partner);
    const events = this.listWebhookEvents();
    events.unshift(event);
    localStorage.setItem(this.eventsKey(), JSON.stringify(events.slice(0, 100)));
    return event;
  }

  markEventProcessed(eventId: string): WebhookEvent | null {
    const events = this.listWebhookEvents();
    const idx = events.findIndex(e => e.id === eventId);
    if (idx < 0) return null;
    events[idx] = {
      ...events[idx],
      status: 'processed',
      processedAt: new Date().toISOString(),
      message: 'Marked as processed (local dummy)',
    };
    localStorage.setItem(this.eventsKey(), JSON.stringify(events));
    return events[idx];
  }

  markEventFailed(eventId: string): WebhookEvent | null {
    const events = this.listWebhookEvents();
    const idx = events.findIndex(e => e.id === eventId);
    if (idx < 0) return null;
    events[idx] = {
      ...events[idx],
      status: 'failed',
      message: 'Marked as failed (local dummy)',
    };
    localStorage.setItem(this.eventsKey(), JSON.stringify(events));
    return events[idx];
  }

  private seedCareemEvents(): WebhookEvent[] {
    const now = Date.now();
    return [
      this.buildDummyEvent('careem', {
        eventType: 'order.created',
        status: 'processed',
        receivedAt: new Date(now - 3600_000).toISOString(),
        processedAt: new Date(now - 3590_000).toISOString(),
        orderId: 'CRM-100245',
        amount: 87.5,
        customer: 'Omar Al Farsi',
        message: 'Order synced to sales invoice',
      }),
      this.buildDummyEvent('careem', {
        eventType: 'order.updated',
        status: 'received',
        receivedAt: new Date(now - 1800_000).toISOString(),
        processedAt: null,
        orderId: 'CRM-100246',
        amount: 42.0,
        customer: 'Layla Hassan',
        message: 'Awaiting processing',
      }),
      this.buildDummyEvent('careem', {
        eventType: 'order.delivered',
        status: 'processed',
        receivedAt: new Date(now - 7200_000).toISOString(),
        processedAt: new Date(now - 7150_000).toISOString(),
        orderId: 'CRM-100240',
        amount: 125.75,
        customer: 'Priya Sharma',
        message: 'Delivery confirmed',
      }),
      this.buildDummyEvent('careem', {
        eventType: 'payment.completed',
        status: 'failed',
        receivedAt: new Date(now - 900_000).toISOString(),
        processedAt: null,
        orderId: 'CRM-100248',
        amount: 55.0,
        customer: 'James Wilson',
        message: 'Signature verification failed (dummy)',
      }),
      this.buildDummyEvent('careem', {
        eventType: 'order.cancelled',
        status: 'pending',
        receivedAt: new Date(now - 300_000).toISOString(),
        processedAt: null,
        orderId: 'CRM-100249',
        amount: 33.25,
        customer: 'Noor Abdullah',
        message: 'Queued for cancel sync',
      }),
    ];
  }

  private buildDummyEvent(
    partner: IntegrationPartner,
    overrides?: Partial<{
      eventType: string;
      status: WebhookEventStatus;
      receivedAt: string;
      processedAt: string | null;
      orderId: string;
      amount: number;
      customer: string;
      message: string;
    }>
  ): WebhookEvent {
    const orderId =
      overrides?.orderId || `CRM-${Math.floor(100000 + Math.random() * 900000)}`;
    const amount =
      overrides?.amount ?? Math.round((20 + Math.random() * 150) * 100) / 100;
    const customers = ['Omar Al Farsi', 'Layla Hassan', 'Priya Sharma', 'James Wilson', 'Noor Abdullah'];
    const customer =
      overrides?.customer || customers[Math.floor(Math.random() * customers.length)];
    const eventType =
      overrides?.eventType ||
      CAREEM_EVENTS[Math.floor(Math.random() * CAREEM_EVENTS.length)];
    const status = overrides?.status || 'received';
    const receivedAt = overrides?.receivedAt || new Date().toISOString();

    return {
      id: this.generateId(),
      partner,
      eventType,
      status,
      receivedAt,
      processedAt: overrides?.processedAt ?? null,
      message: overrides?.message || `Dummy ${eventType} from Careem`,
      payload: {
        id: orderId,
        partner: 'careem',
        event: eventType,
        merchant_id: 'CAREEM-DEMO-001',
        customer: { name: customer, phone: '+9715XXXXXX' },
        amount,
        currency: 'AED',
        items: [
          { sku: 'SKU-CRM-01', name: 'Demo Product', qty: 1, price: amount },
        ],
        created_at: receivedAt,
      },
    };
  }

  private loadSettingsFromStorage(): IntegrationSettings {
    const stored = localStorage.getItem(this.settingsKey());
    if (stored) {
      try {
        return this.normalizeSettings(JSON.parse(stored));
      } catch {
        /* fall through */
      }
    }
    const defaults = structuredClone(DEFAULT_SETTINGS);
    defaults.partners.careem.webhook_url = this.getDefaultWebhookUrl('careem');
    return defaults;
  }

  private normalizeSettings(data: any): IntegrationSettings {
    const partners = data.partners || {};
    const careem = { ...DEFAULT_CAREEM, ...(partners.careem || {}) };
    if (!careem.webhook_url) {
      careem.webhook_url = this.getDefaultWebhookUrl('careem');
    }
    if (!Array.isArray(careem.events) || !careem.events.length) {
      careem.events = [...CAREEM_EVENTS];
    }
    return {
      enabled: data.enabled ?? false,
      partners: { careem },
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private readJson<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
}
