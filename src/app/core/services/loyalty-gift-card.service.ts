import { Injectable } from '@angular/core';
import { Api } from './api';
import { Observable, of, catchError, map, tap } from 'rxjs';

export interface LoyaltyProgramSettings {
  enabled: boolean;
  earnRate: number;
  spendPerPoint: number;
  redemptionPoints: number;
  redemptionValue: number;
  minRedeemPoints: number;
  pointsExpiryDays: number;
  welcomeBonus: number;
}

export interface GiftCardProgramSettings {
  enabled: boolean;
  prefix: string;
  denominations: number[];
  expiryMonths: number;
  minLoad: number;
  maxLoad: number;
  allowPartialRedemption: boolean;
  combineWithDiscounts: boolean;
}

export interface PartnerSettings {
  enabled: boolean;
  program_id?: string;
  merchant_id?: string;
  api_key?: string;
  client_secret?: string;
  client_id?: string;
  store_id?: string;
  loyalty_program_code?: string;
  earn_enabled?: boolean;
  redeem_enabled?: boolean;
}

export interface LoyaltyPartnersSettings {
  enbd: PartnerSettings;
  adcb: PartnerSettings;
  fab: PartnerSettings;
  pinelabs: PartnerSettings;
}

export interface LoyaltyGiftSettings {
  loyalty: LoyaltyProgramSettings;
  giftCards: GiftCardProgramSettings;
  partners: LoyaltyPartnersSettings;
}

export type GiftCardStatus = 'active' | 'expired' | 'depleted' | 'void';

export interface GiftCardRecord {
  id: string;
  cardNumber: string;
  partyId: number;
  partyName: string;
  mobile: string;
  initialAmount: number;
  balance: number;
  issuedAt: string;
  expiresAt: string;
  status: GiftCardStatus;
  note: string;
}

export interface LoyaltyPointsRecord {
  partyId: number;
  partyName: string;
  mobile: string;
  points: number;
  lastUpdated: string;
  expiresAt: string | null;
}

export interface LoyaltyPointLog {
  id: string;
  partyId: number;
  partyName: string;
  delta: number;
  reason: string;
  timestamp: string;
}

const DEFAULT_PARTNER: PartnerSettings = {
  enabled: false,
  program_id: '',
  merchant_id: '',
  api_key: '',
  client_secret: '',
  client_id: '',
  store_id: '',
  loyalty_program_code: '',
  earn_enabled: true,
  redeem_enabled: true,
};

const DEFAULT_SETTINGS: LoyaltyGiftSettings = {
  loyalty: {
    enabled: false,
    earnRate: 1,
    spendPerPoint: 10,
    redemptionPoints: 100,
    redemptionValue: 5,
    minRedeemPoints: 50,
    pointsExpiryDays: 365,
    welcomeBonus: 0,
  },
  giftCards: {
    enabled: false,
    prefix: 'GC-',
    denominations: [50, 100, 200, 500],
    expiryMonths: 12,
    minLoad: 10,
    maxLoad: 5000,
    allowPartialRedemption: true,
    combineWithDiscounts: false,
  },
  partners: {
    enbd: { ...DEFAULT_PARTNER },
    adcb: { ...DEFAULT_PARTNER },
    fab: { ...DEFAULT_PARTNER },
    pinelabs: { ...DEFAULT_PARTNER },
  },
};

@Injectable({ providedIn: 'root' })
export class LoyaltyGiftCardService {
  private partyDataRepaired = false;

  constructor(private api: Api) {}

  private companyId(): number {
    return this.api.getUserCompany() ?? 1;
  }

  private settingsKey(): string {
    return `loyalty_settings_${this.companyId()}`;
  }

  private giftCardsKey(): string {
    return `gift_cards_${this.companyId()}`;
  }

  private loyaltyPointsKey(): string {
    return `loyalty_points_${this.companyId()}`;
  }

  private pointLogsKey(): string {
    return `loyalty_point_logs_${this.companyId()}`;
  }

  getSettings(): Observable<LoyaltyGiftSettings> {
    const companyId = this.companyId();
    return this.api.get<any>(`/company/get-loyalty-setting/${companyId}/`).pipe(
      map(res => (res?.status === 200 && res.data ? this.normalizeSettings(res.data) : this.loadSettingsFromStorage())),
      catchError(() => of(this.loadSettingsFromStorage()))
    );
  }

  saveSettings(settings: LoyaltyGiftSettings): Observable<boolean> {
    const companyId = this.companyId();
    localStorage.setItem(this.settingsKey(), JSON.stringify(settings));
    return this.api.put<any>(`/company/update-loyalty-setting/${companyId}/`, settings).pipe(
      map(res => res?.status === 200),
      catchError(() => of(true))
    );
  }

  repairPartyDisplayData(): Observable<void> {
    if (this.partyDataRepaired) {
      return of(undefined);
    }

    const cards = this.listGiftCards();
    const records = this.listLoyaltyBalances();
    const needsRepair =
      cards.some(c => c.partyId && !c.partyName?.trim()) ||
      records.some(r => r.partyId && !r.partyName?.trim());

    if (!needsRepair) {
      this.partyDataRepaired = true;
      return of(undefined);
    }

    return this.api
      .post<any>('/party/list-party/s=/', {
        company: this.companyId(),
        type: 0,
      })
      .pipe(
        tap(res => {
          if (res?.status !== 200 || !res.data?.length) {
            this.partyDataRepaired = true;
            return;
          }

          const partyMap = new Map<number, { name: string; mobile: string }>();
          for (const p of res.data) {
            const id = p.id ?? p.party_id;
            if (id) {
              partyMap.set(id, {
                name: p.partyName || p.Party_name || p.party_name || p.name || '',
                mobile: p.contact || p.mobile_number || p.mobile || '',
              });
            }
          }

          let cardsChanged = false;
          const updatedCards = cards.map(card => {
            if (card.partyName?.trim() || !card.partyId) return card;
            const info = partyMap.get(card.partyId);
            if (!info?.name) return card;
            cardsChanged = true;
            return { ...card, partyName: info.name, mobile: info.mobile || card.mobile };
          });

          let recordsChanged = false;
          const updatedRecords = records.map(record => {
            if (record.partyName?.trim() || !record.partyId) return record;
            const info = partyMap.get(record.partyId);
            if (!info?.name) return record;
            recordsChanged = true;
            return { ...record, partyName: info.name, mobile: info.mobile || record.mobile };
          });

          if (cardsChanged) {
            localStorage.setItem(this.giftCardsKey(), JSON.stringify(updatedCards));
          }
          if (recordsChanged) {
            localStorage.setItem(this.loyaltyPointsKey(), JSON.stringify(updatedRecords));
          }

          this.partyDataRepaired = true;
        }),
        map(() => undefined),
        catchError(() => {
          this.partyDataRepaired = true;
          return of(undefined);
        })
      );
  }

  listGiftCards(): GiftCardRecord[] {
    return this.readJson<GiftCardRecord[]>(this.giftCardsKey(), []);
  }

  issueGiftCard(data: {
    partyId: number;
    partyName: string;
    mobile: string;
    amount: number;
    note: string;
    prefix: string;
    expiryMonths: number;
  }): GiftCardRecord {
    const cards = this.listGiftCards();
    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + data.expiryMonths);

    const record: GiftCardRecord = {
      id: this.generateId(),
      cardNumber: this.generateCardNumber(data.prefix),
      partyId: data.partyId,
      partyName: data.partyName,
      mobile: data.mobile,
      initialAmount: data.amount,
      balance: data.amount,
      issuedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'active',
      note: data.note,
    };

    cards.unshift(record);
    localStorage.setItem(this.giftCardsKey(), JSON.stringify(cards));
    return record;
  }

  voidGiftCard(id: string): boolean {
    const cards = this.listGiftCards();
    const idx = cards.findIndex(c => c.id === id);
    if (idx < 0) return false;
    cards[idx] = { ...cards[idx], status: 'void', balance: 0 };
    localStorage.setItem(this.giftCardsKey(), JSON.stringify(cards));
    return true;
  }

  refreshGiftCardStatuses(): GiftCardRecord[] {
    const cards = this.listGiftCards();
    const now = Date.now();
    let changed = false;

    const updated = cards.map(card => {
      if (card.status === 'void') return card;
      if (card.balance <= 0 && card.status !== 'depleted') {
        changed = true;
        return { ...card, status: 'depleted' as GiftCardStatus };
      }
      if (new Date(card.expiresAt).getTime() < now && card.status === 'active') {
        changed = true;
        return { ...card, status: 'expired' as GiftCardStatus };
      }
      return card;
    });

    if (changed) {
      localStorage.setItem(this.giftCardsKey(), JSON.stringify(updated));
    }
    return updated;
  }

  listLoyaltyBalances(): LoyaltyPointsRecord[] {
    return this.readJson<LoyaltyPointsRecord[]>(this.loyaltyPointsKey(), []);
  }

  adjustPoints(data: {
    partyId: number;
    partyName: string;
    mobile: string;
    delta: number;
    reason: string;
    pointsExpiryDays: number;
  }): LoyaltyPointsRecord {
    const records = this.listLoyaltyBalances();
    const now = new Date();
    let expiresAt: string | null = null;
    if (data.pointsExpiryDays > 0) {
      const exp = new Date(now);
      exp.setDate(exp.getDate() + data.pointsExpiryDays);
      expiresAt = exp.toISOString();
    }

    const idx = records.findIndex(r => r.partyId === data.partyId);
    let record: LoyaltyPointsRecord;

    if (idx >= 0) {
      record = {
        ...records[idx],
        points: Math.max(0, records[idx].points + data.delta),
        lastUpdated: now.toISOString(),
        expiresAt: expiresAt ?? records[idx].expiresAt,
        partyName: data.partyName,
        mobile: data.mobile,
      };
      records[idx] = record;
    } else {
      record = {
        partyId: data.partyId,
        partyName: data.partyName,
        mobile: data.mobile,
        points: Math.max(0, data.delta),
        lastUpdated: now.toISOString(),
        expiresAt,
      };
      records.unshift(record);
    }

    localStorage.setItem(this.loyaltyPointsKey(), JSON.stringify(records));
    this.addPointLog({
      partyId: data.partyId,
      partyName: data.partyName,
      delta: data.delta,
      reason: data.reason,
    });
    return record;
  }

  getPointHistory(partyId: number): LoyaltyPointLog[] {
    return this.readJson<LoyaltyPointLog[]>(this.pointLogsKey(), [])
      .filter(l => l.partyId === partyId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private addPointLog(data: { partyId: number; partyName: string; delta: number; reason: string }) {
    const logs = this.readJson<LoyaltyPointLog[]>(this.pointLogsKey(), []);
    logs.unshift({
      id: this.generateId(),
      partyId: data.partyId,
      partyName: data.partyName,
      delta: data.delta,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(this.pointLogsKey(), JSON.stringify(logs.slice(0, 500)));
  }

  private loadSettingsFromStorage(): LoyaltyGiftSettings {
    const stored = localStorage.getItem(this.settingsKey());
    if (stored) {
      try {
        return this.normalizeSettings(JSON.parse(stored));
      } catch { /* fall through */ }
    }
    return structuredClone(DEFAULT_SETTINGS);
  }

  private normalizeSettings(data: any): LoyaltyGiftSettings {
    const partners = data.partners || {};
    return {
      loyalty: { ...DEFAULT_SETTINGS.loyalty, ...(data.loyalty || {}) },
      giftCards: { ...DEFAULT_SETTINGS.giftCards, ...(data.giftCards || {}) },
      partners: {
        enbd: { ...DEFAULT_PARTNER, ...(partners.enbd || {}) },
        adcb: { ...DEFAULT_PARTNER, ...(partners.adcb || {}) },
        fab: { ...DEFAULT_PARTNER, ...(partners.fab || {}) },
        pinelabs: { ...DEFAULT_PARTNER, ...(partners.pinelabs || {}) },
      },
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private generateCardNumber(prefix: string): string {
    const suffix = Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
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
