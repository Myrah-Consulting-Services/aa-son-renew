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
  Validators,
  FormsModule,
} from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import {
  LoyaltyGiftCardService,
  LoyaltyGiftSettings,
  GiftCardRecord,
  LoyaltyPointsRecord,
  LoyaltyPointLog,
  GiftCardStatus,
  PartnerSettings,
} from '../../../core/services/loyalty-gift-card.service';

type SubTab = 'settings' | 'giftcards' | 'loyalty';

interface PartnerField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  secret?: boolean;
  hint?: string;
  type?: string;
}

interface LoyaltyPartnerConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  color: string;
  docsUrl: string;
  fields: PartnerField[];
  toggles?: { key: string; label: string }[];
}

@Component({
  selector: 'app-loyalty-gift-cards',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './loyalty-gift-cards.html',
  styleUrl: './loyalty-gift-cards.scss',
})
export class LoyaltyGiftCards implements OnInit, OnDestroy {
  @ViewChild('issueGiftCardModal') issueGiftCardModal!: TemplateRef<any>;
  @ViewChild('giftCardDetailModal') giftCardDetailModal!: TemplateRef<any>;
  @ViewChild('adjustPointsModal') adjustPointsModal!: TemplateRef<any>;
  @ViewChild('pointHistoryModal') pointHistoryModal!: TemplateRef<any>;
  @ViewChild('partySearchInput') partySearchInput?: ElementRef<HTMLInputElement>;

  activeSubTab: SubTab = 'settings';
  settingsForm!: FormGroup;
  issueForm!: FormGroup;
  adjustForm!: FormGroup;
  settingsSaving = false;
  partnersSaving = false;

  giftCards: GiftCardRecord[] = [];
  loyaltyRecords: LoyaltyPointsRecord[] = [];
  filteredGiftCards: GiftCardRecord[] = [];
  filteredLoyaltyRecords: LoyaltyPointsRecord[] = [];

  giftCardSearch = '';
  giftCardStatusFilter: 'all' | GiftCardStatus = 'all';
  loyaltySearch = '';

  selectedGiftCard: GiftCardRecord | null = null;
  pointHistory: LoyaltyPointLog[] = [];
  selectedLoyaltyRecord: LoyaltyPointsRecord | null = null;

  expandedPartner: string | null = null;
  visibleSecrets: Record<string, boolean> = {};

  loyaltyPartners: LoyaltyPartnerConfig[] = [
    {
      id: 'enbd',
      name: 'Emirates NBD',
      type: 'Bank Loyalty',
      description: 'Sync loyalty earn and redeem via ENBD rewards API at POS and online checkout.',
      icon: 'bi bi-bank2',
      color: 'linear-gradient(135deg, #003366 0%, #001a33 100%)',
      docsUrl: 'https://www.emiratesnbd.com/',
      fields: [
        { key: 'program_id', label: 'Program ID', placeholder: 'ENBD loyalty program ID', required: true },
        { key: 'merchant_id', label: 'Merchant ID', placeholder: 'Merchant identifier', required: true },
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', required: true, secret: true },
        { key: 'client_secret', label: 'Client Secret', placeholder: 'Enter client secret', required: true, secret: true },
      ],
      toggles: [
        { key: 'earn_enabled', label: 'Enable earn at POS' },
        { key: 'redeem_enabled', label: 'Enable redeem at POS' },
      ],
    },
    {
      id: 'adcb',
      name: 'ADCB',
      type: 'Bank Loyalty',
      description: 'Connect ADCB TouchPoints for automatic loyalty accrual and redemption.',
      icon: 'bi bi-bank',
      color: 'linear-gradient(135deg, #c41230 0%, #8b0000 100%)',
      docsUrl: 'https://www.adcb.com/',
      fields: [
        { key: 'program_id', label: 'Program ID', placeholder: 'TouchPoints program ID', required: true },
        { key: 'merchant_id', label: 'Merchant ID', placeholder: 'ADCB merchant ID', required: true },
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', required: true, secret: true },
        { key: 'client_secret', label: 'Client Secret', placeholder: 'Enter client secret', required: true, secret: true },
      ],
      toggles: [
        { key: 'earn_enabled', label: 'Enable earn at POS' },
        { key: 'redeem_enabled', label: 'Enable redeem at POS' },
      ],
    },
    {
      id: 'fab',
      name: 'FAB',
      type: 'Bank Loyalty',
      description: 'Integrate First Abu Dhabi Bank loyalty for earn/redeem on card-linked purchases.',
      icon: 'bi bi-building',
      color: 'linear-gradient(135deg, #00529b 0%, #002d5a 100%)',
      docsUrl: 'https://www.bankfab.com/',
      fields: [
        { key: 'program_id', label: 'Program ID', placeholder: 'FAB rewards program ID', required: true },
        { key: 'merchant_id', label: 'Merchant ID', placeholder: 'FAB merchant ID', required: true },
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', required: true, secret: true },
        { key: 'client_secret', label: 'Client Secret', placeholder: 'Enter client secret', required: true, secret: true },
      ],
      toggles: [
        { key: 'earn_enabled', label: 'Enable earn at POS' },
        { key: 'redeem_enabled', label: 'Enable redeem at POS' },
      ],
    },
    {
      id: 'pinelabs',
      name: 'Pine Labs',
      type: 'POS Loyalty',
      description: 'Sync loyalty points with Pine Labs POS terminals for in-store earn and burn.',
      icon: 'bi bi-cpu',
      color: 'linear-gradient(135deg, #00a651 0%, #006837 100%)',
      docsUrl: 'https://developer.pinelabs.com/',
      fields: [
        { key: 'merchant_id', label: 'Merchant ID', placeholder: 'Pine Labs merchant ID', required: true },
        { key: 'api_key', label: 'Security Token', placeholder: 'Enter security token', required: true, secret: true },
        { key: 'client_id', label: 'Client ID', placeholder: 'POS client identifier' },
        { key: 'store_id', label: 'Store ID', placeholder: 'Outlet / store ID', hint: 'Maps to physical outlet' },
        { key: 'loyalty_program_code', label: 'Loyalty Program Code', placeholder: 'Program code from Pine Labs', required: true },
      ],
      toggles: [
        { key: 'earn_enabled', label: 'Enable earn at terminal' },
        { key: 'redeem_enabled', label: 'Enable redeem at terminal' },
      ],
    },
  ];

  // Party search
  filteredParties: any[] = [];
  partySearchText = '';
  showPartyDropdown = false;
  activePartyIndex = -1;
  selectedParty: any = null;
  partySearchContext: 'issue' | 'adjust' = 'issue';
  partyLoading = false;

  newDenomination = '';
  issueAmount: number | null = null;
  customIssueAmount: number | null = null;
  denominations: number[] = [50, 100, 200, 500];

  private modalRef?: NgbModalRef;
  private destroy$ = new Subject<void>();
  private partySearch$ = new Subject<string>();
  private partyDataRepaired = false;

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    private modalService: NgbModal,
    private loyaltyService: LoyaltyGiftCardService
  ) {
    this.initForms();
    this.partySearch$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.fetchParties(term));
  }

  ngOnInit() {
    this.loadSettings();
    this.refreshGiftCardsWithRepair();
    this.refreshLoyaltyRecordsWithRepair();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPartyName(party: any): string {
    if (!party) return '—';
    return party.partyName || party.Party_name || party.party_name || party.name || '—';
  }

  getPartyMobile(party: any): string {
    if (!party) return '';
    return party.contact || party.mobile_number || party.mobile || '';
  }

  getPartyId(party: any): number {
    return party?.id ?? party?.party_id;
  }

  private initForms() {
    const settingsControls: Record<string, any> = {
      loyalty_enabled: [false],
      earn_rate: [1, [Validators.min(0)]],
      spend_per_point: [10, [Validators.min(0.01)]],
      redemption_points: [100, [Validators.min(1)]],
      redemption_value: [5, [Validators.min(0.01)]],
      min_redeem_points: [50, [Validators.min(0)]],
      points_expiry_days: [365, [Validators.min(0)]],
      welcome_bonus: [0, [Validators.min(0)]],
      giftcards_enabled: [false],
      card_prefix: ['GC-', Validators.required],
      expiry_months: [12, [Validators.min(1)]],
      min_load: [10, [Validators.min(0)]],
      max_load: [5000, [Validators.min(0)]],
      allow_partial_redemption: [true],
      combine_with_discounts: [false],
    };

    this.loyaltyPartners.forEach(partner => {
      settingsControls[`${partner.id}_enabled`] = [false];
      partner.fields.forEach(field => {
        settingsControls[`${partner.id}_${field.key}`] = [''];
      });
      partner.toggles?.forEach(toggle => {
        settingsControls[`${partner.id}_${toggle.key}`] = [true];
      });
    });

    this.settingsForm = this.fb.group(settingsControls);

    this.issueForm = this.fb.group({ note: [''] });
    this.adjustForm = this.fb.group({
      delta: [0, [Validators.required]],
      reason: ['', Validators.required],
    });
  }

  switchSubTab(tab: SubTab) {
    this.activeSubTab = tab;
    if (tab === 'giftcards') this.refreshGiftCardsWithRepair();
    if (tab === 'loyalty') this.refreshLoyaltyRecordsWithRepair();
  }

  loadSettings() {
    this.loyaltyService.getSettings().subscribe(settings => {
      this.patchSettingsForm(settings);
    });
  }

  private patchSettingsForm(s: LoyaltyGiftSettings) {
    const patch: Record<string, any> = {
      loyalty_enabled: s.loyalty.enabled,
      earn_rate: s.loyalty.earnRate,
      spend_per_point: s.loyalty.spendPerPoint,
      redemption_points: s.loyalty.redemptionPoints,
      redemption_value: s.loyalty.redemptionValue,
      min_redeem_points: s.loyalty.minRedeemPoints,
      points_expiry_days: s.loyalty.pointsExpiryDays,
      welcome_bonus: s.loyalty.welcomeBonus,
      giftcards_enabled: s.giftCards.enabled,
      card_prefix: s.giftCards.prefix,
      expiry_months: s.giftCards.expiryMonths,
      min_load: s.giftCards.minLoad,
      max_load: s.giftCards.maxLoad,
      allow_partial_redemption: s.giftCards.allowPartialRedemption,
      combine_with_discounts: s.giftCards.combineWithDiscounts,
    };

    this.loyaltyPartners.forEach(partner => {
      const partnerData: PartnerSettings = s.partners?.[partner.id as keyof typeof s.partners] || {};
      patch[`${partner.id}_enabled`] = partnerData.enabled ?? false;
      partner.fields.forEach(field => {
        patch[`${partner.id}_${field.key}`] = (partnerData as any)[field.key] || '';
      });
      partner.toggles?.forEach(toggle => {
        patch[`${partner.id}_${toggle.key}`] = (partnerData as any)[toggle.key] ?? true;
      });
    });

    this.settingsForm.patchValue(patch);
    this.denominations = [...s.giftCards.denominations];
  }

  addDenomination() {
    const val = parseFloat(this.newDenomination);
    if (!val || val <= 0 || this.denominations.includes(val)) return;
    this.denominations = [...this.denominations, val].sort((a, b) => a - b);
    this.newDenomination = '';
  }

  removeDenomination(val: number) {
    this.denominations = this.denominations.filter(d => d !== val);
  }

  private buildSettingsPayload(): LoyaltyGiftSettings {
    const v = this.settingsForm.value;
    const partners: LoyaltyGiftSettings['partners'] = {
      enbd: this.buildPartnerData('enbd'),
      adcb: this.buildPartnerData('adcb'),
      fab: this.buildPartnerData('fab'),
      pinelabs: this.buildPartnerData('pinelabs'),
    };

    return {
      loyalty: {
        enabled: v.loyalty_enabled,
        earnRate: v.earn_rate,
        spendPerPoint: v.spend_per_point,
        redemptionPoints: v.redemption_points,
        redemptionValue: v.redemption_value,
        minRedeemPoints: v.min_redeem_points,
        pointsExpiryDays: v.points_expiry_days,
        welcomeBonus: v.welcome_bonus,
      },
      giftCards: {
        enabled: v.giftcards_enabled,
        prefix: v.card_prefix,
        denominations: [...this.denominations],
        expiryMonths: v.expiry_months,
        minLoad: v.min_load,
        maxLoad: v.max_load,
        allowPartialRedemption: v.allow_partial_redemption,
        combineWithDiscounts: v.combine_with_discounts,
      },
      partners,
    };
  }

  private buildPartnerData(partnerId: string): PartnerSettings {
    const partner = this.loyaltyPartners.find(p => p.id === partnerId);
    if (!partner) return { enabled: false };

    const data: PartnerSettings = {
      enabled: this.settingsForm.get(`${partnerId}_enabled`)?.value ?? false,
    };
    partner.fields.forEach(field => {
      (data as any)[field.key] = this.settingsForm.get(`${partnerId}_${field.key}`)?.value || '';
    });
    partner.toggles?.forEach(toggle => {
      (data as any)[toggle.key] = this.settingsForm.get(`${partnerId}_${toggle.key}`)?.value ?? true;
    });
    return data;
  }

  saveSettings() {
    if (this.settingsForm.invalid) return;
    this.settingsSaving = true;
    this.loyaltyService.saveSettings(this.buildSettingsPayload()).subscribe(() => {
      this.settingsSaving = false;
      this.toast.show('Success', 'Program settings saved', 'success');
    });
  }

  savePartnerSettings() {
    this.partnersSaving = true;
    this.loyaltyService.saveSettings(this.buildSettingsPayload()).subscribe(() => {
      this.partnersSaving = false;
      this.toast.show('Success', 'Partner settings saved', 'success');
    });
  }

  togglePartnerExpand(partnerId: string) {
    this.expandedPartner = this.expandedPartner === partnerId ? null : partnerId;
  }

  onPartnerToggle(partnerId: string) {
    if (this.settingsForm.get(`${partnerId}_enabled`)?.value) {
      this.expandedPartner = partnerId;
    }
  }

  isPartnerConfigured(partnerId: string): boolean {
    if (!this.settingsForm.get(`${partnerId}_enabled`)?.value) return false;
    const partner = this.loyaltyPartners.find(p => p.id === partnerId);
    if (!partner) return false;
    return partner.fields
      .filter(f => f.required)
      .every(f => !!this.settingsForm.get(`${partnerId}_${f.key}`)?.value?.trim());
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

  testPartnerConnection(partnerId: string) {
    const partner = this.loyaltyPartners.find(p => p.id === partnerId);
    if (!partner) return;
    const missing = partner.fields.filter(
      f => f.required && !this.settingsForm.get(`${partnerId}_${f.key}`)?.value?.trim()
    );
    if (missing.length) {
      this.toast.show('Validation', `Please fill in ${missing.map(f => f.label).join(', ')}`, 'warning');
      return;
    }
    this.toast.show('Connection Test', `${partner.name} credentials saved locally. Backend verification pending.`, 'success');
  }

  private refreshGiftCardsWithRepair() {
    const load = () => {
      this.giftCards = this.loyaltyService.refreshGiftCardStatuses();
      this.applyGiftCardFilters();
    };
    if (this.partyDataRepaired) {
      load();
      return;
    }
    this.loyaltyService.repairPartyDisplayData().subscribe(() => {
      this.partyDataRepaired = true;
      load();
    });
  }

  private refreshLoyaltyRecordsWithRepair() {
    const load = () => {
      this.loyaltyRecords = this.loyaltyService.listLoyaltyBalances();
      this.applyLoyaltyFilters();
    };
    if (this.partyDataRepaired) {
      load();
      return;
    }
    this.loyaltyService.repairPartyDisplayData().subscribe(() => {
      this.partyDataRepaired = true;
      load();
    });
  }

  applyGiftCardFilters() {
    let list = [...this.giftCards];
    const q = this.giftCardSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        c =>
          c.cardNumber.toLowerCase().includes(q) ||
          (c.partyName || '').toLowerCase().includes(q) ||
          (c.mobile || '').includes(q)
      );
    }
    if (this.giftCardStatusFilter !== 'all') {
      list = list.filter(c => c.status === this.giftCardStatusFilter);
    }
    this.filteredGiftCards = list;
  }

  applyLoyaltyFilters() {
    let list = [...this.loyaltyRecords];
    const q = this.loyaltySearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        r =>
          (r.partyName || '').toLowerCase().includes(q) ||
          (r.mobile || '').includes(q)
      );
    }
    this.filteredLoyaltyRecords = list;
  }

  onGiftCardSearchChange() { this.applyGiftCardFilters(); }
  onGiftCardStatusFilterChange() { this.applyGiftCardFilters(); }
  onLoyaltySearchChange() { this.applyLoyaltyFilters(); }

  statusLabel(status: GiftCardStatus): string {
    const map: Record<GiftCardStatus, string> = {
      active: 'Active', expired: 'Expired', depleted: 'Depleted', void: 'Void',
    };
    return map[status] || status;
  }

  openIssueGiftCardModal() {
    this.partySearchContext = 'issue';
    this.resetPartySearch();
    this.issueAmount = null;
    this.customIssueAmount = null;
    this.issueForm.reset({ note: '' });
    this.modalRef = this.modalService.open(this.issueGiftCardModal, { size: 'md', backdrop: 'static' });
  }

  openAdjustPointsModal(record?: LoyaltyPointsRecord) {
    this.partySearchContext = 'adjust';
    this.resetPartySearch();
    this.adjustForm.reset({ delta: 0, reason: '' });
    if (record) {
      this.selectedParty = { id: record.partyId, partyName: record.partyName, contact: record.mobile };
      this.partySearchText = record.partyName || '—';
    }
    this.modalRef = this.modalService.open(this.adjustPointsModal, { size: 'md', backdrop: 'static' });
  }

  openGiftCardDetail(card: GiftCardRecord) {
    this.selectedGiftCard = card;
    this.modalRef = this.modalService.open(this.giftCardDetailModal, { size: 'sm' });
  }

  openPointHistory(record: LoyaltyPointsRecord) {
    this.selectedLoyaltyRecord = record;
    this.pointHistory = this.loyaltyService.getPointHistory(record.partyId);
    this.modalRef = this.modalService.open(this.pointHistoryModal, { size: 'md' });
  }

  voidGiftCard(card: GiftCardRecord) {
    if (card.status === 'void') return;
    if (!confirm(`Void gift card ${card.cardNumber}?`)) return;
    if (this.loyaltyService.voidGiftCard(card.id)) {
      this.toast.show('Success', 'Gift card voided', 'success');
      this.refreshGiftCardsWithRepair();
    }
  }

  selectIssueAmount(amount: number) {
    this.issueAmount = amount;
    this.customIssueAmount = null;
  }

  getEffectiveIssueAmount(): number {
    return this.issueAmount ?? this.customIssueAmount ?? 0;
  }

  submitIssueGiftCard() {
    if (!this.selectedParty) {
      this.toast.show('Validation', 'Please select a customer', 'warning');
      return;
    }
    const amount = this.getEffectiveIssueAmount();
    const min = this.settingsForm.get('min_load')?.value ?? 10;
    const max = this.settingsForm.get('max_load')?.value ?? 5000;
    if (amount < min || amount > max) {
      this.toast.show('Validation', `Amount must be between ${min} and ${max}`, 'warning');
      return;
    }

    const record = this.loyaltyService.issueGiftCard({
      partyId: this.getPartyId(this.selectedParty),
      partyName: this.getPartyName(this.selectedParty),
      mobile: this.getPartyMobile(this.selectedParty),
      amount,
      note: this.issueForm.get('note')?.value || '',
      prefix: this.settingsForm.get('card_prefix')?.value || 'GC-',
      expiryMonths: this.settingsForm.get('expiry_months')?.value || 12,
    });

    this.toast.show('Success', `Gift card ${record.cardNumber} issued`, 'success');
    this.modalRef?.close();
    this.refreshGiftCardsWithRepair();
  }

  submitAdjustPoints() {
    if (!this.selectedParty) {
      this.toast.show('Validation', 'Please select a customer', 'warning');
      return;
    }
    if (this.adjustForm.invalid) {
      this.toast.show('Validation', 'Please enter points and reason', 'warning');
      return;
    }
    const delta = this.adjustForm.get('delta')?.value;
    if (delta === 0) {
      this.toast.show('Validation', 'Points adjustment cannot be zero', 'warning');
      return;
    }

    this.loyaltyService.adjustPoints({
      partyId: this.getPartyId(this.selectedParty),
      partyName: this.getPartyName(this.selectedParty),
      mobile: this.getPartyMobile(this.selectedParty),
      delta,
      reason: this.adjustForm.get('reason')?.value,
      pointsExpiryDays: this.settingsForm.get('points_expiry_days')?.value ?? 365,
    });

    this.toast.show('Success', 'Points adjusted successfully', 'success');
    this.modalRef?.close();
    this.refreshLoyaltyRecordsWithRepair();
  }

  closeModal() { this.modalRef?.dismiss(); }

  resetPartySearch() {
    this.selectedParty = null;
    this.partySearchText = '';
    this.filteredParties = [];
    this.showPartyDropdown = false;
    this.activePartyIndex = -1;
  }

  onPartyInputFocus() {
    this.showPartyDropdown = true;
    if (!this.partySearchText.trim()) this.fetchParties('');
    setTimeout(() => this.partySearchInput?.nativeElement?.focus(), 0);
  }

  onPartySearchInput() {
    this.selectedParty = null;
    this.showPartyDropdown = true;
    this.partySearch$.next(this.partySearchText);
  }

  fetchParties(term: string) {
    this.partyLoading = true;
    this.api.post<any>(`/party/list-party/s=${encodeURIComponent(term)}/`, {
      company: this.api.getUserCompany(),
      type: 1,
    }).subscribe({
      next: res => {
        this.partyLoading = false;
        this.filteredParties = res?.status === 200 ? res.data || [] : [];
        this.activePartyIndex = this.filteredParties.length ? 0 : -1;
      },
      error: () => {
        this.partyLoading = false;
        this.filteredParties = [];
      },
    });
  }

  selectParty(party: any) {
    this.selectedParty = party;
    this.partySearchText = this.getPartyName(party);
    this.showPartyDropdown = false;
    this.activePartyIndex = -1;
  }

  clearPartySelection() { this.resetPartySearch(); }

  onPartyKeydown(event: KeyboardEvent) {
    if (!this.showPartyDropdown) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        this.showPartyDropdown = true;
        this.fetchParties(this.partySearchText);
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.filteredParties.length) {
          this.activePartyIndex = Math.min(this.activePartyIndex + 1, this.filteredParties.length - 1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.filteredParties.length) {
          this.activePartyIndex = Math.max(this.activePartyIndex - 1, 0);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activePartyIndex >= 0 && this.filteredParties[this.activePartyIndex]) {
          this.selectParty(this.filteredParties[this.activePartyIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.showPartyDropdown = false;
        this.activePartyIndex = -1;
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.party-search-select')) {
      this.showPartyDropdown = false;
    }
  }
}
