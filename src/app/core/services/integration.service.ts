import { Injectable } from '@angular/core';
import { Api } from './api';
import { Observable, of } from 'rxjs';

export type IntegrationPartner = 'careem';

export interface IntegrationConnectionSettings {
  enabled: boolean;
  client_id: string;
  client_secret: string;
}

export interface IntegrationSettings {
  enabled: boolean;
  partners: {
    careem: IntegrationConnectionSettings;
  };
}

export interface CareemOrderPrice {
  original_total_price: number;
  careem_discount_amount: number;
  merchant_discount_amount: number;
  merchant_promo_amount: number;
  careem_promo_amount: number;
  tax_percentage: number;
  total_taxable_price: number;
  delivery_fee: number;
  free_delivery_discount_value: number;
  service_fee: number;
  promo_code: string;
}

export interface CareemBranch {
  id: string;
  name: string;
  brand_id: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface CareemOption {
  id: string;
  quantity: number;
  total_price: number;
  discount: number;
  careem_discount_amount: number;
  merchant_discount_amount: number;
  groups?: CareemGroup[];
}

export interface CareemGroup {
  id: string;
  options: CareemOption[];
}

export interface CareemOrderItem {
  id: string;
  quantity: number;
  item_price: number;
  total_price: number;
  discount: number;
  careem_discount_amount: number;
  merchant_discount_amount: number;
  tags: string;
  groups: CareemGroup[];
  unit_price: number;
  notes: string;
}

export interface CareemCustomerAddress {
  name: string;
  location: { lat: string; lng: string };
  number: string;
  building: string;
  street: string;
  area: string;
  city: string;
  note: string;
}

export interface CareemCustomer {
  name: string;
  phone_number: string;
  address: CareemCustomerAddress;
  payment_type: string;
}

export interface CareemCaptain {
  name: string;
  phone_number: string;
  eta: string;
}

export interface CareemOrderInstruction {
  label: string;
  icon_url: string;
  name_localized: { en: string; ar: string };
}

export interface CareemOrderMetadata {
  order_instructions: {
    merchant_notes: string;
    merchant_instructions: CareemOrderInstruction[];
  };
  tags: string;
}

export interface CareemOrder {
  id: number;
  status: string;
  price: CareemOrderPrice;
  branch: CareemBranch;
  items: CareemOrderItem[];
  created_at: string;
  updated_at: string;
  merchant_pay_type: string;
  delivery_type: string;
  notes: string;
  customer: CareemCustomer;
  captain: CareemCaptain;
  cash_in: number;
  cancellation_reason: string;
  is_scheduled: boolean;
  prepare_time: string;
  pickup_time: string;
  metadata: CareemOrderMetadata;
}

export interface CareemOrdersMeta {
  total: number;
  page_size: number;
  page_number: number;
}

export interface CareemOrdersLinks {
  prev: string;
  next: string;
}

export interface CareemOrdersResponse {
  data: CareemOrder[];
  meta: CareemOrdersMeta;
  links: CareemOrdersLinks;
}

const DEFAULT_CAREEM: IntegrationConnectionSettings = {
  enabled: false,
  client_id: '',
  client_secret: '',
};

const DEFAULT_SETTINGS: IntegrationSettings = {
  enabled: false,
  partners: {
    careem: { ...DEFAULT_CAREEM },
  },
};

@Injectable({ providedIn: 'root' })
export class IntegrationService {
  constructor(private api: Api) {}

  private companyId(): number {
    return this.api.getUserCompany() ?? 1;
  }

  private settingsKey(): string {
    return `integration_settings_${this.companyId()}`;
  }

  private ordersKey(): string {
    return `integration_careem_orders_${this.companyId()}`;
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
    return !!(p.client_id?.trim() && p.client_secret?.trim());
  }

  /** Returns Careem orders list matching `/api/orders` sample response shape. */
  getCareemOrders(): CareemOrdersResponse {
    const stored = this.readJson<CareemOrdersResponse | null>(this.ordersKey(), null);
    if (stored?.data?.length) return stored;
    const sample = this.sampleCareemOrdersResponse();
    localStorage.setItem(this.ordersKey(), JSON.stringify(sample));
    return sample;
  }

  refreshCareemOrders(): CareemOrdersResponse {
    const sample = this.sampleCareemOrdersResponse();
    localStorage.setItem(this.ordersKey(), JSON.stringify(sample));
    return sample;
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
    return structuredClone(DEFAULT_SETTINGS);
  }

  private normalizeSettings(data: any): IntegrationSettings {
    const partners = data.partners || {};
    const raw = partners.careem || {};
    return {
      enabled: data.enabled ?? false,
      partners: {
        careem: {
          enabled: raw.enabled ?? false,
          client_id: raw.client_id || raw.api_key || '',
          client_secret: raw.client_secret || raw.api_secret || '',
        },
      },
    };
  }

  private sampleCareemOrdersResponse(): CareemOrdersResponse {
    const baseItem = (notes: string): CareemOrderItem => ({
      id: '345',
      quantity: 2,
      item_price: 18,
      total_price: 22.5,
      discount: 9.5,
      careem_discount_amount: 4.75,
      merchant_discount_amount: 4.75,
      tags: 'careem-mealson',
      groups: [
        {
          id: '30',
          options: [
            {
              id: '129',
              quantity: 2,
              total_price: 2.25,
              discount: 1.5,
              careem_discount_amount: 0.75,
              merchant_discount_amount: 0.75,
              groups: [
                {
                  id: '31',
                  options: [
                    {
                      id: '130',
                      quantity: 1,
                      total_price: 0,
                      discount: 0,
                      careem_discount_amount: 0,
                      merchant_discount_amount: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      unit_price: 9,
      notes,
    });

    const branch: CareemBranch = {
      id: 'a34587b290784c06',
      name: 'KFC, JLT',
      brand_id: '1228a02e60e34037',
      state: 'MAPPED',
      created_at: '2020-06-22T15:01:32.895Z',
      updated_at: '2020-06-22T15:01:32.895Z',
    };

    const metadata: CareemOrderMetadata = {
      order_instructions: {
        merchant_notes: 'Please make the order less spicy',
        merchant_instructions: [
          {
            label: 'INCLUDE_CUTLERY',
            icon_url: 'test.url',
            name_localized: {
              en: 'Include Cutlery',
              ar: 'أدوات المائدة متضمنة',
            },
          },
        ],
      },
      tags: 'careem-mealson',
    };

    const orders: CareemOrder[] = [
      {
        id: 1001,
        status: 'pending',
        price: {
          original_total_price: 22.5,
          careem_discount_amount: 5.5,
          merchant_discount_amount: 5.5,
          merchant_promo_amount: 9,
          careem_promo_amount: 0,
          tax_percentage: 5,
          total_taxable_price: 1557.37,
          delivery_fee: 10,
          free_delivery_discount_value: 0,
          service_fee: 5,
          promo_code: 'FREEPROMO30',
        },
        branch,
        items: [baseItem('Allergic to peanuts'), baseItem('Allergic to peanuts')],
        created_at: '2020-06-22T15:01:32.895Z',
        updated_at: '2020-06-22T15:01:32.895Z',
        merchant_pay_type: 'cash',
        delivery_type: 'careem',
        notes: 'please add extra ketchup',
        customer: {
          name: 'Derek Falcon',
          phone_number: '+971500000001',
          address: {
            name: 'Work',
            location: { lat: '-39.65539', lng: '-31.78606' },
            number: 'G04',
            building: "'204', '1A'",
            street: '3075 Dye Street',
            area: 'Marina',
            city: 'Dubai',
            note: '',
          },
          payment_type: 'cash',
        },
        captain: {
          name: 'Ahmed Captain',
          phone_number: '+971500000099',
          eta: '2024-09-01T15:01:32.895Z',
        },
        cash_in: 41,
        cancellation_reason: '',
        is_scheduled: false,
        prepare_time: '2020-06-22T15:01:32.895Z',
        pickup_time: '2020-06-22T15:01:32.895Z',
        metadata,
      },
      {
        id: 1002,
        status: 'accepted',
        price: {
          original_total_price: 45.0,
          careem_discount_amount: 5.5,
          merchant_discount_amount: 5.5,
          merchant_promo_amount: 9,
          careem_promo_amount: 0,
          tax_percentage: 5,
          total_taxable_price: 42.75,
          delivery_fee: 10,
          free_delivery_discount_value: 0,
          service_fee: 5,
          promo_code: 'FREEPROMO30',
        },
        branch: { ...branch, name: 'KFC, Marina' },
        items: [baseItem('No onions please')],
        created_at: '2020-06-23T12:20:00.000Z',
        updated_at: '2020-06-23T12:25:00.000Z',
        merchant_pay_type: 'cash',
        delivery_type: 'careem',
        notes: 'Ring the doorbell',
        customer: {
          name: 'Sara Al Maktoum',
          phone_number: '+971500000002',
          address: {
            name: 'Home',
            location: { lat: '25.0657', lng: '55.1713' },
            number: '12',
            building: 'Tower A',
            street: 'Al Wasl Road',
            area: 'Jumeirah',
            city: 'Dubai',
            note: 'Gate 2',
          },
          payment_type: 'card',
        },
        captain: {
          name: 'Omar Rider',
          phone_number: '+971500000088',
          eta: '2024-09-01T16:00:00.000Z',
        },
        cash_in: 0,
        cancellation_reason: '',
        is_scheduled: false,
        prepare_time: '2020-06-23T12:20:00.000Z',
        pickup_time: '2020-06-23T12:35:00.000Z',
        metadata,
      },
      {
        id: 1003,
        status: 'delivered',
        price: {
          original_total_price: 68.0,
          careem_discount_amount: 0,
          merchant_discount_amount: 2,
          merchant_promo_amount: 0,
          careem_promo_amount: 0,
          tax_percentage: 5,
          total_taxable_price: 66.0,
          delivery_fee: 8,
          free_delivery_discount_value: 0,
          service_fee: 3,
          promo_code: '',
        },
        branch: { ...branch, name: 'KFC, Business Bay' },
        items: [baseItem('Extra spicy'), baseItem('')],
        created_at: '2020-06-21T09:10:00.000Z',
        updated_at: '2020-06-21T10:05:00.000Z',
        merchant_pay_type: 'online',
        delivery_type: 'careem',
        notes: '',
        customer: {
          name: 'James Wilson',
          phone_number: '+971500000003',
          address: {
            name: 'Office',
            location: { lat: '25.1860', lng: '55.2640' },
            number: '802',
            building: 'Bay Square',
            street: 'Al Abraj Street',
            area: 'Business Bay',
            city: 'Dubai',
            note: '',
          },
          payment_type: 'card',
        },
        captain: {
          name: 'Khalid Rider',
          phone_number: '+971500000077',
          eta: '2020-06-21T09:45:00.000Z',
        },
        cash_in: 0,
        cancellation_reason: '',
        is_scheduled: false,
        prepare_time: '2020-06-21T09:15:00.000Z',
        pickup_time: '2020-06-21T09:30:00.000Z',
        metadata,
      },
    ];

    return {
      data: orders,
      meta: {
        total: 90,
        page_size: 20,
        page_number: 1,
      },
      links: {
        prev: 'URL/api/orders?page_number=1',
        next: 'URL/api/orders?page_number=3',
      },
    };
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
