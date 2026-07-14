import { Injectable } from '@angular/core';
import { Api } from './api';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type IntegrationPartner = 'careem';

export interface IntegrationConnectionSettings {
  enabled: boolean;
  client_id: string;
  client_secret: string;
  /** True when backend has a stored secret (secret field may be masked/empty in UI). */
  has_secret?: boolean;
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
  payment?: {
    payment_type?: string;
    cash_in?: number;
    merchant_pay_type?: string;
    payment_status?: string;
  };
  payment_status?: string;
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
  has_secret: false,
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
    return this.api.getUserCompany() ?? this.api.getCompanyId() ?? 1;
  }

  /** Load Careem credentials from backend. */
  getSettings(): Observable<IntegrationSettings> {
    const company = this.companyId();
    return this.api.get(`/reports/careem/settings/?company=${company}`).pipe(
      map((res: any) => {
        if (res?.status === 200 && res.data) {
          return this.mapApiSettings(res.data);
        }
        return structuredClone(DEFAULT_SETTINGS);
      }),
      catchError(() => of(structuredClone(DEFAULT_SETTINGS)))
    );
  }

  /** Save Careem credentials to backend (used by Save button). */
  saveSettings(settings: IntegrationSettings): Observable<any> {
    const careem = settings.partners.careem;
    const body: any = {
      company: this.companyId(),
      enabled: !!(settings.enabled && careem.enabled),
      client_id: (careem.client_id || '').trim(),
    };
    const secret = (careem.client_secret || '').trim();
    // Skip masked placeholder from GET (e.g. "abcd...wxyz")
    if (secret && !secret.includes('...')) {
      body.client_secret = secret;
    }
    return this.api.post('/reports/careem/settings/', body);
  }

  /**
   * Obtain Careem OAuth token via backend.
   * Sends form credentials when present; otherwise backend uses saved secrets.
   */
  testConnection(clientId?: string, clientSecret?: string): Observable<any> {
    const body: any = { company: this.companyId() };
    if (clientId?.trim()) body.client_id = clientId.trim();
    if (clientSecret?.trim() && !clientSecret.includes('...')) {
      body.client_secret = clientSecret.trim();
    }
    return this.api.post('/reports/careem/test-connection/', body);
  }

  isPartnerConfigured(partner: IntegrationPartner, settings: IntegrationSettings): boolean {
    const p = settings.partners[partner];
    if (!p?.enabled) return false;
    const hasId = !!(p.client_id?.trim());
    const hasSecret = !!(p.client_secret?.trim()) || !!p.has_secret;
    return hasId && hasSecret;
  }

  /** Fetch Careem orders via backend proxy. */
  getCareemOrders(pageNumber = 1, pageSize = 20): Observable<any> {
    return this.api.post('/reports/careem/orders/', {
      company: this.companyId(),
      page_number: pageNumber,
      page_size: pageSize,
    });
  }

  /** Same as getCareemOrders — used by Refresh. */
  refreshCareemOrders(pageNumber = 1, pageSize = 20): Observable<any> {
    return this.getCareemOrders(pageNumber, pageSize);
  }

  private mapApiSettings(data: any): IntegrationSettings {
    const enabled = !!data.enabled;
    const secretFromApi = data.client_secret || '';
    // Don't put masked secret into the form as if it were editable plaintext
    const secretForForm = secretFromApi.includes('...') ? '' : secretFromApi;
    return {
      enabled,
      partners: {
        careem: {
          enabled,
          client_id: data.client_id || '',
          client_secret: secretForForm,
          has_secret: !!data.has_secret,
        },
      },
    };
  }
}
