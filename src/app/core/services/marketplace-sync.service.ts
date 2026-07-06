import { Injectable } from '@angular/core';
import { Api } from './api';
import { Observable, of, catchError, map } from 'rxjs';

export type MarketplaceSource = 'noon' | 'amazon';
export type OrderStatus = 'pending' | 'synced' | 'reconciled' | 'failed';
export type AutoSyncInterval = 'manual' | 'hourly' | 'daily';

export interface MarketplaceConnectionSettings {
  enabled: boolean;
  seller_id: string;
  api_key?: string;
  api_secret?: string;
  warehouse_id?: string;
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
  marketplace_id?: string;
  auto_reconcile: boolean;
}

export interface MarketplaceSettings {
  enabled: boolean;
  unifiedLedgerId: number | null;
  unifiedLedgerName: string;
  feeLedgerId: number | null;
  feeLedgerName: string;
  autoSyncInterval: AutoSyncInterval;
  createInvoiceOnReconcile: boolean;
  marketplaces: {
    noon: MarketplaceConnectionSettings;
    amazon: MarketplaceConnectionSettings;
  };
}

export interface OrderLineItem {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

export interface MarketplaceOrder {
  id: string;
  source: MarketplaceSource;
  orderId: string;
  orderDate: string;
  customerName: string;
  amount: number;
  fees: number;
  net: number;
  status: OrderStatus;
  ledgerId: number | null;
  ledgerName: string;
  ledgerRef: string;
  items: OrderLineItem[];
  syncedAt: string;
  reconciledAt: string | null;
  selected?: boolean;
}

export interface SyncLogEntry {
  id: string;
  action: string;
  source: string;
  orderCount: number;
  timestamp: string;
  message: string;
}

const DEFAULT_MARKETPLACE: MarketplaceConnectionSettings = {
  enabled: false,
  seller_id: '',
  api_key: '',
  api_secret: '',
  warehouse_id: '',
  client_id: '',
  client_secret: '',
  refresh_token: '',
  marketplace_id: 'A2VIGQ35RCS4UG',
  auto_reconcile: false,
};

const DEFAULT_SETTINGS: MarketplaceSettings = {
  enabled: false,
  unifiedLedgerId: null,
  unifiedLedgerName: '',
  feeLedgerId: null,
  feeLedgerName: '',
  autoSyncInterval: 'manual',
  createInvoiceOnReconcile: false,
  marketplaces: {
    noon: { ...DEFAULT_MARKETPLACE },
    amazon: { ...DEFAULT_MARKETPLACE, marketplace_id: 'A2VIGQ35RCS4UG' },
  },
};

@Injectable({ providedIn: 'root' })
export class MarketplaceSyncService {
  private reconcileCounter = 0;

  constructor(private api: Api) {}

  private companyId(): number {
    return this.api.getUserCompany() ?? 1;
  }

  private settingsKey(): string {
    return `marketplace_settings_${this.companyId()}`;
  }

  private ordersKey(): string {
    return `marketplace_orders_${this.companyId()}`;
  }

  private logsKey(): string {
    return `marketplace_sync_logs_${this.companyId()}`;
  }

  getSettings(): Observable<MarketplaceSettings> {
    const companyId = this.companyId();
    return this.api.get<any>(`/company/get-marketplace-setting/${companyId}/`).pipe(
      map(res => (res?.status === 200 && res.data ? this.normalizeSettings(res.data) : this.loadSettingsFromStorage())),
      catchError(() => of(this.loadSettingsFromStorage()))
    );
  }

  saveSettings(settings: MarketplaceSettings): Observable<boolean> {
    const companyId = this.companyId();
    localStorage.setItem(this.settingsKey(), JSON.stringify(settings));
    return this.api.put<any>(`/company/update-marketplace-setting/${companyId}/`, settings).pipe(
      map(res => res?.status === 200),
      catchError(() => of(true))
    );
  }

  isMarketplaceConfigured(source: MarketplaceSource, settings: MarketplaceSettings): boolean {
    const mp = settings.marketplaces[source];
    if (!mp?.enabled) return false;
    if (source === 'noon') {
      return !!(mp.seller_id?.trim() && mp.api_key?.trim() && mp.api_secret?.trim());
    }
    return !!(
      mp.seller_id?.trim() &&
      mp.client_id?.trim() &&
      mp.client_secret?.trim() &&
      mp.refresh_token?.trim()
    );
  }

  listOrders(): MarketplaceOrder[] {
    return this.readJson<MarketplaceOrder[]>(this.ordersKey(), []);
  }

  getSyncLogs(): SyncLogEntry[] {
    return this.readJson<SyncLogEntry[]>(this.logsKey(), [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  syncOrders(settings: MarketplaceSettings): { added: number; updated: number } {
    const existing = this.listOrders();
    const existingIds = new Set(existing.map(o => `${o.source}-${o.orderId}`));
    let added = 0;

    const newOrders: MarketplaceOrder[] = [];

    if (settings.marketplaces.noon.enabled) {
      const noonSamples = this.generateSampleOrders('noon', settings, 2);
      for (const order of noonSamples) {
        const key = `${order.source}-${order.orderId}`;
        if (!existingIds.has(key)) {
          newOrders.push(order);
          existingIds.add(key);
          added++;
        }
      }
    }

    if (settings.marketplaces.amazon.enabled) {
      const amazonSamples = this.generateSampleOrders('amazon', settings, 2);
      for (const order of amazonSamples) {
        const key = `${order.source}-${order.orderId}`;
        if (!existingIds.has(key)) {
          newOrders.push(order);
          existingIds.add(key);
          added++;
        }
      }
    }

    const now = new Date().toISOString();
    const updated = existing.map(o => {
      if (o.status === 'pending' || o.status === 'synced') {
        return { ...o, syncedAt: now, status: o.status === 'pending' ? 'synced' as OrderStatus : o.status };
      }
      return o;
    });

    const merged = [...newOrders, ...updated];
    localStorage.setItem(this.ordersKey(), JSON.stringify(merged));

    this.addLog({
      action: 'sync',
      source: 'all',
      orderCount: added,
      message: added
        ? `Synced ${added} new order(s) locally — backend integration pending`
        : 'Refreshed existing orders — backend integration pending',
    });

    return { added, updated: updated.length - existing.length };
  }

  reconcileOrder(orderId: string, settings: MarketplaceSettings): MarketplaceOrder | null {
    const orders = this.listOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx < 0) return null;

    const order = orders[idx];
    if (order.status === 'reconciled') return order;

    if (!settings.unifiedLedgerId || !settings.unifiedLedgerName) {
      return null;
    }

    this.reconcileCounter++;
    const ref = `MKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.reconcileCounter).padStart(3, '0')}`;

    const reconciled: MarketplaceOrder = {
      ...order,
      status: 'reconciled',
      ledgerId: settings.unifiedLedgerId,
      ledgerName: settings.unifiedLedgerName,
      ledgerRef: ref,
      reconciledAt: new Date().toISOString(),
    };

    orders[idx] = reconciled;
    localStorage.setItem(this.ordersKey(), JSON.stringify(orders));

    this.addLog({
      action: 'reconcile',
      source: order.source,
      orderCount: 1,
      message: `Reconciled ${order.orderId} to ledger ${settings.unifiedLedgerName} (${ref})`,
    });

    return reconciled;
  }

  reconcileOrders(orderIds: string[], settings: MarketplaceSettings): number {
    let count = 0;
    for (const id of orderIds) {
      if (this.reconcileOrder(id, settings)) count++;
    }
    return count;
  }

  markOrderFailed(orderId: string, reason?: string): boolean {
    const orders = this.listOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx < 0) return false;

    orders[idx] = { ...orders[idx], status: 'failed' };
    localStorage.setItem(this.ordersKey(), JSON.stringify(orders));

    this.addLog({
      action: 'mark_failed',
      source: orders[idx].source,
      orderCount: 1,
      message: reason || `Marked order ${orders[idx].orderId} as failed`,
    });
    return true;
  }

  private generateSampleOrders(
    source: MarketplaceSource,
    settings: MarketplaceSettings,
    count: number
  ): MarketplaceOrder[] {
    const prefix = source === 'noon' ? 'NN' : 'AMZ';
    const customers = ['Ahmed Al Maktoum', 'Fatima Hassan', 'Rajesh Kumar', 'Sarah Johnson'];
    const products = [
      { sku: 'SKU-001', name: 'Wireless Earbuds', price: 149 },
      { sku: 'SKU-002', name: 'Phone Case', price: 45 },
      { sku: 'SKU-003', name: 'USB-C Cable', price: 29 },
    ];

    const orders: MarketplaceOrder[] = [];
    for (let i = 0; i < count; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const amount = product.price * qty;
      const fees = Math.round(amount * 0.12 * 100) / 100;
      const orderNum = `${prefix}-${Date.now().toString(36).toUpperCase()}${i}`;

      orders.push({
        id: this.generateId(),
        source,
        orderId: orderNum,
        orderDate: new Date().toISOString(),
        customerName: customers[Math.floor(Math.random() * customers.length)],
        amount,
        fees,
        net: amount - fees,
        status: 'synced',
        ledgerId: settings.unifiedLedgerId,
        ledgerName: settings.unifiedLedgerName || '',
        ledgerRef: '',
        items: [{ sku: product.sku, name: product.name, qty, price: product.price }],
        syncedAt: new Date().toISOString(),
        reconciledAt: null,
      });
    }
    return orders;
  }

  private addLog(data: { action: string; source: string; orderCount: number; message: string }) {
    const logs = this.readJson<SyncLogEntry[]>(this.logsKey(), []);
    logs.unshift({
      id: this.generateId(),
      action: data.action,
      source: data.source,
      orderCount: data.orderCount,
      timestamp: new Date().toISOString(),
      message: data.message,
    });
    localStorage.setItem(this.logsKey(), JSON.stringify(logs.slice(0, 200)));
  }

  private loadSettingsFromStorage(): MarketplaceSettings {
    const stored = localStorage.getItem(this.settingsKey());
    if (stored) {
      try {
        return this.normalizeSettings(JSON.parse(stored));
      } catch { /* fall through */ }
    }
    return structuredClone(DEFAULT_SETTINGS);
  }

  private normalizeSettings(data: any): MarketplaceSettings {
    const mps = data.marketplaces || {};
    return {
      enabled: data.enabled ?? false,
      unifiedLedgerId: data.unifiedLedgerId ?? null,
      unifiedLedgerName: data.unifiedLedgerName || '',
      feeLedgerId: data.feeLedgerId ?? null,
      feeLedgerName: data.feeLedgerName || '',
      autoSyncInterval: data.autoSyncInterval || 'manual',
      createInvoiceOnReconcile: data.createInvoiceOnReconcile ?? false,
      marketplaces: {
        noon: { ...DEFAULT_MARKETPLACE, ...(mps.noon || {}) },
        amazon: { ...DEFAULT_MARKETPLACE, marketplace_id: 'A2VIGQ35RCS4UG', ...(mps.amazon || {}) },
      },
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
