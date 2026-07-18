import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export type TestPartnerId = 'careem' | 'talabat' | 'keeta';

export interface TestPartnerCredentials {
  enabled: boolean;
  client_id: string;
  client_secret: string;
  connected: boolean;
  lastTestedAt: string | null;
}

export interface TestIntegrationSettings {
  partners: Record<TestPartnerId, TestPartnerCredentials>;
}

export interface TestOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface TestDeliveryOrder {
  id: string;
  partner: TestPartnerId;
  externalId: string;
  invoiceNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  branch: string;
  address: string;
  items: TestOrderItem[];
  subtotal: number;
  vatAmount: number;
  deliveryFee: number;
  total: number;
  paymentType: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded' | 'awaiting_mobile';
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
}

const STORAGE_KEY = 'esarwa_test_integration_settings';
const ORDERS_KEY = 'esarwa_test_integration_orders';
const ORDERS_VERSION_KEY = 'esarwa_test_integration_orders_v';
const ORDERS_VERSION = '4';

export const DEFAULT_TEST_CREDENTIALS: Record<
  TestPartnerId,
  { client_id: string; client_secret: string }
> = {
  careem: { client_id: 'crm_demo_client_78421', client_secret: 'crm_demo_secret_x9k2' },
  talabat: { client_id: 'tlb_demo_merchant_44102', client_secret: 'tlb_demo_key_m7p4' },
  keeta: { client_id: 'kt_demo_outlet_90318', client_secret: 'kt_demo_secret_q3w8' },
};

const DEFAULT_CREDS = (partner?: TestPartnerId): TestPartnerCredentials => ({
  enabled: true,
  client_id: partner ? DEFAULT_TEST_CREDENTIALS[partner].client_id : '',
  client_secret: partner ? DEFAULT_TEST_CREDENTIALS[partner].client_secret : '',
  connected: true,
  lastTestedAt: new Date().toISOString(),
});

@Injectable({ providedIn: 'root' })
export class TestIntegrationService {
  getSettings(): TestIntegrationSettings {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return this.normalize(JSON.parse(raw));
      } catch {
        /* fall through */
      }
    }
    return {
      partners: {
        careem: DEFAULT_CREDS('careem'),
        talabat: DEFAULT_CREDS('talabat'),
        keeta: DEFAULT_CREDS('keeta'),
      },
    };
  }

  saveSettings(settings: TestIntegrationSettings): Observable<{ status: number }> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return of({ status: 200 }).pipe(delay(250));
  }

  testConnection(
    partner: TestPartnerId,
    clientId: string,
    clientSecret: string
  ): Observable<{ status: number; message?: string; error?: string }> {
    if (!clientId.trim() || !clientSecret.trim()) {
      return of({ status: 400, error: 'Client ID and Client Secret are required' }).pipe(delay(300));
    }

    const settings = this.getSettings();
    settings.partners[partner] = {
      ...settings.partners[partner],
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      connected: true,
      lastTestedAt: new Date().toISOString(),
      enabled: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    const label = this.partnerLabel(partner);
    return of({
      status: 200,
      message: `${label} test connection OK (local dummy) · token simulated`,
    }).pipe(delay(600));
  }

  listOrders(partnerFilter: 'all' | TestPartnerId = 'all'): TestDeliveryOrder[] {
    const version = localStorage.getItem(ORDERS_VERSION_KEY);
    if (version !== ORDERS_VERSION) {
      localStorage.removeItem(ORDERS_KEY);
      localStorage.setItem(ORDERS_VERSION_KEY, ORDERS_VERSION);
    }

    let orders = this.readOrders();
    if (!orders.length) {
      orders = this.seedOrders();
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
    if (partnerFilter === 'all') return orders;
    return orders.filter(o => o.partner === partnerFilter);
  }

  refreshOrders(partners?: TestPartnerId[]): TestDeliveryOrder[] {
    const settings = this.getSettings();
    const active = partners?.length
      ? partners
      : (['careem', 'talabat', 'keeta'] as TestPartnerId[]).filter(
          p => settings.partners[p].enabled || settings.partners[p].connected
        );

    const toRefresh = active.length
      ? active
      : (['careem', 'talabat', 'keeta'] as TestPartnerId[]);

    const existing = this.readOrders().filter(o => !toRefresh.includes(o.partner));
    const fresh = toRefresh.flatMap(p => this.generatePartnerOrders(p, 3));
    const merged = [...fresh, ...existing].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    localStorage.setItem(ORDERS_KEY, JSON.stringify(merged));
    return merged;
  }

  /**
   * Append random "live" orders without changing any existing order
   * (payment status, awaiting_mobile, etc. stay untouched).
   */
  fetchLiveOrders(): { orders: TestDeliveryOrder[]; added: TestDeliveryOrder[] } {
    const existing = this.readOrders();
    const partners: TestPartnerId[] = ['careem', 'talabat', 'keeta'];
    const count = 1 + Math.floor(Math.random() * 2); // 1 or 2 new orders
    const added: TestDeliveryOrder[] = [];

    for (let i = 0; i < count; i++) {
      const partner = partners[Math.floor(Math.random() * partners.length)];
      const [order] = this.generatePartnerOrders(partner, 1, {
        forcePending: true,
        liveArrival: true,
      });
      // Unique ids so they never clash with existing rows
      order.id = `live-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
      order.externalId = `${partner === 'careem' ? 'CRM' : partner === 'talabat' ? 'TLB' : 'KT'}-LIVE-${Date.now().toString().slice(-5)}${i}`;
      order.invoiceNumber = `TI-2026-L${String(Date.now()).slice(-5)}${i}`;
      order.createdAt = new Date().toISOString();
      order.status = 'new';
      order.paymentStatus = 'pending';
      order.paymentReference = null;
      order.paidAt = null;
      added.push(order);
    }

    const merged = [...added, ...existing];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(merged));
    return { orders: merged, added };
  }

  clearOrders(): void {
    localStorage.removeItem(ORDERS_KEY);
  }

  updatePaymentStatus(
    orderId: string,
    paymentStatus: TestDeliveryOrder['paymentStatus']
  ): TestDeliveryOrder | null {
    const orders = this.readOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx < 0) return null;
    orders[idx] = {
      ...orders[idx],
      paymentStatus,
      paymentReference:
        paymentStatus === 'paid'
          ? `PL-${Date.now().toString().slice(-8)}`
          : orders[idx].paymentReference,
      paidAt: paymentStatus === 'paid' ? new Date().toISOString() : orders[idx].paidAt,
    };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return orders[idx];
  }

  partnerLabel(id: TestPartnerId): string {
    const map: Record<TestPartnerId, string> = {
      careem: 'Careem',
      talabat: 'Talabat',
      keeta: 'Keeta',
    };
    return map[id];
  }

  private seedOrders(): TestDeliveryOrder[] {
    return [
      ...this.generatePartnerOrders('careem', 2),
      ...this.generatePartnerOrders('talabat', 2),
      ...this.generatePartnerOrders('keeta', 2),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private generatePartnerOrders(
    partner: TestPartnerId,
    count: number,
    options?: { forcePending?: boolean; liveArrival?: boolean }
  ): TestDeliveryOrder[] {
    const catalogs: Record<TestPartnerId, Array<{ name: string; price: number }>> = {
      careem: [
        { name: 'Chicken Mandi', price: 42 },
        { name: 'Fresh Lemon Mint', price: 12 },
        { name: 'Hummus with Bread', price: 16 },
      ],
      talabat: [
        { name: 'Lamb Kabsa', price: 58 },
        { name: 'Fattoush Salad', price: 18 },
        { name: 'Kunafa Slice', price: 22 },
      ],
      keeta: [
        { name: 'Mixed Grill Platter', price: 75 },
        { name: 'Arabic Coffee (2 cups)', price: 10 },
        { name: 'Chicken Shawarma', price: 28 },
      ],
    };

    const customers = [
      { name: 'Sara Al Hashimi', phone: '+971 50 112 8841' },
      { name: 'Omar Farouk', phone: '+971 55 903 2210' },
      { name: 'Layla Mansour', phone: '+971 52 441 0098' },
      { name: 'Hassan Ibrahim', phone: '+971 54 778 3302' },
      { name: 'Noor Al Zaabi', phone: '+971 56 220 1188' },
      { name: 'Yusuf Rahman', phone: '+971 58 334 7710' },
    ];

    const branches = ['Al Quoz Branch', 'Business Bay Kiosk', 'JLT Counter'];
    const statuses = options?.liveArrival
      ? ['new', 'accepted']
      : ['accepted', 'preparing', 'ready', 'delivered', 'new'];
    const paymentStatuses: Array<TestDeliveryOrder['paymentStatus']> = options?.forcePending
      ? ['pending']
      : ['paid', 'pending', 'paid', 'failed', 'refunded'];
    const prefix = partner === 'careem' ? 'CRM' : partner === 'talabat' ? 'TLB' : 'KT';
    const menu = catalogs[partner];
    const orders: TestDeliveryOrder[] = [];

    for (let i = 0; i < count; i++) {
      const itemCount = 1 + (i % 3);
      const items: TestOrderItem[] = [];
      for (let j = 0; j < itemCount; j++) {
        const dish = menu[(i + j + Math.floor(Math.random() * menu.length)) % menu.length];
        const qty = 1 + ((i + j) % 2);
        items.push({
          id: `${prefix}-ITEM-${Date.now().toString(36)}-${i}${j}`,
          name: dish.name,
          quantity: qty,
          unit_price: dish.price,
          total_price: Math.round(dish.price * qty * 100) / 100,
        });
      }
      const subtotal = Math.round(items.reduce((s, it) => s + it.total_price, 0) * 100) / 100;
      const vatAmount = Math.round(subtotal * 0.05 * 100) / 100;
      const deliveryFee = partner === 'keeta' ? 7.5 : 5;
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const created = new Date();
      if (!options?.liveArrival) {
        created.setMinutes(
          created.getMinutes() - i * 17 - (partner === 'talabat' ? 5 : partner === 'keeta' ? 11 : 0)
        );
      }
      const paymentStatus = paymentStatuses[i % paymentStatuses.length];

      orders.push({
        id: `${partner}-${Date.now()}-${i}`,
        partner,
        externalId: `${prefix}-${882900 + i + (partner === 'talabat' ? 100 : partner === 'keeta' ? 200 : 0)}`,
        invoiceNumber: `TI-2026-${String(1200 + i + (partner === 'talabat' ? 10 : partner === 'keeta' ? 20 : 0)).padStart(5, '0')}`,
        status: statuses[i % statuses.length],
        customerName: customer.name,
        customerPhone: customer.phone,
        branch: branches[i % branches.length],
        address: `${12 + i} Street ${8 + i}, Al Quoz, Dubai`,
        items,
        subtotal,
        vatAmount,
        deliveryFee,
        total: Math.round((subtotal + vatAmount + deliveryFee) * 100) / 100,
        paymentType: i % 2 === 0 ? 'CARD' : 'CASH',
        paymentStatus,
        paymentReference: paymentStatus === 'paid' ? `PL-${prefix}-${88420 + i}` : null,
        paidAt: paymentStatus === 'paid' ? created.toISOString() : null,
        createdAt: created.toISOString(),
      });
    }
    return orders;
  }

  private readOrders(): TestDeliveryOrder[] {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as TestDeliveryOrder[];
    } catch {
      return [];
    }
  }

  private normalize(data: any): TestIntegrationSettings {
    const partnerDefaults = (id: TestPartnerId, raw: any): TestPartnerCredentials => {
      const defaults = DEFAULT_CREDS(id);
      return {
        ...defaults,
        ...(raw || {}),
        enabled: raw?.enabled ?? true,
        client_id: raw?.client_id || DEFAULT_TEST_CREDENTIALS[id].client_id,
        client_secret: raw?.client_secret || DEFAULT_TEST_CREDENTIALS[id].client_secret,
        // Platform Integration: partners show Connected by default with demo credentials
        connected: true,
        lastTestedAt: raw?.lastTestedAt || defaults.lastTestedAt,
      };
    };

    return {
      partners: {
        careem: partnerDefaults('careem', data?.partners?.careem),
        talabat: partnerDefaults('talabat', data?.partners?.talabat),
        keeta: partnerDefaults('keeta', data?.partners?.keeta),
      },
    };
  }
}
