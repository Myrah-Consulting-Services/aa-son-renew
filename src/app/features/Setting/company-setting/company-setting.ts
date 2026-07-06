import { Component, OnInit, ViewChild, TemplateRef, HostListener } from '@angular/core';
import { Api } from '../../../core/services/api';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { NgbModal, NgbModalRef, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { InvoiceSetting } from '../invoice-setting/invoice-setting';
import { LoyaltyGiftCards } from '../loyalty-gift-cards/loyalty-gift-cards';
import { MarketplaceSync } from '../marketplace-sync/marketplace-sync';

@Component({
  selector: 'app-company-setting',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, LoyaltyGiftCards, MarketplaceSync],
  templateUrl: './company-setting.html',
  styleUrl: './company-setting.scss'
})
export class CompanySetting implements OnInit {
  invoiceForm!: FormGroup;
  private modalRef?: NgbModalRef;
  @ViewChild('historyModal', { static: true }) historyModal!: TemplateRef<any>;
  @ViewChild('logoFileInput') logoFileInput!: any;
  @ViewChild('signatureFileInput') signatureFileInput!: any;
  historyRecords: any[] = [];
  
  // Tab functionality
  activeTab: string = 'company';
  companyForm!: FormGroup;
  paymentForm!: FormGroup;
  paymentSaving = false;
  expandedProvider: string | null = 'razorpay';
  enabledPaymentMethods: string[] = ['cash', 'card', 'upi'];
  visibleSecrets: Record<string, boolean> = {};

  paymentMethods = [
    { id: 'cash', label: 'Cash', icon: 'bi bi-cash-stack' },
    { id: 'card', label: 'Card', icon: 'bi bi-credit-card-2-front' },
    { id: 'upi', label: 'UPI', icon: 'bi bi-phone' },
    { id: 'netbanking', label: 'Net Banking', icon: 'bi bi-bank' },
    { id: 'wallet', label: 'Wallet', icon: 'bi bi-wallet2' },
    { id: 'cheque', label: 'Cheque', icon: 'bi bi-journal-check' },
  ];

  paymentProviders = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      type: 'Payment Gateway',
      icon: 'bi bi-lightning-fill',
      color: 'linear-gradient(135deg, #3395ff 0%, #072654 100%)',
      docsUrl: 'https://razorpay.com/docs/api/',
      fields: [
        { key: 'api_key', label: 'Key ID', placeholder: 'rzp_live_xxxxxxxx', required: true, secret: false },
        { key: 'api_secret', label: 'Key Secret', placeholder: 'Enter secret key', required: true, secret: true },
        { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'Optional webhook secret', secret: true, hint: 'For payment status callbacks' },
      ],
    },
    {
      id: 'pinelabs',
      name: 'Pine Labs',
      type: 'POS Terminal',
      icon: 'bi bi-cpu',
      color: 'linear-gradient(135deg, #00a651 0%, #006837 100%)',
      docsUrl: 'https://developer.pinelabs.com/',
      fields: [
        { key: 'merchant_id', label: 'Merchant ID', placeholder: 'Merchant ID from Pine Labs', required: true, secret: false },
        { key: 'api_key', label: 'Security Token / API Key', placeholder: 'Enter security token', required: true, secret: true },
        { key: 'client_id', label: 'Client ID', placeholder: 'POS client identifier', secret: false },
        { key: 'store_id', label: 'Store ID', placeholder: 'Store / outlet ID', secret: false, hint: 'Maps to your physical outlet' },
      ],
    },
    {
      id: 'paytm',
      name: 'Paytm',
      type: 'Payment Gateway',
      icon: 'bi bi-currency-rupee',
      color: 'linear-gradient(135deg, #00baf2 0%, #002970 100%)',
      docsUrl: 'https://business.paytm.com/docs',
      fields: [
        { key: 'merchant_id', label: 'Merchant ID', placeholder: 'Paytm merchant ID', required: true, secret: false },
        { key: 'api_key', label: 'Merchant Key', placeholder: 'Enter merchant key', required: true, secret: true },
      ],
    },
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'Payment Gateway',
      icon: 'bi bi-stripe',
      color: 'linear-gradient(135deg, #635bff 0%, #0a2540 100%)',
      docsUrl: 'https://stripe.com/docs/api',
      fields: [
        { key: 'api_key', label: 'Publishable Key', placeholder: 'pk_live_xxxxxxxx', required: true, secret: false },
        { key: 'api_secret', label: 'Secret Key', placeholder: 'sk_live_xxxxxxxx', required: true, secret: true },
      ],
    },
  ];
  
  // Logo management
  companyLogo: string | null = null;
  
  // Signature management
  companySignature: string | null = null;
  currencies = [
    { id: 1, code: 'AED', name: 'UAE Dirham' },
    { id: 2, code: 'USD', name: 'US Dollar' },
    { id: 3, code: 'INR', name: 'Indian Rupee' },
    { id: 4, code: 'EUR', name: 'Euro' },
    { id: 5, code: 'GBP', name: 'British Pound' },
    { id: 6, code: 'SAR', name: 'Saudi Riyal' },
    { id: 7, code: 'QAR', name: 'Qatari Riyal' },
    { id: 8, code: 'OMR', name: 'Omani Rial' },
    { id: 9, code: 'KWD', name: 'Kuwaiti Dinar' },
    { id: 10, code: 'BHD', name: 'Bahraini Dinar' },
    { id: 11, code: 'PKR', name: 'Pakistani Rupee' },
    { id: 12, code: 'BDT', name: 'Bangladeshi Taka' },
    { id: 13, code: 'LKR', name: 'Sri Lankan Rupee' },
    { id: 14, code: 'CNY', name: 'Chinese Yuan' },
    { id: 15, code: 'JPY', name: 'Japanese Yen' },
    { id: 16, code: 'CAD', name: 'Canadian Dollar' },
    { id: 17, code: 'AUD', name: 'Australian Dollar' },
    { id: 18, code: 'SGD', name: 'Singapore Dollar' },
    { id: 19, code: 'ZAR', name: 'South African Rand' },
    { id: 20, code: 'TRY', name: 'Turkish Lira' },
    { id: 21, code: 'RUB', name: 'Russian Ruble' },
    { id: 22, code: 'CHF', name: 'Swiss Franc' },
    { id: 23, code: 'MYR', name: 'Malaysian Ringgit' },
    { id: 24, code: 'THB', name: 'Thai Baht' },
    { id: 25, code: 'IDR', name: 'Indonesian Rupiah' },
    { id: 26, code: 'PHP', name: 'Philippine Peso' },
    { id: 27, code: 'HKD', name: 'Hong Kong Dollar' },
    { id: 28, code: 'KRW', name: 'South Korean Won' },
    { id: 29, code: 'SEK', name: 'Swedish Krona' },
    { id: 30, code: 'DKK', name: 'Danish Krone' },
    { id: 31, code: 'NOK', name: 'Norwegian Krone' },
    { id: 32, code: 'PLN', name: 'Polish Zloty' },
    { id: 33, code: 'CZK', name: 'Czech Koruna' },
    { id: 34, code: 'HUF', name: 'Hungarian Forint' },
    { id: 35, code: 'ILS', name: 'Israeli Shekel' },
    { id: 36, code: 'EGP', name: 'Egyptian Pound' },
    { id: 37, code: 'NGN', name: 'Nigerian Naira' },
    { id: 38, code: 'BRL', name: 'Brazilian Real' },
    { id: 39, code: 'MXN', name: 'Mexican Peso' },
    { id: 40, code: 'ARS', name: 'Argentine Peso' },
    { id: 41, code: 'COP', name: 'Colombian Peso' },
    { id: 42, code: 'CLP', name: 'Chilean Peso' },
    { id: 43, code: 'NZD', name: 'New Zealand Dollar' },
    { id: 44, code: 'VND', name: 'Vietnamese Dong' },
    { id: 45, code: 'TWD', name: 'Taiwan Dollar' },
    { id: 46, code: 'MAD', name: 'Moroccan Dirham' },
    { id: 47, code: 'JOD', name: 'Jordanian Dinar' },
    { id: 48, code: 'DZD', name: 'Algerian Dinar' },
    { id: 49, code: 'TND', name: 'Tunisian Dinar' },
    { id: 50, code: 'KES', name: 'Kenyan Shilling' },
    { id: 51, code: 'TZS', name: 'Tanzanian Shilling' },
    { id: 52, code: 'GHS', name: 'Ghanaian Cedi' },
    { id: 53, code: 'ETB', name: 'Ethiopian Birr' },
    { id: 54, code: 'UAH', name: 'Ukrainian Hryvnia' },
    { id: 55, code: 'BGN', name: 'Bulgarian Lev' },
    { id: 56, code: 'HRK', name: 'Croatian Kuna' },
    { id: 57, code: 'RON', name: 'Romanian Leu' },
    { id: 58, code: 'ISK', name: 'Icelandic Krona' },
    { id: 59, code: 'KZT', name: 'Kazakhstani Tenge' },
    { id: 60, code: 'QAR', name: 'Qatari Riyal' },
    { id: 61, code: 'SAR', name: 'Saudi Riyal' },
    { id: 62, code: 'BHD', name: 'Bahraini Dinar' },
    { id: 63, code: 'OMR', name: 'Omani Rial' },
    { id: 64, code: 'KWD', name: 'Kuwaiti Dinar' },
    { id: 65, code: 'ZWL', name: 'Zimbabwean Dollar' },
    { id: 66, code: 'BWP', name: 'BWP - Botswana Pula' }

  ];

  // Currency dropdown properties
  showDropdown = false;
  filteredCurrencies: any[] = [];
  currencySearchText = '';

  // Conversion currency dropdown properties
  showConversionDropdown = false;
  filteredConversionCurrencies: any[] = [];
  conversionCurrencySearchText = '';

  constructor(private api: Api,
     private fb: FormBuilder,
    private toastr: ToastService,
    private modalService: NgbModal) {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    this.initializeForms();
  }

  initializeForms() {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    this.invoiceForm = this.fb.group({
      invoice_no: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      prefix: [''],
      suffix: [''],
      start_date: [today],
      end_date: [today],
      showroom_discount: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      curency_conversion: ['2', Validators.required],
      currency_conversion_rate: [1, [Validators.required, Validators.min(0)]],
      is_currency_conversion: [false],
      default_currency: [[]], // Changed to array for multiple selection
      is_default_currency: [false],
       // Changed to array for multiple selection
      id:[],
      company:[this.api.getCompanyId()]
    });

    this.companyForm = this.fb.group({
      business_name: ['', Validators.required],
      business_name_arabic: [''],
      business_logo: [''],
      signature: [''],
      phone_no: ['', Validators.required],
      alternate_business_no: [''],
      email: ['', [Validators.required]],
      alternate_email: [''],
      address1: [''],
      address2: [''],
      po_box: [''],
      license_number: [''],
      license_type: [''],
      issued_by: [''],
      license_expiry: [],
      owner_name: [''],
      owner_nationality: [''],
      owner_emirates_id: [''],
      vat_trn: [''],
      corporate_tax_trn: [''],
      vat_registered: [false]
    });

    const paymentControls: Record<string, any> = {
      default_pos_provider: [''],
      pos_terminal_id: [''],
      enabled_methods: [[]],
    };
    this.paymentProviders.forEach(provider => {
      paymentControls[`${provider.id}_enabled`] = [false];
      provider.fields.forEach(field => {
        paymentControls[`${provider.id}_${field.key}`] = [''];
      });
    });
    this.paymentForm = this.fb.group(paymentControls);
  }

  ngOnInit() {
    this.getCompanySetting();
    this.filteredCurrencies = [...this.currencies];
    this.filteredConversionCurrencies = [...this.currencies];
    this.getcompany();
    this.getPaymentSettings();
    this.showDropdown = false;
    this.showConversionDropdown = false;
  }

  getCompanyLogo(){
    this.api.get('/company/get-company-logo/'+this.api.getUserCompany()+'/').subscribe((res: any) => {
      console.log('Company Logo:', res);
      if (res.status === 200 && res.data) {
        this.companyLogo = res.data;
      }
    });
  }

  onInvoiceNoKeyPress(event: KeyboardEvent): void {
    // Allow only numeric keys (0-9), backspace, delete, arrow keys, tab, enter
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    const isNumeric = /[0-9]/.test(event.key);
    const isAllowedKey = allowedKeys.includes(event.key);
    
    if (!isNumeric && !isAllowedKey) {
      event.preventDefault(); // Block the character from being entered
    }
  }
  getcompany(){
    this.api.get('/company/get-company/'+this.api.getUserCompany()+'/').subscribe((res: any) => {
      console.log('Company:', res);
      if (res.status === 200 && res.data) {
        this.patchCompanyForm(res.data);
      }
    });
  }

  patchCompanyForm(companyData: any) {
    this.companyForm.patchValue({
      business_name: companyData.business_name || '',
      business_name_arabic: companyData.business_name_arabic || '',
      phone_no: companyData.phone_no || '',
      alternate_business_no: companyData.alternate_business_no || '',
      email: companyData.email || '',
      alternate_email: companyData.alternate_email || '',
      address1: companyData.address1 || '',
      address2: companyData.address2 || '',
      po_box: companyData.po_box || '',
      license_number: companyData.license_number || '',
      license_type: companyData.license_type || '',
      issued_by: companyData.issued_by || '',
      license_expiry: companyData.license_expiry ? this.formatDate(companyData.license_expiry) : null,
      owner_name: companyData.owner_name || '',
      owner_nationality: companyData.owner_nationality || '',
      owner_emirates_id: companyData.owner_emirates_id || '',
      vat_trn: companyData.vat_trn || '',
      corporate_tax_trn: companyData.corporate_tax_trn || '',
      vat_registered: companyData.vat_registered || false,
      business_logo: companyData.business_logo ? companyData.business_logo : '',
      signature: companyData.signature ? companyData.signature : ''
    });

    // Set the display properties for logo and signature
    this.companyLogo = companyData.business_logo || null;
    this.companySignature = companyData.signature || null;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  saveCompanySettings() {
    if (this.companyForm.valid) {
      const formData = this.companyForm.value;
      console.log('Saving company settings:', formData);
      this.api.put('/company/update_business_info/'+this.api.getUserCompany()+'/', formData).subscribe((res: any) => {
        if (res && res.status === 200 && res.data) {
          this.getcompany();
          this.toastr.show('Success', 'Company setting updated successfully', 'success');
        }else{
          this.toastr.show('Error', res.error, 'danger');
        }
      });
      // Add your save API call here
      // this.api.post('/company/update-company/', formData).subscribe(...)
    }
  }

 

  







 


 
  
 

  getCompanySetting() {
    this.api.get('/invoice/get-invoice-setting/'+this.api.getUserCompany()+'/').subscribe((res: any) => {
      if (res && res.status === 200 && res.data) {
        // Handle default_currency field - convert to array if it's a single value
        
        
        this.invoiceForm.patchValue({
          invoice_no: res.data.invoice_no?.toString() || '',
          prefix: res.data.prefix || '',
          suffix: res.data.suffix || '',
          showroom_discount: res.data.showroom_discount || 0,
          curency_conversion: res.data.curency_conversion,
          currency_conversion_rate: res.data.currency_conversion_rate || 0,
          is_currency_conversion: res.data.is_currency_conversion !== undefined ? res.data.is_currency_conversion : true,
          default_currency: res.data.default_currency,
          is_default_currency: res.data.is_default_currency,
          id: res.data.id,
          start_date: res.data.start_date,
          end_date: res.data.end_date 
        });
        
        // Set the currency search text if default_currency exists
        if (res.data.default_currency) {
          const selectedCurrency = this.currencies.find(c => c.id === res.data.default_currency);
          if (selectedCurrency) {
            this.currencySearchText = `${selectedCurrency.code} - ${selectedCurrency.name}`;
          }
        }

        // Set the conversion currency search text if curency_conversion exists
        if (res.data.curency_conversion) {
          const selectedConversionCurrency = this.currencies.find(c => c.id === res.data.curency_conversion);
          if (selectedConversionCurrency) {
            this.conversionCurrencySearchText = `${selectedConversionCurrency.code} - ${selectedConversionCurrency.name}`;
          }
        }
      }
    });
  }

  get invoiceOutput(): string {
    const { prefix, invoice_no, suffix } = this.invoiceForm.value;
    return `${prefix || ''}${invoice_no?.toString() || ''}${suffix || ''}`;
  }

  saveInvoiceSetting() {
    console.log('Saving invoice settings with form data:', this.invoiceForm.value);
    
    this.api.put('/invoice/update-invoice-setting/', this.invoiceForm.value).subscribe((res: any) => {
      if (res && res.status === 200 && res.data) {
        this.getCompanySetting();
        this.toastr.show('Success', 'Invoice setting updated successfully', 'success');
      } else {
        this.toastr.show('Error', res.error || 'Failed to update settings', 'danger');
      }
    }, (error) => {
      console.error('Error saving invoice settings:', error);
      this.toastr.show('Error', 'Failed to update settings', 'danger');
    });
  }



  onCurrencyConversionToggle() {
    if (!this.invoiceForm.get('is_currency_conversion')?.value) {
      this.invoiceForm.get('currency_conversion_rate')?.setValue(0);
    }
  }

  openHistoryModal(a:any) {
    // Open the history modal using template reference
    this.modalRef = this.modalService.open(a, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    this.viewhistory();
    
    // Handle modal result
    this.modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
      },
      (reason) => {
        console.log('Modal dismissed with reason:', reason);
      }
    );
  }
  viewhistory(){
    this.api.get('/invoice/currency-conversion-logs/1/').subscribe((res: any) => {
      console.log('Currency conversion history:', res);
      if (res && res.status === 200 && res.data) {
        this.historyRecords = res.data;
      } else {
        this.historyRecords = [];
      }
    });
  }

  // getCurrencyName(currencyId: number): string {
  //   const currency = this.currencies.find((c: any) => c.id === currencyId);
  //   return currency ? currency.code : `Currency ${currencyId}`;
  // }

  closeModal(a:any) {
    this.modalRef?.dismiss();
  }

  switchTab(tabName: string) {
    this.activeTab = tabName;
  }

  // Payment settings methods
  getPaymentSettings() {
    const companyId = this.api.getUserCompany();
    this.api.get('/company/get-payment-setting/' + companyId + '/').subscribe({
      next: (res: any) => {
        if (res?.status === 200 && res.data) {
          this.patchPaymentForm(res.data);
        }
      },
      error: () => {
        const stored = localStorage.getItem(`payment_settings_${companyId}`);
        if (stored) {
          try {
            this.patchPaymentForm(JSON.parse(stored));
          } catch { /* ignore */ }
        }
      },
    });
  }

  patchPaymentForm(data: any) {
    const patch: Record<string, any> = {
      default_pos_provider: data.default_pos_provider || '',
      pos_terminal_id: data.pos_terminal_id || '',
    };
    this.enabledPaymentMethods = data.enabled_methods?.length
      ? [...data.enabled_methods]
      : ['cash', 'card', 'upi'];

    this.paymentProviders.forEach(provider => {
      const providerData = data.providers?.[provider.id] || data[provider.id] || {};
      patch[`${provider.id}_enabled`] = providerData.enabled ?? false;
      provider.fields.forEach(field => {
        patch[`${provider.id}_${field.key}`] = providerData[field.key] || '';
      });
    });

    this.paymentForm.patchValue(patch);
    if (data.default_expanded) {
      this.expandedProvider = data.default_expanded;
    }
  }

  isPaymentMethodEnabled(methodId: string): boolean {
    return this.enabledPaymentMethods.includes(methodId);
  }

  togglePaymentMethod(methodId: string) {
    const idx = this.enabledPaymentMethods.indexOf(methodId);
    if (idx >= 0) {
      this.enabledPaymentMethods = this.enabledPaymentMethods.filter(m => m !== methodId);
    } else {
      this.enabledPaymentMethods = [...this.enabledPaymentMethods, methodId];
    }
  }

  toggleProviderExpand(providerId: string) {
    this.expandedProvider = this.expandedProvider === providerId ? null : providerId;
  }

  onProviderToggle(providerId: string) {
    const enabled = this.paymentForm.get(`${providerId}_enabled`)?.value;
    if (enabled) {
      this.expandedProvider = providerId;
    } else if (this.paymentForm.get('default_pos_provider')?.value === providerId) {
      this.paymentForm.patchValue({ default_pos_provider: '' });
    }
  }

  isProviderConfigured(providerId: string): boolean {
    if (!this.paymentForm.get(`${providerId}_enabled`)?.value) return false;
    const provider = this.paymentProviders.find(p => p.id === providerId);
    if (!provider) return false;
    return provider.fields
      .filter(f => f.required)
      .every(f => !!this.paymentForm.get(`${providerId}_${f.key}`)?.value?.trim());
  }

  secretKey(providerId: string, fieldKey: string): string {
    return `${providerId}_${fieldKey}`;
  }

  isSecretVisible(providerId: string, fieldKey: string): boolean {
    return !!this.visibleSecrets[this.secretKey(providerId, fieldKey)];
  }

  toggleSecretVisibility(providerId: string, fieldKey: string) {
    const key = this.secretKey(providerId, fieldKey);
    this.visibleSecrets[key] = !this.visibleSecrets[key];
  }

  testConnection(providerId: string) {
    const provider = this.paymentProviders.find(p => p.id === providerId);
    if (!provider) return;

    const missing = provider.fields
      .filter(f => f.required && !this.paymentForm.get(`${providerId}_${f.key}`)?.value?.trim());
    if (missing.length) {
      this.toastr.show('Validation', `Please fill in ${missing.map(f => f.label).join(', ')}`, 'warning');
      return;
    }

    this.toastr.show('Connection Test', `${provider.name} credentials saved locally. Backend verification pending.`, 'success');
  }

  buildPaymentPayload() {
    const providers: Record<string, any> = {};
    this.paymentProviders.forEach(provider => {
      const entry: Record<string, any> = {
        enabled: this.paymentForm.get(`${provider.id}_enabled`)?.value ?? false,
      };
      provider.fields.forEach(field => {
        entry[field.key] = this.paymentForm.get(`${provider.id}_${field.key}`)?.value || '';
      });
      providers[provider.id] = entry;
    });

    return {
      default_pos_provider: this.paymentForm.get('default_pos_provider')?.value || '',
      pos_terminal_id: this.paymentForm.get('pos_terminal_id')?.value || '',
      enabled_methods: this.enabledPaymentMethods,
      providers,
    };
  }

  savePaymentSettings() {
    const payload = this.buildPaymentPayload();
    const companyId = this.api.getUserCompany();
    this.paymentSaving = true;

    this.api.put('/company/update-payment-setting/' + companyId + '/', payload).subscribe({
      next: (res: any) => {
        this.paymentSaving = false;
        if (res?.status === 200) {
          this.toastr.show('Success', 'Payment settings saved successfully', 'success');
        } else {
          localStorage.setItem(`payment_settings_${companyId}`, JSON.stringify(payload));
          this.toastr.show('Saved', 'Payment settings saved locally', 'success');
        }
      },
      error: () => {
        localStorage.setItem(`payment_settings_${companyId}`, JSON.stringify(payload));
        this.paymentSaving = false;
        this.toastr.show('Saved', 'Payment settings saved locally (API unavailable)', 'success');
      },
    });
  }

  // Logo management methods
  onEditLogo() {
    // Trigger logo file input click
    if (this.logoFileInput) {
      this.logoFileInput.nativeElement.click();
    }
  }

  onRemoveLogo() {
    // Call API to remove logo from backend
    this.api.get('/company/remove-logo/' + this.api.getUserCompany() + '/').subscribe((res: any) => {
      if (res && res.status === 200) {
        this.companyLogo = null;
        this.toastr.show('Success', 'Company logo removed successfully', 'success');
        // Refresh company data to update the form
        this.getcompany();
      } else {
        this.toastr.show('Error', res.error || 'Failed to remove logo', 'danger');
      }
    }, (error) => {
      this.toastr.show('Error', 'Failed to remove logo', 'danger');
    });
  }

  onLogoFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastr.show('Error', 'Please select a valid image file', 'danger');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.show('Error', 'Image size should be less than 5MB', 'danger');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyLogo = e.target.result;
      };
      reader.readAsDataURL(file);

      // Upload logo to backend
      this.uploadLogo(file);
    }
  }

  uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);

    this.api.post2('/company/change-logo/' + this.api.getUserCompany() + '/', formData).subscribe((res: any) => {
      if (res && res.status === 200) {
        this.toastr.show('Success', 'Company logo updated successfully', 'success');
        // Refresh company data to get updated logo URL
        this.getcompany();
      } else {
        this.toastr.show('Error', res.error || 'Failed to update logo', 'danger');
        // Revert the preview if upload failed
        this.companyLogo = null;
      }
    }, (error) => {
      this.toastr.show('Error', 'Failed to update logo', 'danger');
      // Revert the preview if upload failed
      this.companyLogo = null;
    });
  }

  // Signature management methods
  onEditSignature() {
    // Trigger signature file input click
    if (this.signatureFileInput) {
      this.signatureFileInput.nativeElement.click();
    }
  }

  onRemoveSignature() {
    // Call API to remove signature from backend
    this.api.get('/company/remove-signature/' + this.api.getUserCompany() + '/').subscribe((res: any) => {
      if (res && res.status === 200) {
        this.companySignature = null;
        this.toastr.show('Success', 'Digital signature removed successfully', 'success');
        // Refresh company data to update the form
        this.getcompany();
      } else {
        this.toastr.show('Error', res.error || 'Failed to remove signature', 'danger');
      }
    }, (error) => {
      this.toastr.show('Error', 'Failed to remove signature', 'danger');
    });
  }

  onSignatureFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastr.show('Error', 'Please select a valid image file', 'danger');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.show('Error', 'Image size should be less than 5MB', 'danger');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companySignature = e.target.result;
      };
      reader.readAsDataURL(file);

      // Upload signature to backend
      this.uploadSignature(file);
    }
  }

  uploadSignature(file: File) {
    const formData = new FormData();
    formData.append('signature', file);

    this.api.post2('/company/change-signature/' + this.api.getUserCompany() + '/', formData).subscribe((res: any) => {
      if (res && res.status === 200) {
        this.toastr.show('Success', 'Digital signature updated successfully', 'success');
        // Refresh company data to get updated signature URL
        this.getcompany();
      } else {
        this.toastr.show('Error', res.error || 'Failed to update signature', 'danger');
        // Revert the preview if upload failed
        this.companySignature = null;
      }
    }, (error) => {
      this.toastr.show('Error', 'Failed to update signature', 'danger');
      // Revert the preview if upload failed
      this.companySignature = null;
    });
  }

  // Currency dropdown methods
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.simple-currency-select')) {
      this.showDropdown = false;
      console.log('Clicked outside, closing dropdown');
    }
    if (!target.closest('.simple-currency-select')) {
      this.showConversionDropdown = false;
      console.log('Clicked outside, closing conversion dropdown');
    }
  }

  onInputFocus() {
    this.showDropdown = true;
    this.filteredCurrencies = [...this.currencies];
    console.log('Input focused, showing dropdown with', this.filteredCurrencies.length, 'currencies');
  }

  filterCurrencies() {
    console.log('Filtering currencies, search text:', this.currencySearchText);
    if (!this.currencySearchText.trim()) {
      this.filteredCurrencies = [...this.currencies];
    } else {
      this.filteredCurrencies = this.currencies.filter(currency => 
        currency.code.toLowerCase().includes(this.currencySearchText.toLowerCase()) || 
        currency.name.toLowerCase().includes(this.currencySearchText.toLowerCase())
      );
    }
    console.log('Filtered currencies count:', this.filteredCurrencies.length);
  }

  selectCurrency(currency: any) {
    this.invoiceForm.patchValue({
      default_currency: currency.id
    });
    this.currencySearchText = `${currency.code} - ${currency.name}`;
    this.showDropdown = false;
  }

  clearCurrency() {
    this.invoiceForm.patchValue({
      default_currency: null
    });
    this.currencySearchText = '';
    this.showDropdown = false;
  }

  // Conversion currency methods
  onConversionInputFocus() {
    this.showConversionDropdown = true;
    this.filteredConversionCurrencies = [...this.currencies];
    console.log('Conversion input focused, showing dropdown with', this.filteredConversionCurrencies.length, 'currencies');
  }

  filterConversionCurrencies() {
    console.log('Filtering conversion currencies, search text:', this.conversionCurrencySearchText);
    if (!this.conversionCurrencySearchText.trim()) {
      this.filteredConversionCurrencies = [...this.currencies];
    } else {
      this.filteredConversionCurrencies = this.currencies.filter(currency => 
        currency.code.toLowerCase().includes(this.conversionCurrencySearchText.toLowerCase()) || 
        currency.name.toLowerCase().includes(this.conversionCurrencySearchText.toLowerCase())
      );
    }
    console.log('Filtered conversion currencies count:', this.filteredConversionCurrencies.length);
  }

  selectConversionCurrency(currency: any) {
    this.invoiceForm.patchValue({
      curency_conversion: currency.id
    });
    this.conversionCurrencySearchText = `${currency.code} - ${currency.name}`;
    this.showConversionDropdown = false;
  }

  isConversionCurrencySelected(currency: any): boolean {
    return this.invoiceForm.get('curency_conversion')?.value === currency.id;
  }

  clearConversionCurrency() {
    this.invoiceForm.patchValue({
      curency_conversion: null
    });
    this.conversionCurrencySearchText = '';
    this.showConversionDropdown = false;
  }

  getSelectedCurrencyCode(): string {
    const selectedId = this.invoiceForm.get('default_currency')?.value;
    if (!selectedId) return ''; // Default to AED if none selected
    
    const selectedCurrency = this.currencies.find(c => c.id === selectedId);
    return selectedCurrency ? selectedCurrency.code : '';
  }
  getSelectedCurrencyName(): string {
    const selectedId = this.invoiceForm.get('curency_conversion')?.value;
    if (!selectedId) return ''; // Default to AED if none selected
    
    const selectedCurrency = this.currencies.find(c => c.id === selectedId);
    return selectedCurrency ? selectedCurrency.code : '';
  }
  isCurrencySelected(currency: any): boolean {
    return this.invoiceForm.get('default_currency')?.value === currency.id;
  }

  getSelectedCurrencyDisplay(): string {
    const selectedId = this.invoiceForm.get('default_currency')?.value;
    if (!selectedId) return '';
    
    const selectedCurrency = this.currencies.find(c => c.id === selectedId);
    return selectedCurrency ? `${selectedCurrency.code} - ${selectedCurrency.name}` : '';
  }
}

// History Modal Content Component


