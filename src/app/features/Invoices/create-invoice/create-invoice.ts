import { Component, OnInit, OnDestroy, ElementRef, ViewChild, EventEmitter, Output, Input, Optional } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AddItem } from '../../items/add-item/add-item';
import { AddParty } from '../../parties/add-party/add-party';
import { Subscription } from 'rxjs';
import { Api } from '../../../core/services/api';
import { CreateBank } from '../../manage-money/create-bank/create-bank';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';
import { InvTemplate } from '../inv-template/inv-template';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AddItem, AddParty, CreateBank, FormsModule, InvTemplate],
  templateUrl: './create-invoice.html',
  styleUrls: ['./create-invoice.scss']
})
export class CreateInvoice implements OnInit, OnDestroy {
  @Output() warehouseChanged = new EventEmitter<any>();
  @Input() isModal: any
  @Input() editinvoiceId: any
  invoiceForm: FormGroup;
  sidebarTab: 'party' | 'items' = 'party';
  showbutton: boolean = false;
  private formChangesSubscription?: Subscription;
  private warnedItems = new Set<string>(); // Track items that have been warned
  private isProcessingQtyChange = false; // Flag to prevent recursive calls
  private isProcessingCurrencyChange = false; // Flag to prevent checkbox interference during currency changes
  private previousInvPayCurrency: number = 1; // Track last payment currency for AED↔USD conversion
  inset_data: any = {};
  currencies = [
    { id: 1, code: 'AED', name: 'AED - UAE Dirham' },
    { id: 2, code: 'USD', name: 'USD - US Dollar' },
    { id: 3, code: 'INR', name: 'INR - Indian Rupee' },
    { id: 4, code: 'EUR', name: 'EUR - Euro' },
    { id: 5, code: 'GBP', name: 'GBP - British Pound' },
    { id: 6, code: 'SAR', name: 'SAR - Saudi Riyal' },
    { id: 7, code: 'QAR', name: 'QAR - Qatari Riyal' },
    { id: 8, code: 'OMR', name: 'OMR - Omani Rial' },
    { id: 9, code: 'KWD', name: 'KWD - Kuwaiti Dinar' },
    { id: 10, code: 'BHD', name: 'BHD - Bahraini Dinar' },
    { id: 11, code: 'PKR', name: 'PKR - Pakistani Rupee' },
    { id: 12, code: 'BDT', name: 'BDT - Bangladeshi Taka' },
    { id: 13, code: 'LKR', name: 'LKR - Sri Lankan Rupee' },
    { id: 14, code: 'CNY', name: 'CNY - Chinese Yuan' },
    { id: 15, code: 'JPY', name: 'JPY - Japanese Yen' },
    { id: 16, code: 'CAD', name: 'CAD - Canadian Dollar' },
    { id: 17, code: 'AUD', name: 'AUD - Australian Dollar' },
    { id: 18, code: 'SGD', name: 'SGD - Singapore Dollar' },
    { id: 19, code: 'ZAR', name: 'ZAR - South African Rand' },
    { id: 20, code: 'TRY', name: 'TRY - Turkish Lira' },
    { id: 21, code: 'RUB', name: 'RUB - Russian Ruble' },
    { id: 22, code: 'CHF', name: 'CHF - Swiss Franc' },
    { id: 23, code: 'MYR', name: 'MYR - Malaysian Ringgit' },
    { id: 24, code: 'THB', name: 'THB - Thai Baht' },
    { id: 25, code: 'IDR', name: 'IDR - Indonesian Rupiah' },
    { id: 26, code: 'PHP', name: 'PHP - Philippine Peso' },
    { id: 27, code: 'HKD', name: 'HKD - Hong Kong Dollar' },
    { id: 28, code: 'KRW', name: 'KRW - South Korean Won' },
    { id: 29, code: 'SEK', name: 'SEK - Swedish Krona' },
    { id: 30, code: 'DKK', name: 'DKK - Danish Krone' },
    { id: 31, code: 'NOK', name: 'NOK - Norwegian Krone' },
    { id: 32, code: 'PLN', name: 'PLN - Polish Zloty' },
    { id: 33, code: 'CZK', name: 'CZK - Czech Koruna' },
    { id: 34, code: 'HUF', name: 'HUF - Hungarian Forint' },
    { id: 35, code: 'ILS', name: 'ILS - Israeli Shekel' },
    { id: 36, code: 'EGP', name: 'EGP - Egyptian Pound' },
    { id: 37, code: 'NGN', name: 'NGN - Nigerian Naira' },
    { id: 38, code: 'BRL', name: 'BRL - Brazilian Real' },
    { id: 39, code: 'MXN', name: 'MXN - Mexican Peso' },
    { id: 40, code: 'ARS', name: 'ARS - Argentine Peso' },
    { id: 41, code: 'COP', name: 'COP - Colombian Peso' },
    { id: 42, code: 'CLP', name: 'CLP - Chilean Peso' },
    { id: 43, code: 'NZD', name: 'NZD - New Zealand Dollar' },
    { id: 44, code: 'VND', name: 'VND - Vietnamese Dong' },
    { id: 45, code: 'TWD', name: 'TWD - Taiwan Dollar' },
    { id: 46, code: 'MAD', name: 'MAD - Moroccan Dirham' },
    { id: 47, code: 'JOD', name: 'JOD - Jordanian Dinar' },
    { id: 48, code: 'DZD', name: 'DZD - Algerian Dinar' },
    { id: 49, code: 'TND', name: 'TND - Tunisian Dinar' },
    { id: 50, code: 'KES', name: 'KES - Kenyan Shilling' },
    { id: 51, code: 'TZS', name: 'TZS - Tanzanian Shilling' },
    { id: 52, code: 'GHS', name: 'GHS - Ghanaian Cedi' },
    { id: 53, code: 'ETB', name: 'ETB - Ethiopian Birr' },
    { id: 54, code: 'UAH', name: 'UAH - Ukrainian Hryvnia' },
    { id: 55, code: 'BGN', name: 'BGN - Bulgarian Lev' },
    { id: 56, code: 'HRK', name: 'HRK - Croatian Kuna' },
    { id: 57, code: 'RON', name: 'RON - Romanian Leu' },
    { id: 58, code: 'ISK', name: 'ISK - Icelandic Krona' },
    { id: 59, code: 'KZT', name: 'KZT - Kazakhstani Tenge' },
    { id: 60, code: 'QAR', name: 'QAR - Qatari Riyal' },
    { id: 61, code: 'SAR', name: 'SAR - Saudi Riyal' },
    { id: 62, code: 'BHD', name: 'BHD - Bahraini Dinar' },
    { id: 63, code: 'OMR', name: 'OMR - Omani Rial' },
    { id: 64, code: 'KWD', name: 'KWD - Kuwaiti Dinar' },
    { id: 65, code: 'ZWL', name: 'ZWL - Zimbabwean Dollar' },
    { id: 66, code: 'BWP', name: 'BWP - Botswana Pula' }
  ];
  // UAE-specific data
  uaeEmirates = [
    { value: 'Dubai', label: 'Dubai' },
    { value: 'Abu Dhabi', label: 'Abu Dhabi' },
    { value: 'Sharjah', label: 'Sharjah' },
    { value: 'Ajman', label: 'Ajman' },
    { value: 'Umm Al Quwain', label: 'Umm Al Quwain' },
    { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah' },
    { value: 'Fujairah', label: 'Fujairah' }
  ];

  invoiceTypes = [
    { value: '1', label: 'Purchase Invoice' },
    { value: '2', label: 'Sales Invoice' },
    { value: '3', label: 'Credit Note' },
    { value: '4', label: 'Debit Note' },
    { value: '5', label: 'Export Invoice' }
  ];

  paymentMethods = [
    { value: 'cash', label: 'Cash', icon: 'bi-cash' },
    { value: 'bank', label: 'Bank Transfer', icon: 'bi-bank' },
    { value: 'cheque', label: 'Cheque', icon: 'bi-card-text' },
    { value: 'card', label: 'Credit/Debit Card', icon: 'bi-credit-card' }
  ];

  unitTypes = [
    { value: 'PCS', label: 'Pieces' },
    { value: 'KG', label: 'Kilograms' },
    { value: 'METER', label: 'Meters' },
    { value: 'HOUR', label: 'Hours' },
    { value: 'DAY', label: 'Days' },
    { value: 'MONTH', label: 'Months' },
    { value: 'LITRE', label: 'Litres' },
    { value: 'BOX', label: 'Boxes' }
  ];

  // UAE Banks
  uaeBanks: any[] = [];
  editingBankId: any = null;
  modalRef: any;
  cashList: any;
  bankList: any;
  warehouseList: any;
  // GRN Selector properties
  grnSearchText: any = '';
  grnDropdownOpen: boolean = false;
  grnList: any[] = [];
  filteredGrnList: any[] = [];
  selectedGrns: any[] = [];
  dropdownHover: boolean = false;
  grnItemMapping: { [grnId: number]: number[] } = {}; // Track which items came from which GRN
  dictionary_name: any
  @ViewChild('grnInput', { static: false }) grnInputRef!: ElementRef;
  @ViewChild('amountInput', { static: false }) amountInputRef!: ElementRef;
  data: any;
  invoice_pdf_id: any;
  companyData: any;
  set_inv_type: any;
  poItem: any;
  poModalRef: any;
  invoiceData: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: Api,
    private modalService: NgbModal,
    private toast: ToastService,
    @Optional() public activeModal?: NgbActiveModal // <-- Add this
  ) {
    this.invoiceForm = this.fb.group({
      invoice_no: ['', Validators.required],
      invoice_type: ['', Validators.required],
      invoice_date: [this.getCurrentDate(), Validators.required],
      due_date: [''],
      is_description: [true],
      terms: ['30'],
      inv_tax_type: ['1', Validators.required],
      partyData: [null],
      party: [null, Validators.required],
      items: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      taxable_amt: [0],
      total_vat: [0],
      total_discount: [0],
      extra_charge: this.fb.array([]),
      round_off: [false],
      full_payment: [false],
      handover_to: [null],
      received_amount_by: ['1'],
      receivable: [0],
      received_amount: [0],
      final_total_amount: [0],
      notes: [''],
      bank: [[]],
      logo: [''],
      signature: [''],
      exchange_rate: [1],
      exchange_rate_currency: [1],
      currency: [''],
      default_currency: [''],
      merge_items: [true],
      discount_on_total: [false],
      company: [this.api.getUserCompany()],
      against_grn_inv: [],
      warehouse: [null],
      id: [''],
      customs_Payable: [0],
      customs_Payable_currency: [1],
      insurance_Payable: [0],
      insurance_Payable_currency: [1],
      demurage: [0],
      demurage_currency: [1],
      freight_Payable: [0],
      freight_Payable_currency: [1],
      port_Charge_Payable: [0],
      port_Charge_Payable_currency: [1],
      carriage_Inwards: [0],
      carriage_Inwards_currency: [1],
      thc_Charges: [0],
      thc_Charges_currency: [1],
      bank_Charge_Payable: [0],
      bank_Charge_Payable_currency: [1],
      misc_Others: [0],
      misc_Others_currency: [1],
      show_bank_details: [false],
      inv_pay_currency: [1],
      is_currency_conversion: [false],
      curency_conversion:[],
      is_converted:[false], //sales order
      is_converted_type:[false],      
      convert:[], //id 
      trans_status:[1],
      is_converted_inv:[false] //

    });
  }

  ngOnInit(): void {
    console.log('co1',this.api.getUserCompany());
    
    this.initializeForm();
    this.subscribeToFormChanges();

    this.getBanks();
    this.getCashList();

    document.addEventListener('click', this.handleClickOutside, true);
    if (this.editinvoiceId) {
      this.getparticularinv(this.editinvoiceId)
    } else {
      this.generateInvoiceNumber();
      this.loadInvoiceTypeFromUrl();
      this.getinvsettings();
      
    }
    if (this.invoiceForm.get('invoice_type')?.value == 1) {
      this.getlistwarehouse();
    }
    this.getcompany();
  }
  onConvertChange(poModal:any,inv_type:any){
    console.log('onConvertChange',inv_type);
    if(inv_type==9){
      inv_type=2;
    }else if(inv_type==8){
      inv_type=1;
    }
    if(this.invoiceForm.get('is_converted')?.value){
      this.invoiceForm.get('convert')?.setValue(this.invoiceForm.get('id')?.value);
      this.setInvoiceTypeDisplay(inv_type);
      this.showbutton = false
      this.invoiceForm.get('invoice_type')?.setValue(inv_type);
      this.poModalRef=this.modalService.open(poModal)
    }else{
      this.invoiceForm.get('convert')?.setValue(null);
      this.setInvoiceTypeDisplay(this.set_inv_type);
      this.invoiceForm.get('invoice_type')?.setValue(this.set_inv_type);
      this.showbutton = true
    }
    console.log('convert',this.invoiceForm.get('convert')?.value);
    
  }
  convertInvoice(inv_type:any){
    if(inv_type==1){
      inv_type='3';
    }else if(inv_type==2){
      inv_type='4';
    }else if(inv_type==5){
      inv_type='1';
    }else if(inv_type==6){
      inv_type='1';
    }
    if(this.invoiceForm.get('is_converted')?.value){
      this.invoiceForm.get('convert')?.setValue(this.invoiceForm.get('id')?.value);
      this.setInvoiceTypeDisplay(inv_type);
      this.showbutton = false
      this.invoiceForm.get('invoice_type')?.setValue(inv_type);
    }
    this.generateInvoiceNumber()
    console.log('convert',this.invoiceForm.get('convert')?.value,inv_type);
    
  } 
  checkpobox(check_all:any){
    if(check_all){
      this.poItem.forEach((item:any)=>{
        item.check_po = true;
      });
    }else{
      this.poItem.forEach((item:any)=>{
        item.check_po = false;
      });
    }
  }
  onPoQtychange(qty:any,user:any){
    if (qty > user.pending_qty) {
      user.qty = user.pending_qty;
      this.toast.show('Error', 'Quantity cannot exceed pending quantity', 'danger');
      return;
    }
    
    if (qty < 0) {
      user.qty = 0;
      this.toast.show('Error', 'Quantity cannot be negative', 'danger');
      return;
    }
  }
  submitPoItems(){
    let poItem = this.poItem.filter((item:any)=>item.check_po);
    // this.invoiceForm.value.items = this.poItem;
    this.generateInvoiceNumber();
    const itemsArray = this.invoiceForm.get('items') as FormArray;
    itemsArray.clear();
    if (Array.isArray(poItem)) {
      poItem.forEach((item: any) => {
        const newItem = this.createItem();
        newItem.patchValue({
          item_id: item.item_info?.id ?? item.item_id,
          itemName: item.item_info?.name ?? item.itemName,
          itemCode: item.item_info?.item_code ?? item.itemCode,
          notes: item.notes ?? '', // Added description field
          item_type: item.item_info?.item_type ?? item.item_type ?? 1,
          unit: item.item_info?.item_type === 1 ? (item.unit ?? (item.item_info?.units?.[0]?.id ?? '')) : null,
          unit_type: item.item_info?.item_type === 1 ? (item.unit_type ?? (item.item_info?.units?.[0]?.type ?? '')) : null,
          units: item.item_info?.item_type === 1 ? (item.item_info?.units ?? []) : null,
          rate: item.rate,
          disc: item.disc,
          vat: item.vat,
          vat_category: item.vat_category ?? 1, // Added VAT type field
          vat_amount: item.vat_amount,
          qty: item.qty,
          pending_qty: item.pending_qty,
          total_amt: item.total_amt,
          current_stock: item.item_info?.current_stock ?? 0,
        });
        // Set up quantity change listener for this item
        newItem.get('qty')?.valueChanges.subscribe(() => {
          this.onPoQtychange(newItem.get('qty')?.value, newItem.value);
        });
        itemsArray.push(newItem);
      });
    console.log('invoiceForm',this.invoiceForm.value);
    this.poModalRef.close();
    }
    // invoice/sale-purchase/<int:id>/
  }
  getcompany(){
    this.api.get('/company/get-company/'+this.api.getUserCompany()+'/').subscribe((res: any) => {
      console.log('Company API Response:', res);
      if (res.status === 200 && res.data) {
        this.companyData = res.data;
        this.invoiceForm.patchValue({
          logo: res.data.business_logo
        });
        console.log('Company data loaded successfully:', this.companyData);
      } else {
        console.error('Failed to load company data:', res);
      }
    }, (error) => {
      console.error('Error loading company data:', error);
    });
  }

  getparticularinv(id:any) {
    this.editinvoiceId=id
    this.invoice_pdf_id=this.editinvoiceId
    this.api.get('/invoice/invoice-detail/' + this.editinvoiceId + '/').subscribe((res: any) => {
      if (res && res.status === 200 && res.data) {
        const data = res.data;
        this.invoiceData = data;
        this.showbutton = true
        this.set_inv_type=data.invoice_type?.toString() ?? '';
        // Prevent pay-currency valueChanges from re-converting during load
        this.previousInvPayCurrency = Number(data.inv_pay_currency) || 1;
        // Patch main invoice fields (excluding items and extra_charge)
        this.invoiceForm.patchValue({
          is_converted_inv:data.is_converted_inv,
          is_converted:data.is_converted,
          is_converted_type:data.invoice_type,
          trans_status:data.trans_status,
          convert:data.id,
          invoice_no: data.invoice_no,
          invoice_type: data.invoice_type?.toString() ?? '',
          invoice_date: data.invoice_date,
          due_date: data.due_date,
          terms: data.terms,
          is_description: data.is_description,
          inv_tax_type: data.inv_tax_type ?? '1',
          partyData: null, // You may want to fetch and set party data if needed
          party: data.party,
          taxable_amt: data.taxable_amt,
          total_vat: data.total_vat,
          total_discount: data.total_discount,
          round_off: data.round_off,
          full_payment: data.full_payment,
          handover_to: data.handover_to?? data.handover_to_bank,
          received_amount_by: data.received_amount_by?.toString() ?? '1',
          receivable: data.receivable,
          received_amount: data.received_amount,
          final_total_amount: data.final_total_amount,
          notes: data.notes,
          bank: Array.isArray(data.bank) ? data.bank : (data.bank ? [data.bank] : []),
          signature: data.signature,
          exchange_rate: data.exchange_rate,
          currency: data.currency ?? 'AED',
          merge_items: data.merge_items,
          discount_on_total: data.discount_on_total,
          company: data.company,
          against_grn_inv: data.against_grn_inv ?? [],
          warehouse: data.warehouse,
          id: data.id,
          // Charge fields with currency
          customs_Payable: data.customs_Payable || 0,
          customs_Payable_currency: data.customs_Payable_currency || 1,
          insurance_Payable: data.insurance_Payable || 0,
          insurance_Payable_currency: data.insurance_Payable_currency || 1,
          demurage: data.demurage || 0,
          demurage_currency: data.demurage_currency || 1,
          freight_Payable: data.freight_Payable || 0,
          freight_Payable_currency: data.freight_Payable_currency || 1,
          port_Charge_Payable: data.port_Charge_Payable || 0,
          port_Charge_Payable_currency: data.port_Charge_Payable_currency || 1,
          carriage_Inwards: data.carriage_Inwards || 0,
          carriage_Inwards_currency: data.carriage_Inwards_currency || 1,
          thc_Charges: data.thc_Charges || 0,
          thc_Charges_currency: data.thc_Charges_currency || 1,
          bank_Charge_Payable: data.bank_Charge_Payable || 0,
          bank_Charge_Payable_currency: data.bank_Charge_Payable_currency || 1,
          misc_Others: data.misc_Others || 0,
          misc_Others_currency: data.misc_Others_currency || 1,
          show_bank_details: data.show_bank_details || false,
          inv_pay_currency: data.inv_pay_currency || 1,
          exchange_rate_currency: data.exchange_rate_currency || 1,
        });
        this.invoiceForm.get('partyData')?.patchValue({
          partyName: data.party_name,
          billingAddress: data.billing_address,
          contact: data.party_tel,
          trn: data.party_trn
        });
        if (this.invoiceForm.get('invoice_type')?.value == 1) {
          this.getlistwarehouse();
        }
        this.inset_data.is_currency_conversion = data?.is_currency_conversion;
        this.inset_data.currency_conversion_rate = data?.exchange_rate_currency || 1;
        this.inset_data.default_currency=data.default_currency
        this.inset_data.curency_conversion=data.curency_conversion

        // Set exchange_rate based on currency conversion settings
        if (this.invoiceForm.get('invoice_type')?.value == 2) {
          if (data?.is_currency_conversion && data?.currency === 2) {
            this.invoiceForm.patchValue({
              exchange_rate: data.exchange_rate_currency || 1
            });
            this.invoiceForm.get('exchange_rate')?.disable();
          } else if (data?.is_currency_conversion && data?.currency === 1) {
            // For AED currency with currency conversion enabled
            this.invoiceForm.patchValue({
              exchange_rate: data.exchange_rate_currency || 1
            });
            this.invoiceForm.get('exchange_rate')?.disable();
          } else {
            this.invoiceForm.patchValue({
              exchange_rate: data.exchange_rate || 1
            });
            this.invoiceForm.get('exchange_rate')?.enable();
          }
        }

        // Convert values back from AED to original currency if needed
        if (data?.is_currency_conversion && (data?.currency === 2 || data?.currency === 1)) {
          const conversionRate = data.exchange_rate_currency || 1;

          // Convert main amounts back to original currency
          if (data.taxable_amt) {
            if (data.currency === 2) {
              // USD: Convert from AED back to USD
              this.invoiceForm.patchValue({
                taxable_amt: Number(data.taxable_amt) / conversionRate
              });
            } else if (data.currency === 1) {
              // AED: Convert from USD back to AED (if needed)
              this.invoiceForm.patchValue({
                taxable_amt: Number(data.taxable_amt) * conversionRate
              });
            }
          }
          if (data.total_vat) {
            if (data.currency === 2) {
              this.invoiceForm.patchValue({
                total_vat: Number(data.total_vat) / conversionRate
              });
            } else if (data.currency === 1) {
              this.invoiceForm.patchValue({
                total_vat: Number(data.total_vat) * conversionRate
              });
            }
          }
          if (data.total_discount) {
            if (data.currency === 2) {
              this.invoiceForm.patchValue({
                total_discount: Number(data.total_discount) / conversionRate
              });
            } else if (data.currency === 1) {
              this.invoiceForm.patchValue({
                total_discount: Number(data.total_discount) * conversionRate
              });
            }
          }
          if (data.final_total_amount) {
            if (data.currency === 2) {
              this.invoiceForm.patchValue({
                final_total_amount: Number(data.final_total_amount) / conversionRate
              });
            } else if (data.currency === 1) {
              this.invoiceForm.patchValue({
                final_total_amount: Number(data.final_total_amount) * conversionRate
              });
            }
          }
          if (data.received_amount) {
            console.log('🔄 Received Amount Conversion Debug:', {
              originalCurrency: data.currency,
              invPayCurrency: data.inv_pay_currency,
              receivedAmount: data.received_amount,
              conversionRate: conversionRate,
              isCurrencyConversion: data.is_currency_conversion
            });

            // Convert received_amount based on inv_pay_currency and original currency
            if (data.currency === 2) {
              // Original currency was USD, but data is saved in AED
              if (data.inv_pay_currency === 2) { // If payment was received in USD
                // Convert from AED back to USD for display
                const convertedAmount = Number((Number(data.received_amount) / conversionRate).toFixed(2));
                console.log('💰 USD to USD conversion:', data.received_amount, '/', conversionRate, '=', convertedAmount);
                this.invoiceForm.patchValue({
                  received_amount: convertedAmount
                });
              } else {
                // If payment was received in AED, keep as is (already in AED)
                console.log('💰 USD to AED - keeping as is:', data.received_amount);
                this.invoiceForm.patchValue({
                  received_amount: Number(data.received_amount)
                });
              }
            } else if (data.currency === 1) {
              // Original currency was AED, data is saved in AED
              if (data.inv_pay_currency === 1) { // If payment was received in AED
                // Keep as is (already in AED)
                console.log('💰 AED to AED - keeping as is:', data.received_amount);
                this.invoiceForm.patchValue({
                  received_amount: Number(data.received_amount)
                });
              } else {
                // If payment was received in USD, convert from AED back to USD for display
                const convertedAmount = Number((Number(data.received_amount) / conversionRate).toFixed(2));
                console.log('💰 AED to USD conversion:', data.received_amount, '/', conversionRate, '=', convertedAmount);
                this.invoiceForm.patchValue({
                  received_amount: convertedAmount
                });
              }
            }
          }
          if (data.receivable) {
            console.log('🔄 Receivable Amount Conversion Debug:', {
              originalCurrency: data.currency,
              invPayCurrency: data.inv_pay_currency,
              receivableAmount: data.receivable,
              conversionRate: conversionRate,
              isCurrencyConversion: data.is_currency_conversion,
              fullPayment: data.full_payment
            });

            // If full payment is true, receivable should be 0
            if (data.full_payment) {
              console.log('💰 Full payment - setting receivable to 0');
              this.invoiceForm.patchValue({
                receivable: 0
              });
            } else {
              // Convert receivable based on inv_pay_currency and original currency
              if (data.currency === 2) {
                // Original currency was USD, but data is saved in AED
                if (data.inv_pay_currency === 2) { // If payment was received in USD
                  // Convert from AED back to USD for display
                  const convertedAmount = Number(data.receivable) / conversionRate;
                  console.log('💰 Receivable USD to USD conversion:', data.receivable, '/', conversionRate, '=', convertedAmount);
                  this.invoiceForm.patchValue({
                    receivable: convertedAmount
                  });
                } else {
                  // If payment was received in AED, keep as is (already in AED)
                  console.log('💰 Receivable USD to AED - keeping as is:', data.receivable);
                  this.invoiceForm.patchValue({
                    receivable: Number(data.receivable)
                  });
                }
              } else if (data.currency === 1) {
                // Original currency was AED, data is saved in AED
                if (data.inv_pay_currency === 1) { // If payment was received in AED
                  // Keep as is (already in AED)
                  console.log('💰 Receivable AED to AED - keeping as is:', data.receivable);
                  this.invoiceForm.patchValue({
                    receivable: Number(data.receivable)
                  });
                } else {
                  // If payment was received in USD, convert from AED back to USD for display
                  const convertedAmount = Number((Number(data.receivable) / conversionRate).toFixed(2));
                  console.log('💰 Receivable AED to USD conversion:', data.receivable, '/', conversionRate, '=', convertedAmount);
                  this.invoiceForm.patchValue({
                    receivable: convertedAmount
                  });
                }
              }
            }
          }

          // Convert charge amounts back to USD if they were in USD
          const chargeFields = [
            'customs_Payable', 'insurance_Payable', 'demurage', 'freight_Payable',
            'port_Charge_Payable', 'carriage_Inwards', 'thc_Charges', 'bank_Charge_Payable', 'misc_Others'
          ];

          chargeFields.forEach(field => {
            const currencyField = `${field}_currency`;
            if (data[field] && data[currencyField] === 2) {
              this.invoiceForm.patchValue({
                [field]: Number(data[field]) / conversionRate
              });
            }
          });
        }
        // Patch extra_charge array
        const extraChargesArray = this.invoiceForm.get('extra_charge') as FormArray;
        extraChargesArray.clear();
        if (Array.isArray(data.extra_charge)) {
          data.extra_charge.forEach((charge: any) => {
            extraChargesArray.push(this.createExtraCharge());
          });
          extraChargesArray.patchValue(data.extra_charge);
        }
        this.poItem = res.data.items;
        console.log('poItem',res.data.items);
        
        // Patch items array
        const itemsArray = this.invoiceForm.get('items') as FormArray;
        itemsArray.clear();
        if (Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            const newItem = this.createItem();
            newItem.patchValue({
              item_id: item.item_info?.id ?? item.item_id,
              itemName: item.item_info?.name ?? item.itemName,
              itemCode: item.item_info?.item_code ?? item.itemCode,
              notes: item.notes ?? '', // Added description field
              item_type: item.item_info?.item_type ?? item.item_type ?? 1,
              unit: item.item_info?.item_type === 1 ? (item.unit ?? (item.item_info?.units?.[0]?.id ?? '')) : null,
              unit_type: item.item_info?.item_type === 1 ? (item.unit_type ?? (item.item_info?.units?.[0]?.type ?? '')) : null,
              units: item.item_info?.item_type === 1 ? (item.item_info?.units ?? []) : null,
              rate: item.rate,
              disc: item.disc,
              vat: item.vat,
              vat_category: item.vat_category ?? 1, // Added VAT type field
              vat_amount: item.vat_amount,
              qty: item.qty,
              total_amt: item.total_amt,
              current_stock: item.item_info?.current_stock ?? 0
            });
            // Set up quantity change listener for this item
            newItem.get('qty')?.valueChanges.subscribe(() => {
              this.qtychange();
            });
            itemsArray.push(newItem);
          });
        }

        // Convert item amounts back to USD if currency conversion is enabled
        if (data?.is_currency_conversion && data?.currency === 2) {
          const conversionRate = data.exchange_rate_currency || 1;

          // Convert item rates and amounts back to USD
          const itemsArray = this.invoiceForm.get('items') as FormArray;
          itemsArray.controls.forEach((itemControl, index) => {
            const currentRate = itemControl.get('rate')?.value;
            const currentTotal = itemControl.get('total_amt')?.value;
            const currentVat = itemControl.get('vat_amount')?.value;

            if (currentRate) {
              itemControl.patchValue({
                rate: Number(currentRate) / conversionRate
              });
            }
            if (currentTotal) {
              itemControl.patchValue({
                total_amt: Number(currentTotal) / conversionRate
              });
            }
            if (currentVat) {
              itemControl.patchValue({
                vat_amount: Number(currentVat) / conversionRate
              });
            }
          });
        }

        this.setInvoiceTypeDisplay(data.invoice_type?.toString());
        
        // Disable received_amount field and full_payment checkbox when in edit mode
        if (this.editinvoiceId) {
          this.invoiceForm.get('received_amount')?.disable();
          this.invoiceForm.get('full_payment')?.disable();
          this.invoiceForm.get('received_amount_by')?.disable();
          this.invoiceForm.get('handover_to')?.disable();
          console.log('Payment amount field and full payment checkbox disabled for edit mode');
        }
        console.log(this.invoiceForm.value.exchange_rate_currency,'ty');
        
      }
    });
  }
  getlistwarehouse() {
    this.api.get('/items/get-warehouse/').subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.warehouseList = response.data;
          this.invoiceForm.get('warehouse')?.setValue(this.warehouseList[0].id);
          this.onWarehouseChange();
          console.log('Warehouse list:', this.warehouseList);
        }
      }
    });
  }

  getCashList() {
    this.api.get('/money/list-cash/'+ this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Cash list:', response);
        if (response.status === 200) {
          this.cashList = response.data;
          console.log('Cash list:', this.cashList);
          // this.toast.show('Success', 'Cash list loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading cash list:', error);
        this.toast.show('Error', 'Failed to load cash list', 'danger');
      }
    });
  }
  getBankList() {
    this.api.get('/money/list-bank/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Bank list:', response);
        if (response.status === 200) {
          this.bankList = response.data;
          console.log('Bank list:', this.bankList);
          // this.toast.show('Success', 'Bank list loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading bank list:', error);
        this.toast.show('Error', 'Failed to load bank list', 'danger');
      }
    });
  }
  getinvsettings() {
    this.api.get('/invoice/get-invoice-setting/'+this.api.getUserCompany()+'/').subscribe((res: any) => {

      console.log('Invoice settings:', res);
      if (res.status == 200) {
        this.inset_data = res.data;
        this.invoiceForm.get('exchange_rate_currency')?.setValue(res.data.currency_conversion_rate || 1);
        this.invoiceForm.get('is_currency_conversion')?.setValue(res.data.is_currency_conversion);
        if (res.data.is_currency_conversion) {
        
        

            console.log('working');

            this.invoiceForm.patchValue({
              currency: res.data.curency_conversion,
              default_currency: res.data.default_currency,
              exchange_rate: res.data.currency_conversion_rate || 1,
              curency_conversion:res.data.curency_conversion,
              // Keep exchange_rate as default 2.30, don't override with conversion_rate
            })
          
          }
          if(this.invoiceForm.get('invoice_type')?.value == '1'){
            this.invoiceForm.get('currency')?.setValue(this.inset_data.default_currency);
            this.invoiceForm.get('exchange_rate')?.setValue(1);
            this.invoiceForm.get('exchange_rate')?.disable();
          }else{

          
            if(this.invoiceForm.get('currency')?.value == this.inset_data.curency_conversion){
              this.invoiceForm.get('exchange_rate')?.disable();
            }else if(this.invoiceForm.get('currency')?.value == this.inset_data.default_currency){
              this.invoiceForm.get('exchange_rate')?.setValue(1);
              this.invoiceForm.get('exchange_rate')?.disable();
            }
          }
            // this.invoiceForm.get('exchange_rate')?.disable();
            // Don't disable exchange_rate for other currencies
            console.log('prem',this.inset_data.curency_conversion,this.inset_data.default_currency, this.invoiceForm.value);

          
      
      }

    });
  }
  ngOnDestroy(): void {
    if (this.formChangesSubscription) {
      this.formChangesSubscription.unsubscribe();
    }
    document.removeEventListener('click', this.handleClickOutside, true);
  }

  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // First update the form with the new logo
        this.invoiceForm.patchValue({
          logo: reader.result
        });
        console.log('Logo changed to:', reader.result);
        
        // Also update companyData for PDF generation
        this.companyData.business_logo = reader.result;
        console.log('Updated companyData.business_logo for PDF:', this.companyData.business_logo);
        
        // Create FormData for API call
        const formData = new FormData();
        formData.append('logo', file);
        
        // Call API to update company logo
        this.api.post2('/company/change-logo/1/', formData).subscribe({
          next: (res: any) => {
            console.log('Logo updated successfully:', res);
            // Optionally refresh company data to get updated logo
            this.getcompany();
          },
          error: (error: any) => {
            console.error('Error updating logo:', error);
            // You might want to show a toast/notification here
          }
        });
      };
    }
  }

  getBanks() {
    this.api.get('/money/list-bank/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Bank list:', response);
        if (response.status === 200) {
          this.uaeBanks = response.data;
          // this.toast.show('Success', 'Banks loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading banks:', error);
        this.toast.show('Error', 'Failed to load banks', 'danger');
      }
    });
  }
  openAddBankModal(content: any) {
    this.editingBankId = null;
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }
  onBankSaved(response: any) {
    this.getBanks();
    this.toast.show('Success', 'Bank saved successfully', 'success');
  }

  private getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private initializeForm(): void {
    // Set default due date to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    this.invoiceForm.patchValue({
      due_date: dueDate.toISOString().split('T')[0]
    });

    // Remove sample item - items section will start empty
    // this.addSampleItem();
  }

  // private addSampleItem(): void {
  //   const sampleItem = this.createItem();
  //   sampleItem.patchValue({
  //     item_id: 'SAMPLE001',
  //     itemName: 'Sample Product',
  //     itemCode: 'SP001',
  //     unit_type: 'PCS',
  //     rate: 100.00,
  //     qty: 1,
  //     disc: 0,
  //     vat: 5
  //   });
  //   this.items.push(sampleItem);
  // }

  subscribeToFormChanges(): void {
    // MUST register before form valueChanges — convert pay amount before calculateTotals can wipe it
    this.invoiceForm.get('inv_pay_currency')?.valueChanges.subscribe(newVal => {
      const newPay = Number(newVal) || 1;
      const oldPay = Number(this.previousInvPayCurrency) || 1;
      if (newPay === oldPay) return;

      this.isProcessingCurrencyChange = true;
      this.applyReceivedAmountForPayCurrency(oldPay, newPay);
      this.previousInvPayCurrency = newPay;

      setTimeout(() => {
        this.isProcessingCurrencyChange = false;
      }, 150);
    });

    // Main subscription to recalculate totals whenever the form changes
    this.formChangesSubscription = this.invoiceForm.valueChanges.subscribe(values => {
      this.calculateTotals(values.items, values.extra_charge, values.received_amount);
    });

    // Watch for full_payment checkbox changes
    this.invoiceForm.get('full_payment')?.valueChanges.subscribe(fullPayment => {
      if (fullPayment) {
        const invPayCurrency = Number(this.invoiceForm.get('inv_pay_currency')?.value) || 1;
        const receivedAmount = this.getFullPaymentAmountInPayCurrency(invPayCurrency);
        this.setReceivedAmountValue(receivedAmount);
      } else {
        this.setReceivedAmountValue(0);
      }
    });

    // Watch for handover_to changes to debug what's triggering it
    this.invoiceForm.get('handover_to')?.valueChanges.subscribe(newValue => {
      console.log('🔄 handover_to changed to:', newValue);
    });
  }

  calculateTotals(items: any[] = [], extraCharges: any[] = [], received: number = 0): void {
    let taxableAmt = 0;
    let totalVat = 0;
    let totalDiscount = 0;

    items.forEach((item, index) => {
      const qty = +item.qty || 0;
      const rate = +item.rate || 0;
      const discPercent = +item.disc || 0;
      const vatPercent = +item.vat || 0; // Ensure VAT is a number, default to 0 if undefined

      const itemTotal = qty * rate;
      const discountAmount = itemTotal * (discPercent / 100);
      const taxableItemAmount = itemTotal - discountAmount;
      const vatAmount = taxableItemAmount * (vatPercent / 100);
      const finalItemAmount = taxableItemAmount + vatAmount;

      this.items.at(index)?.patchValue({
        total_amt: finalItemAmount.toFixed(2),
        vat_amount: vatAmount.toFixed(2)
      }, { emitEvent: false });

      taxableAmt += taxableItemAmount;
      totalVat += vatAmount;
      totalDiscount += discountAmount;
    });

    const extraChargesValue = extraCharges.reduce((acc, charge) => acc + (+charge.extra_value || 0), 0);
    let finalTotalAmount = taxableAmt + totalVat + extraChargesValue;

    // Apply round off if enabled
    if (this.invoiceForm.get('round_off')?.value) {
      finalTotalAmount = Math.round(finalTotalAmount);
    }

    const receivableAmount = finalTotalAmount - (+received || 0);

    // Sync full_payment checkbox based on amounts
    // Compare in invoice currency so AED/USD pay-currency switches don't wipe received_amount
    if (!this.isProcessingCurrencyChange) {
      const receivedAmount = +received || 0;
      const receivedInInvoiceCurrency = this.convertPayAmountToInvoiceCurrency(receivedAmount);
      const isFullPaymentChecked = this.invoiceForm.get('full_payment')?.value;
      const isFullyPaid =
        finalTotalAmount > 0 &&
        Math.abs(receivedInInvoiceCurrency - finalTotalAmount) < 0.05;

      if (isFullyPaid) {
        if (!isFullPaymentChecked) {
          this.invoiceForm.get('full_payment')?.patchValue(true, { emitEvent: false });
        }
      } else if (isFullPaymentChecked && !isFullyPaid) {
        // Do not reset received_amount on currency mismatches — only uncheck when
        // pay currency matches invoice currency and amount no longer equals total.
        const currency = Number(this.invoiceForm.get('currency')?.value);
        const invPayCurrency = Number(this.invoiceForm.get('inv_pay_currency')?.value);

        if (currency === invPayCurrency) {
          this.invoiceForm.get('full_payment')?.patchValue(false, { emitEvent: false });
          // Keep received_amount as user-entered; do not force 0 (breaks AED↔USD toggle)
        }
      }
    }

    this.invoiceForm.patchValue({
      taxable_amt: taxableAmt.toFixed(2),
      total_vat: totalVat.toFixed(2),
      total_discount: totalDiscount.toFixed(2),
      final_total_amount: finalTotalAmount.toFixed(2),
      receivable: receivableAmount.toFixed(2)
    }, { emitEvent: false });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      item_id: [null, Validators.required],
      itemName: ['', Validators.required],
      itemCode: [''],
      notes: [''], // Added description field
      item_type: [1], // Default to product (1)
      unit: [''],
      units: [[]],
      unit_type: [],
      rate: [0, [Validators.required, Validators.min(0)]],
      disc: [0],
      vat: [5], // Default UAE VAT rate
      vat_category: [1], // Default VAT type (1 = Inclusive, 2 = Exclusive)
      vat_amount: [0],
      qty: [1, [Validators.required, Validators.min(1)]],
      total_amt: [0],
      current_stock: [0]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    console.log('Removing item at index:', index);
    console.log('Current items length:', this.items.length);
    if (this.items.length > 0) {
      this.items.removeAt(index);
    }
  }

  get extraCharges(): FormArray {
    return this.invoiceForm.get('extra_charge') as FormArray;
  }

  createExtraCharge(): FormGroup {
    return this.fb.group({
      extra_name: ['', Validators.required],
      extra_value: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addExtraCharge(): void {
    this.extraCharges.push(this.createExtraCharge());
  }

  removeExtraCharge(index: number): void {
    this.extraCharges.removeAt(index);
  }



  generateInvoiceNumber(): void {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNumber = `INV-${year}${month}-${random}`;
   // next_invoice_no/<company_id>/
   this.api.get('/invoice/next_invoice_no/'+this.api.getUserCompany()+'/').subscribe((res: any) => {
    if (res && res.status === 200 && res.data) {
      let invoice_no;
        const invoice_type = this.invoiceForm.get('invoice_type')?.value;
        if (invoice_type == 1) {
          invoice_no = res.data.sale_invoice_no;
        } else if (invoice_type == 2) {
          invoice_no =  res.data.purchase_invoice_no;
        } else if(invoice_type == 3){
          invoice_no =  res.data.sale_return_no;
        } else if(invoice_type == 4){
          invoice_no =  res.data.purchase_return_no          ;
        } else if(invoice_type == 5){
          invoice_no =  res.data.quotation_no;
        } else if(invoice_type == 6){
          invoice_no =  res.data.challan_no;
        } else if(invoice_type == 7){
          invoice_no =  res.data.proforma_no;
        } else if(invoice_type == 8){
          invoice_no =  res.data.purchase_order_no;
        } else if(invoice_type == 9){
          invoice_no =  res.data.sales_order_no;
        }
        console.log('invoice_no',invoice_no); 
        this.invoiceForm.patchValue({
          invoice_no: invoice_no?invoice_no:invoiceNumber
        });
      }
    //   invoice_no: invoiceNumber
    });
  }

  previewInvoice(): void {
    if (this.invoiceForm.valid) {
      console.log('Preview Invoice:', this.invoiceForm.value);
      // Implement preview functionality
    } else {
      this.invoiceForm.markAllAsTouched();
    }
  }

  // downloadPDF(): void {
  //   if (this.invoiceForm.valid) {
  //     console.log('Download PDF:', this.invoiceForm.value);
  //     // Implement PDF download functionality
  //   } else {
  //     this.invoiceForm.markAllAsTouched();
  //   }
  // }

  onSubmit(): void {
    this.invoiceForm.value.items = this.items.value;

    // Format against_grn_inv for purchase invoices
    if (this.invoiceForm.get('invoice_type')?.value == '2') {
      const formattedGrns = this.selectedGrns.map(grn => ({
        id: grn.id,
        grnNo: grn.grnNo,
        date: grn.date || grn.created_at || grn.invoice_date
      }));
      this.invoiceForm.patchValue({ against_grn_inv: formattedGrns });
    }

    console.log('Invoice Submitted:', this.invoiceForm.value);

    // Debug form validation
    this.debugFormValidation();

    if (this.invoiceForm.valid) {
      // Validate VAT consistency before submission
      if (!this.validateVatConsistency()) {
        this.toast.show('Warning', 'Please fix VAT inconsistencies before submitting', 'warning');
        return;
      }
      
      let formDataToSend = this.invoiceForm.getRawValue();

      // Format all amounts to 2 decimal places
      formDataToSend = this.formatAllAmountsToTwoDecimals(formDataToSend);

      // Convert all values to AED if currency conversion is enabled
      if (this.inset_data?.is_currency_conversion) {
        console.log('🔄 Converting all values to AED before submission...');
        formDataToSend = this.convertAllValuesToAED(formDataToSend);
        console.log('✅ Converted form data:', formDataToSend);
      }

      console.log('Invoice Submitted:', formDataToSend);
      // Implement save functionality
      if(!this.invoiceForm.get('is_converted')?.value){
      if (this.editinvoiceId) {
        this.api.put(`/invoice/update-invoice/${this.editinvoiceId}/`, formDataToSend).subscribe({
          next: (response: any) => {
            if (response.status === 200) {
              this.toast.show('Success', 'Invoice updated successfully', 'success');
              this.showSuccessMessage();
            } else {
              this.toast.show('Error', 'Failed to update invoice', 'danger');
              this.showErrorMessage();
            }
          },
          error: (error) => {
            console.error('Error updating invoice:', error);
          }
        });
      } else {

        this.api.post('/invoice/create-invoice/', formDataToSend).subscribe({
          next: (response: any) => {
            console.log('Invoice saved successfully:', response);
            if (response.status === 200) {
              this.toast.show('Success', 'Invoice created successfully', 'success');
              this.invoice_pdf_id = response.invoice_data.id
              this.showbutton = true;
              this.showSuccessMessage();
            } else {
              this.toast.show('Error', 'Failed to create invoice', 'danger');
              this.showErrorMessage();
            }
          },
          error: (error) => {
            console.error('Error creating invoice:', error);
            this.toast.show('Error', 'Failed to create invoice', 'danger');
            this.showErrorMessage();
          }
        });
      }
    }else{
        // formDataToSend.is_converted_inv=true
        this.api.post('/invoice/sale-purchase/'+this.invoiceForm.get('id')?.value+'/',formDataToSend).subscribe((res: any) => {
          if(res.status === 200){
            this.toast.show('Success', 'Invoice updated successfully', 'success');
            this.modalService.dismissAll();
          }else{
            this.toast.show('Failed',res.error?res.error:'Failed to submit invoice', 'danger');
          }
          console.log('res',res);
        });
        // this.api.post('/invoice/create-invoice/', formDataToSend).subscribe({
        //   next: (response: any) => {
        //     if (response.status === 200) {
        //       this.toast.show('Success', 'Invoice created successfully', 'success');
        //       this.invoice_pdf_id = response.invoice_data.id
        //       this.showbutton = true;
              
        //     } else {
        //       this.toast.show('Error', 'Failed to create invoice', 'danger');
        //       this.showErrorMessage();
        //     }
        //     console.log('Invoice saved successfully:', response);
        //   },
        //   error: (error) => {
        //     console.error('Error creating invoice:', error);
        //     this.toast.show('Error', 'Failed to create invoice', 'danger');
        //     this.showErrorMessage();
        //   }
        // });
      }
    } else {
      console.log('Form is invalid.');
      this.invoiceForm.markAllAsTouched();
      this.toast.show('Error', 'Please fill all required fields correctly', 'danger');
      this.showErrorMessage();
    }
  }

  // Debug method to identify validation issues
  private debugFormValidation(): void {
    console.log('=== FORM VALIDATION DEBUG ===');
    console.log('Form Valid:', this.invoiceForm.valid);
    console.log('Form Values:', this.invoiceForm.value);

    // Check each form control
    Object.keys(this.invoiceForm.controls).forEach(key => {
      const control = this.invoiceForm.get(key);
      if (control && !control.valid) {
        console.log(`❌ ${key}:`, {
          value: control.value,
          errors: control.errors,
          touched: control.touched,
          dirty: control.dirty
        });
      } else if (control) {
        console.log(`✅ ${key}:`, control.value);
      }
    });

    // Check items array specifically
    const itemsArray = this.invoiceForm.get('items') as FormArray;
    console.log('Items Array Length:', itemsArray.length);
    console.log('Items Array Valid:', itemsArray.valid);

    itemsArray.controls.forEach((itemControl, index) => {
      if (!itemControl.valid) {
        console.log(`❌ Item ${index}:`, {
          value: itemControl.value,
          errors: itemControl.errors
        });
      } else {
        console.log(`✅ Item ${index}:`, itemControl.value);
      }
    });
    console.log('=== END DEBUG ===');
  }

  private showSuccessMessage(): void {
    // Implement success message
    console.log('Invoice saved successfully!');
  }

  private showErrorMessage(): void {
    // Implement error message
    console.log('Please fill all required fields.');
  }

  private convertAllValuesToAED(formData: any): any {
    const conversionRate = this.inset_data.currency_conversion_rate || 1;
    const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
    const currentCurrency = Number(this.invoiceForm.get('currency')?.value);

    console.log('🔄 Conversion Details:', {
      conversionRate,
      exchangeRate,
      currentCurrency,
      isCurrencyConversion: this.inset_data?.is_currency_conversion
    });

    // Create a deep copy of the form data
    const convertedData = JSON.parse(JSON.stringify(formData));

    // Convert item rates and amounts
    if (convertedData.items && Array.isArray(convertedData.items)) {
      convertedData.items.forEach((item: any, index: number) => {
        if (currentCurrency === 2) { // If current currency is USD
          // Convert rate to AED
          if (item.rate) {
            item.rate = Number((Number(item.rate) * conversionRate).toFixed(2));
            console.log(`🔄 Item ${index} rate: ${item.rate} USD → ${item.rate} AED`);
          }

          // Convert total amount to AED
          if (item.total_amt) {
            item.total_amt = Number((Number(item.total_amt) * conversionRate).toFixed(2));
            console.log(`🔄 Item ${index} total: ${item.total_amt} USD → ${item.total_amt} AED`);
          }

          // Convert VAT amount to AED
          if (item.vat_amount) {
            item.vat_amount = Number((Number(item.vat_amount) * conversionRate).toFixed(2));
            console.log(`🔄 Item ${index} VAT: ${item.vat_amount} USD → ${item.vat_amount} AED`);
          }
        }
      });
    }

    // Convert main invoice amounts
    if (currentCurrency === 2) { // If current currency is USD
      // Convert taxable amount
      if (convertedData.taxable_amt) {
        convertedData.taxable_amt = Number((Number(convertedData.taxable_amt) * conversionRate).toFixed(2));
        console.log(`🔄 Taxable amount: ${convertedData.taxable_amt} USD → ${convertedData.taxable_amt} AED`);
      }

      // Convert total VAT
      if (convertedData.total_vat) {
        convertedData.total_vat = Number((Number(convertedData.total_vat) * conversionRate).toFixed(2));
        console.log(`🔄 Total VAT: ${convertedData.total_vat} USD → ${convertedData.total_vat} AED`);
      }

      // Convert total discount
      if (convertedData.total_discount) {
        convertedData.total_discount = Number((Number(convertedData.total_discount) * conversionRate).toFixed(2));
        console.log(`🔄 Total discount: ${convertedData.total_discount} USD → ${convertedData.total_discount} AED`);
      }

      // Convert final total amount
      if (convertedData.final_total_amount) {
        convertedData.final_total_amount = Number((Number(convertedData.final_total_amount) * conversionRate).toFixed(2));
        console.log(`🔄 Final total: ${convertedData.final_total_amount} USD → ${convertedData.final_total_amount} AED`);
      }
    }

    // Convert received and receivable amounts based on payment currency
    if (convertedData.inv_pay_currency == 2) {
      if (convertedData.received_amount) {
        convertedData.received_amount = Number((Number(convertedData.received_amount) * conversionRate).toFixed(2));
        console.log(`🔄 Received amount: ${convertedData.received_amount} USD → ${convertedData.received_amount} AED`);
      }
      if (convertedData.receivable) {
        convertedData.receivable = Number((Number(convertedData.receivable) * conversionRate).toFixed(2));
        console.log(`🔄 Receivable amount: ${convertedData.receivable} USD → ${convertedData.receivable} AED`);
      }
    }

    // Convert charge amounts (customs, insurance, etc.)
    const chargeFields = [
      'customs_Payable', 'insurance_Payable', 'demurage', 'freight_Payable',
      'port_Charge_Payable', 'carriage_Inwards', 'thc_Charges', 'bank_Charge_Payable', 'misc_Others'
    ];

    chargeFields.forEach(field => {
      if (convertedData[field]) {
        const currencyField = `${field}_currency`;
        const chargeCurrency = convertedData[currencyField];

        if (Number(chargeCurrency) === 2) { // If charge is in USD (handle both string "2" and number 2)
          convertedData[field] = Number((Number(convertedData[field]) * conversionRate).toFixed(2));
          console.log(`🔄 ${field}: ${convertedData[field]} USD → ${convertedData[field]} AED`);
        }
      }
    });

    // Set currency to AED (1) after conversion
    // convertedData.currency = 1;
    console.log('🔄 Currency set to AED (1)');

    return convertedData;
  }

  private formatAllAmountsToTwoDecimals(formData: any): any {
    console.log('🔢 Formatting all amounts to 2 decimal places...');

    // Create a deep copy of the form data
    const formattedData = JSON.parse(JSON.stringify(formData));

    // Format main invoice amounts
    if (formattedData.taxable_amt) {
      formattedData.taxable_amt = Number(Number(formattedData.taxable_amt).toFixed(2));
    }
    if (formattedData.total_vat) {
      formattedData.total_vat = Number(Number(formattedData.total_vat).toFixed(2));
    }
    if (formattedData.total_discount) {
      formattedData.total_discount = Number(Number(formattedData.total_discount).toFixed(2));
    }
    if (formattedData.final_total_amount) {
      formattedData.final_total_amount = Number(Number(formattedData.final_total_amount).toFixed(2));
    }
    if (formattedData.received_amount) {
      formattedData.received_amount = Number(Number(formattedData.received_amount).toFixed(2));
    }
    if (formattedData.receivable) {
      formattedData.receivable = Number(Number(formattedData.receivable).toFixed(2));
    }

    // Format item amounts
    if (formattedData.items && Array.isArray(formattedData.items)) {
      formattedData.items.forEach((item: any) => {
        if (item.rate) {
          item.rate = Number(Number(item.rate).toFixed(2));
        }
        if (item.total_amt) {
          item.total_amt = Number(Number(item.total_amt).toFixed(2));
        }
        if (item.vat_amount) {
          item.vat_amount = Number(Number(item.vat_amount).toFixed(2));
        }
        if (item.disc) {
          item.disc = Number(Number(item.disc).toFixed(2));
        }
      });
    }

    // Format charge amounts
    const chargeFields = [
      'customs_Payable', 'insurance_Payable', 'demurage', 'freight_Payable',
      'port_Charge_Payable', 'carriage_Inwards', 'thc_Charges', 'bank_Charge_Payable', 'misc_Others'
    ];

    chargeFields.forEach(field => {
      if (formattedData[field]) {
        formattedData[field] = Number(Number(formattedData[field]).toFixed(2));
      }
    });

    console.log('✅ All amounts formatted to 2 decimal places');
    return formattedData;
  }
  qtychange() {
    // Prevent recursive calls
    if (this.isProcessingQtyChange) {
      return;
    }

    // Check if this is a purchase invoice and warehouse is selected
    if (this.invoiceForm.get('invoice_type')?.value == '1') {
      const selectedWarehouse = this.invoiceForm.get('warehouse')?.value;

      if (selectedWarehouse) {
        const itemsArray = this.invoiceForm.get('items') as FormArray;

        itemsArray.controls.forEach((itemControl, index) => {
          const itemValue = itemControl.value;
          const currentQty = itemValue.qty || 0;
          const currentStock = itemValue.current_stock || 0;
          const itemKey = `${itemValue.item_id}_${currentQty}`;

          console.log('itemKey', currentQty, currentStock);

          // Only process if quantity exceeds current stock and current stock is greater than 0
          if (currentQty > currentStock && currentStock > 0) {
            // Check if we've already warned for this item and quantity
            if (!this.warnedItems.has(itemKey)) {
              // Set flag to prevent recursive calls
              this.isProcessingQtyChange = true;

              // Reset quantity to current stock using setValue to avoid emitEvent
              itemControl.get('qty')?.setValue(currentStock, { emitEvent: false });

              // Add to warned items set
              this.warnedItems.add(itemKey);

              // Show warning only once per item
              this.toast.show(
                'Warning',
                `Selected warehouse has only ${currentStock} units of ${itemValue.itemName}. Quantity adjusted to available stock.`,
                'warning'
              );

              // Reset flag after a short delay to allow the UI to update
              setTimeout(() => {
                this.isProcessingQtyChange = false;
              }, 100);
            }
          } else {
            // If quantity is valid, remove from warned items set
            this.warnedItems.delete(itemKey);
          }
        });
      }
    }
  }

  onItemSelect(selectedItem: any): void {
    console.log('Selected Item:', selectedItem);

    const itemsArray = this.items;
    const existingItemIndex = itemsArray.controls.findIndex(
      (control: any) => control.get('item_id')?.value === selectedItem.id
    );

    if (existingItemIndex !== -1) {
      // Item already exists, update quantity
      const existingItem = itemsArray.at(existingItemIndex);
      const currentQty = existingItem.get('qty')?.value || 0;
      existingItem.patchValue({
        qty: currentQty + 1
      });
    } else {
      // Add new item
      const newItem = this.createItem();

      // Determine rate based on invoice type
      let rate = 0;
      const invoiceType = this.invoiceForm.get('invoice_type')?.value;

      if (invoiceType === '1' || invoiceType === '3' || invoiceType === '5' || invoiceType === '7' || invoiceType === '9') {
        // Sales invoice - use sales_price
        rate = selectedItem.rate || 0;
      } else if (invoiceType === '2' || invoiceType === '4' || invoiceType === '6' || invoiceType === '8') {
        // Purchase invoice - use purchase_price
        rate = selectedItem.purchase_rate || 0;
      } else {
        // Default to sales_price for other invoice types
        rate = selectedItem.sales_price || 0;
      }

      newItem.patchValue({
        item_id: selectedItem.id,
        itemName: selectedItem.name,
        itemCode: selectedItem.item_code,
        notes:'', // Added description field
        item_type: selectedItem.item_type,
        unit: selectedItem.item_type === 1 ? selectedItem.units[0].id : null,
        unit_type: selectedItem.item_type === 1 ? selectedItem.units[0].type : null,
        units: selectedItem.item_type === 1 ? selectedItem.units : null,
        rate: rate,
        vat: selectedItem.vat_per,
        vat_category: selectedItem.vat_category || 1, // Added VAT type field
        current_stock: selectedItem.current_stock || 0
      });

      // Set up quantity change listener for this item
      newItem.get('qty')?.valueChanges.subscribe(() => {
        this.qtychange();
      });

      itemsArray.push(newItem);
    }
  }

  onPartySelect(party: any): void {
    console.log('Selected Party:', party);
    if (party) {
      // Clear previous GRN selections when changing parties
      this.clearAllGrnSelections();

      this.invoiceForm.patchValue({
        partyData: party,
        party: party.id
      });
      if (this.invoiceForm.get('invoice_type')?.value == '2') {
        console.log('Loading GRN list for party:', party.id);
        this.getgrnlist(party.id);
      } else {
        console.log('Invoice type is not Sales (2), current type:', this.invoiceForm.get('invoice_type')?.value);
      }
      this.sidebarTab = 'items';
    }
  }

  clearAllGrnSelections() {
    // Remove all GRN items
    Object.keys(this.grnItemMapping).forEach(key => {
      const grnId = parseInt(key);
      this.removeGrnItems(grnId);
    });

    // Clear selected GRNs
    this.selectedGrns = [];
    this.invoiceForm.patchValue({ against_grn_inv: [] });
  }

  getgrnlist(a: any) {
    console.log('Calling GRN API for party ID:', a);
    this.api.get('/invoice/party-wise-inward/' + a + '/').subscribe({
      next: (response: any) => {
        console.log('GRN API Response:', response);
        if (response.status === 200) {
          this.grnList = response.data || [];
          this.filteredGrnList = [...this.grnList]; // Initialize filtered list with all GRNs
          console.log('GRN list loaded:', this.grnList);
          console.log('Filtered GRN list:', this.filteredGrnList);
          console.log('GRN list length:', this.grnList.length);

          if (this.grnList.length === 0) {
            console.log('No GRN data found for this party');
          }
        } else {
          console.log('API returned non-200 status:', response.status);
        }
      },
      error: (error) => {
        console.error('Error loading GRN list:', error);
        this.toast.show('Error', 'Failed to load GRN list', 'danger');
      }
    });
  }
  // Helper methods for template
  getSelectedEmirateLabel(): string {
    const selectedValue = this.invoiceForm.get('inv_tax_type')?.value;
    const emirate = this.uaeEmirates.find(e => e.value === selectedValue);
    return emirate ? emirate.label : 'Select Emirate';
  }

  getSelectedPaymentMethodLabel(): string {
    const selectedValue = this.invoiceForm.get('payment_type')?.value;
    const method = this.paymentMethods.find(m => m.value === selectedValue);
    return method ? method.label : 'Select Payment Method';
  }

  getSelectedInvoiceTypeLabel(): string {
    const selectedValue = this.invoiceForm.get('invoice_type')?.value;
    const type = this.invoiceTypes.find(t => t.value === selectedValue);
    return type ? type.label : 'Select Invoice Type';
  }

  private loadInvoiceTypeFromUrl(): void {
    // Get invoice type from URL parameters
    this.route.queryParams.subscribe(params => {
      const invoiceType = params['type'];
      console.log('URL Invoice Type Parameter:', invoiceType);

      if (invoiceType) {
        let selectedType = '';

        // Map URL parameters to invoice type values
        switch (invoiceType.toLowerCase()) {
          case 'sales':
            selectedType = '1';
            this.dictionary_name = 'Sales Invoice';
            break;
          case 'purchase':
            selectedType = '2';
            this.dictionary_name = 'Purchase Invoice';
            break;
          case 'sales-return':
            selectedType = '3';
            this.dictionary_name = 'Credit Note';
            break;
          case 'purchase-return':
            selectedType = '4';
            this.dictionary_name = 'Debit Note';
            break;
          case 'quotation':
            selectedType = '5';
            this.dictionary_name = 'Quotation';
            break;
          case 'delivery-challan':
            selectedType = '6';
            this.dictionary_name = 'Challan';
            break;
          case 'proforma':
            selectedType = '7';
            this.dictionary_name = 'Proforma Invoice';
            break;
          case 'purchase-order':
            selectedType = '8';
            this.dictionary_name = 'Purchase Order';
            break;
          case 'sales-order':
            selectedType = '9';
            this.dictionary_name = 'Sales Order';
            break;

          default:
            // For other types, use the provided value directly
            selectedType = invoiceType;
        }

        console.log('Setting Invoice Type to:', selectedType);
        this.invoiceForm.patchValue({
          invoice_type: selectedType
        });
      }
    });
  }

  private setInvoiceTypeDisplay(type: string) {
    switch (type) {
      case '1':
        this.dictionary_name = 'Sales Invoice';
        break;
      case '2':
        this.dictionary_name = 'Purchase Invoice';
        break;
      case '3':
        this.dictionary_name = 'Credit Note';
        break;
      case '4':
        this.dictionary_name = 'Debit Note';
        break;
      case '5':
        this.dictionary_name = 'Quotation';
        break;
      case '6':
        this.dictionary_name = 'Challan';
        break;
      case '7':
        this.dictionary_name = 'Proforma Invoice';
        break;
      case '8':
        this.dictionary_name = 'Purchase Order';
        break;
      case '9':
        this.dictionary_name = 'Sales Order';
        break;
      default:
        this.dictionary_name = '';
    }
  }

  onUnitChanged(index: number, item: any) {
    const selectedUnitId = item.get('unit').value;
    const selectedUnit = item.value.units.find((u: any) => u.id == selectedUnitId);
    if (selectedUnit) {
      item.patchValue({ unit_type: selectedUnit.type });
    }
  }

  onGrnSearch(search: string) {
    this.grnSearchText = search;
    if (!search || search.trim() === '') {
      this.filteredGrnList = [...this.grnList];
    } else {
      this.filteredGrnList = this.grnList.filter(grn =>
        grn.display && grn.display.toLowerCase().includes(search.toLowerCase())
      );
    }
    this.grnDropdownOpen = this.filteredGrnList.length > 0;
  }

  isGrnSelected(grn: any): boolean {
    return this.selectedGrns.some(selected => selected.id === grn.id);
  }

  onGrnToggle(grn: any) {
    if (this.isGrnSelected(grn)) {
      this.selectedGrns = this.selectedGrns.filter(selected => selected.id !== grn.id);
      // Remove items from this GRN
      this.removeGrnItems(grn.id);
    } else {
      this.selectedGrns = [...this.selectedGrns, grn];
      // Add items from this GRN
      this.addGrnItems(grn);
    }
    this.invoiceForm.patchValue({ against_grn_inv: this.selectedGrns });
  }

  addGrnItems(grn: any) {
    if (grn.items && grn.items.length > 0) {
      const addedItemIndices: number[] = [];

      grn.items.forEach((grnItem: any) => {
        const itemInfo = grnItem;
        console.log('Item Info:', itemInfo);
        console.log('Item Info:', itemInfo.item_info);
        console.log('Item Info:', itemInfo.item_info.name);
        console.log('Item Info:', itemInfo.item_info.item_code);
        console.log('Item Info:', itemInfo.unit);
        console.log('Item Info:', itemInfo.units);
        console.log('Item Info:', itemInfo.units[0]);
        console.log('Item Info:', itemInfo.units[0].id);
        console.log('Item Info:', itemInfo.units[0].type);
        if (itemInfo) {
          const newItem = this.createItem();
          newItem.patchValue({
            item_id: itemInfo.itemId,
            itemName: itemInfo.item_info.name,
            itemCode: itemInfo.item_info.item_code,
            notes: '', // Added description field
            unit: itemInfo.unit || (itemInfo.units && itemInfo.units[0] ? itemInfo.units[0].id : null),
            unit_type: itemInfo.units && itemInfo.units[0] ? itemInfo.units[0].type : null,
            units: itemInfo.units || [],
            rate: itemInfo.rate || 0,
            vat: itemInfo.vat || 0,
            vat_category: itemInfo.vat_category || 1, // Added VAT type field
            qty: grnItem.quantity || 1
          });

          const currentIndex = this.items.length;
          this.items.push(newItem);
          addedItemIndices.push(currentIndex);
        }
      });

      // Track which items were added from this GRN
      this.grnItemMapping[grn.id] = addedItemIndices;

      this.toast.show('Success', `Added ${grn.items.length} items from GRN ${grn.grnNo}`, 'success');
    }
  }

  removeGrnItems(grnId: number) {
    const itemIndices = this.grnItemMapping[grnId];
    if (itemIndices && itemIndices.length > 0) {
      // Remove items in reverse order to maintain correct indices
      const sortedIndices = [...itemIndices].sort((a, b) => b - a);
      sortedIndices.forEach(index => {
        if (index < this.items.length) {
          this.items.removeAt(index);
        }
      });

      // Remove the mapping for this GRN
      delete this.grnItemMapping[grnId];

      // Update remaining mappings to account for removed items
      Object.keys(this.grnItemMapping).forEach(key => {
        const grnIdKey = parseInt(key);
        if (grnIdKey !== grnId) {
          this.grnItemMapping[grnIdKey] = this.grnItemMapping[grnIdKey].map(index => {
            // Adjust indices for items that were removed before this index
            return sortedIndices.reduce((adjustedIndex, removedIndex) => {
              return adjustedIndex > removedIndex ? adjustedIndex - 1 : adjustedIndex;
            }, index);
          }).filter(index => index >= 0); // Remove any negative indices
        }
      });

      console.log(`Removed items from GRN ${grnId}`);
    }
  }

  removeGrn(grn: any) {
    this.selectedGrns = this.selectedGrns.filter(selected => selected.id !== grn.id);
    this.invoiceForm.patchValue({ against_grn_inv: this.selectedGrns });
    // Remove items from this GRN
    this.removeGrnItems(grn.id);
  }

  onGrnInput(event: Event) {
    const value = (event.target as HTMLInputElement)?.value || '';
    this.onGrnSearch(value);
  }

  onGrnInputFocus() {
    this.grnDropdownOpen = this.filteredGrnList.length > 0;
  }

  onSelectAllGrns(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      // Add all filtered GRNs to selectedGrns and their items
      this.filteredGrnList.forEach(grn => {
        if (!this.selectedGrns.some(sg => sg.id === grn.id)) {
          this.selectedGrns = [...this.selectedGrns, grn];
          this.addGrnItems(grn);
        }
      });
    } else {
      // Remove all filtered GRNs from selectedGrns and their items
      this.filteredGrnList.forEach(grn => {
        if (this.selectedGrns.some(sg => sg.id === grn.id)) {
          this.selectedGrns = this.selectedGrns.filter(selected => selected.id !== grn.id);
          this.removeGrnItems(grn.id);
        }
      });
    }
    this.invoiceForm.patchValue({ against_grn_inv: this.selectedGrns });
  }

  handleClickOutside = (event: MouseEvent) => {
    const inputEl = this.grnInputRef?.nativeElement;
    const dropdownEl = document.querySelector('.dropdown-menu.show');
    if (
      inputEl &&
      !inputEl.contains(event.target as Node) &&
      dropdownEl &&
      !dropdownEl.contains(event.target as Node)
    ) {
      this.grnDropdownOpen = false;
    }
  };

  areAllGrnsSelected(): boolean {
    return this.filteredGrnList.length > 0 && this.filteredGrnList.every(grn => this.isGrnSelected(grn));
  }

  // Method for testing GRN functionality
  testGrnLoading() {
    const partyId = this.invoiceForm.get('party')?.value;
    if (partyId) {
      console.log('Testing GRN loading for party:', partyId);
      console.log('Current GRN item mapping:', this.grnItemMapping);
      console.log('Selected GRNs:', this.selectedGrns);
      console.log('Current items count:', this.items.length);
      this.getgrnlist(partyId);
    } else {
      console.log('No party selected for GRN testing');
    }
  }

  getSelectedWarehouse() {
    return this.invoiceForm.get('warehouse')?.value;
  }

  onWarehouseChange() {
    const warehouseValue = this.invoiceForm.get('warehouse')?.value;
    console.log('Warehouse changed to:', warehouseValue);
    this.warehouseChanged.emit(warehouseValue);
  }

  onWarehouseChanged(warehouseValue: any) {
    console.log('Warehouse value received in create-invoice from add-item:', warehouseValue);
    // Handle any logic needed when warehouse changes in add-item
  }
  createNewInvoice() {
    this.invoiceForm.reset();
    this.showbutton = false;
    
  }
  previewPDF() {
    // if (this.invoiceForm.get('invoice_type')?.value == 1 || this.invoiceForm.get('invoice_type')?.value == 3 || this.invoiceForm.get('invoice_type')?.value == 5 || this.invoiceForm.get('invoice_type')?.value == 7 || this.invoiceForm.get('invoice_type')?.value == 9) {
    //   const docDefinition: any = this.getInvoiceDocDefinition();
    //   pdfMake.createPdf(docDefinition).open();
    // } else {
      this.purchasepdf()
    // }
  }
  purchasepdf() {
    this.api.get('/invoice/invoice_pdf/' + this.invoice_pdf_id + '/').subscribe((res: any) => {
      console.log(res);
      this.data = res.data
      // this.downloadPDFpur()
      const docDefinition: any = this.downloadPDFpur();
      pdfMake.createPdf(docDefinition).open();
    })
  }

  downloadPDF() {
    // if (this.invoiceForm.get('invoice_type')?.value == 1 || this.invoiceForm.get('invoice_type')?.value == 3 || this.invoiceForm.get('invoice_type')?.value == 5 || this.invoiceForm.get('invoice_type')?.value == 7 || this.invoiceForm.get('invoice_type')?.value == 9) {
    //   const docDefinition: any = this.getInvoiceDocDefinition();
    //   pdfMake.createPdf(docDefinition).download('invoice.pdf');
    // } else {
      this.api.get('/invoice/invoice_pdf/' + this.invoice_pdf_id + '/').subscribe((res: any) => {
        console.log(res);

        this.data = res.data
        // this.downloadPDFpur()
        const docDefinition: any = this.downloadPDFpur();
        // set time out for this
        setTimeout(() => {
          pdfMake.createPdf(docDefinition).download('invoice.pdf');
        }, 500);

      })
    // }
  }

  getInvoiceDocDefinition() {
    // Details for left and right columns
    const leftDetails = [
      [{ text: 'Vendor', bold: true }, ':', 'CASH SALES - JOHNSON ACCOUNT'],
      [{ text: 'Address', bold: true }, ':', ''],
      [{ text: 'Tel No', bold: true }, ':', ''],
      [{ text: 'Fax No', bold: true }, ':', ''],
      [{ text: 'TRN', bold: true }, ':', '']
    ];
    const rightDetails = [
      [{ text: 'Doc No', bold: true }, ':', 'INV-202404937'],
      [{ text: 'Doc Date', bold: true }, ':', '25/09/2024'],
      [{ text: 'Customer Code', bold: true }, ':', '540.Z128'],
      [{ text: 'LPO No', bold: true }, ':', ''],
      [{ text: 'Payment Terms', bold: true }, ':', 'CASH'],
      [{ text: 'Branch', bold: true }, ':', 'Head Office'],
      [{ text: 'Salesman', bold: true }, ':', 'JOHNSON']
    ];

    // Items table header and data
    const itemsHeader = [
      { text: 'S.No', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Item Code', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Description', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Un.Na', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Qty', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Rate', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Gross', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'VAT 5%', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'VAT Value', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Net', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true }
    ];
    const itemsRows = [
      ['1', 'BR 1395 67', { text: 'IRONTABLE 110X30 SIR MORNING BREEZE', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '135.00', alignment: 'right' }, { text: '135.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '6.75', alignment: 'right' }, { text: '141.75', alignment: 'right' }],
      ['2', 'PMR0021055', { text: 'PREMIER SUPER G MIXER GRINDER - 230 V - KM501 C2 (CE) (COC)(UK PLUG)', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '7.45', alignment: 'right' }, { text: '156.45', alignment: 'right' }],
      ['3', 'ANI-BR 4791 68', { text: 'MC RETROBIN-20L ALMOND SLIMLINE', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '60.00', alignment: 'right' }, { text: '60.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '3.00', alignment: 'right' }, { text: '63.00', alignment: 'right' }],
      ['4', 'BR 1499 00', { text: 'NEWICON PEDALBIN-5L Soft Beige', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '2', alignment: 'right' }, { text: '85.00', alignment: 'right' }, { text: '170.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '8.50', alignment: 'right' }, { text: '178.50', alignment: 'right' }],
      ['5', 'BR 3501 84', { text: 'DRYINGRACK-20M T-MODEL GREY', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '7.45', alignment: 'right' }, { text: '156.45', alignment: 'right' }],
      ['6', '130-95STGBG', { text: '95PC D/SET F.C STINGRAY BEIGEFINE CHINA', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '300.00', alignment: 'right' }, { text: '300.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '15.00', alignment: 'right' }, { text: '315.00', alignment: 'right' }],
      ['7', 'PMR00546', { text: 'S.S. PRESSURE COOKER - COMFORT - 3 LTRS.', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '79.00', alignment: 'right' }, { text: '79.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '3.95', alignment: 'right' }, { text: '82.95', alignment: 'right' }],
      ['8', 'ANI-BR 1131 47', { text: 'NEWICON PEDALBIN-3L BRILLIANT STEEL', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '2', alignment: 'right' }, { text: '30.00', alignment: 'right' }, { text: '60.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '3.00', alignment: 'right' }, { text: '63.00', alignment: 'right' }]
    ];

    // Details row using the same 10 columns as the items table
    const detailsRow = [
      // Left details (spanning columns 0-4)
      {
        colSpan: 5,
        stack: [
          { text: 'Vendor', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Address', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Tel No', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Fax No', bold: true, margin: [0, 1, 0, 1] },
          { text: 'TRN', bold: true, margin: [0, 1, 0, 1] }
        ]
      }, {}, {}, {}, {},
      // Right details (spanning columns 5-9)
      {
        colSpan: 5,
        stack: [
          { text: 'Doc No : INV-202404937', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Doc Date : 25/09/2024', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Customer Code : 540.Z128', bold: true, margin: [0, 1, 0, 1] },
          { text: 'LPO No :', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Payment Terms : CASH', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Branch : Head Office', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Salesman : JOHNSON', bold: true, margin: [0, 1, 0, 1] }
        ]
      }, {}, {}, {}, {}
    ];

    // Combine all into a single table
    const combinedTable = {
      table: {
        widths: [22, 60, '*', 32, 22, 38, 44, 28, 44, 48],
        body: [
          // TAX INVOICE title row
          [
            { text: 'TAX INVOICE', style: 'taxInvoiceTitle', alignment: 'center', colSpan: 10, margin: [0, 6, 0, 6], fontSize: 14, bold: true }, {}, {}, {}, {}, {}, {}, {}, {}, {}
          ],
          // Details row (spanning columns)
          [
            {
              colSpan: 5, stack: [
                { text: 'Vendor', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Address', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Tel No', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Fax No', bold: true, margin: [0, 1, 0, 1] },
                { text: 'TRN', bold: true, margin: [0, 1, 0, 1] }
              ]
            }, {}, {}, {}, {},
            {
              colSpan: 5, stack: [
                { text: 'Doc No : INV-202404937', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Doc Date : 25/09/2024', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Customer Code : 540.Z128', bold: true, margin: [0, 1, 0, 1] },
                { text: 'LPO No :', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Payment Terms : CASH', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Branch : Head Office', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Salesman : JOHNSON', bold: true, margin: [0, 1, 0, 1] }
              ]
            }, {}, {}, {}, {}
          ],
          // Items table header
          itemsHeader,
          // Items table rows
          ...itemsRows
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 2 ? '#f0f0f0' : null),
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 2,
        paddingBottom: () => 2
      },
      fontSize: 10,
      margin: [0, 10, 0, 0]
    };

    // Amount in words and totals table side by side
    const amountAndTotals = {
      columns: [
        {
          width: '*',
          text: [
            { text: 'AMOUNT IN WORDS : ', bold: true },
            { text: 'AED One Thousand One Hundred Fifty Seven And Ten Fils Only' }
          ],
          fontSize: 11,
          margin: [0, 2, 0, 0],
          alignment: 'left',
        },
        {
          width: 150,
          table: {
            widths: [80, 70],
            body: [
              [
                { text: 'Gross :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '1,102.00', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'Discount Amt :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '0.00', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'Taxable Amt :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '1,102.00', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'VAT :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '55.10', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'TOTAL :', alignment: 'right', bold: true, fontSize: 12, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '1,157.10', alignment: 'right', bold: true, fontSize: 12, margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ]
            ]
          },
          layout: 'noBorders',
          alignment: 'right',
          fontSize: 11,
          margin: [0, 2, 0, 0],
        }
      ],
      columnGap: 10
    };

    // Remarks table
    const remarksTable = {
      table: {
        widths: [70, 10, '*'],
        body: [
          [
            { text: 'Remarks', bold: true, alignment: 'left', margin: [4, 2, 0, 2] },
            { text: ':', alignment: 'center', margin: [0, 2, 0, 2] },
            { text: 'LULU GIFT', alignment: 'left', margin: [0, 2, 4, 2] }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000',
        vLineColor: () => '#000'
      },
      margin: [0, 18, 0, 0],
      fontSize: 11
    };

    // Footer section (For company, received, signatures)
    const footerSection = [
      {
        columns: [
          {
            width: '*', text: [
              'For ',
              { text: 'AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)', bold: true }
            ], margin: [0, 18, 0, 0], fontSize: 12
          },
          { width: '*', text: 'Received the above goods in good conditions', alignment: 'right', margin: [0, 18, 0, 0], fontSize: 12 }
        ]
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }] },
              { text: 'Approved By', alignment: 'center', bold: true, margin: [0, 4, 0, 0] },
              { text: 'Print Date & Time :    6/25/2025    2:59 PM', alignment: 'left', fontSize: 9, margin: [0, 8, 0, 0] }
            ]
          },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }] },
              { text: 'Checked By', alignment: 'center', bold: true, margin: [0, 4, 0, 0] },
              { text: 'User :    Pitchai', alignment: 'left', fontSize: 9, margin: [0, 8, 0, 0] }
            ]
          },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }] },
              { text: 'Received By', alignment: 'center', bold: true, margin: [0, 4, 0, 0] },
              { text: 'Page No :    1', alignment: 'left', fontSize: 9, margin: [0, 8, 0, 0] }
            ]
          }
        ],
        margin: [0, 28, 0, 0]
      }
    ];

    return {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 30],
      content: [
        // Logo
        {
          image: 'data:image/png;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCADIAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxAAPwD+/iiiigD/2Q==',
          width: 80,
          alignment: 'center',
          margin: [0, 0, 0, 8]
        },
        // Company Name
        {
          text: 'AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)',
          style: 'companyName',
          alignment: 'center',
          margin: [0, 0, 0, 4]
        },
        // Address and Contact
        {
          text: 'POST BOX NO. 4713, DUBAI, U.A.E.\nTEL :04-3536699 FAX :04-3536611 Email : raisem@eim.ae',
          style: 'companyInfo',
          alignment: 'center',
          margin: [0, 0, 0, 2]
        },
        // TRN
        {
          text: 'TRN : 100033732700003',
          style: 'trn',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        // Combined Table (TAX INVOICE, details, items)
        combinedTable,
        // Amount in Words and Totals Table (side by side)
        amountAndTotals,
        // Remarks Table
        remarksTable,
        // Footer Section
        ...footerSection
      ],
      styles: {
        companyName: { fontSize: 16, bold: true },
        companyInfo: { fontSize: 11 },
        trn: { fontSize: 12, bold: true },
        taxInvoiceTitle: { fontSize: 14, bold: true },
        itemsTableHeader: { bold: true, fontSize: 12, fillColor: '#f0f0f0', alignment: 'center' }
      }
    };
  }
  close() {
    if (this.activeModal) {
      this.activeModal.close();
    }
  }
  downloadPDFpur() {
    if (!this.data) {
      alert('Data not loaded yet!');
      return;
    }
    
    if (!this.companyData) {
      // Try to load company data if not available
      this.getcompany();
      alert('Company data not loaded yet! Please wait for company information to load and try again.');
      return;
    }
    // @ts-ignore
    const pdfMake = window['pdfMake'];
    const d = this.data;
    // Build item rows from API data
    const itemRows = d.items.map((item: any, idx: number) => [
      { text: (idx + 1).toString(), alignment: 'center', fontSize: 9 },
      { text: item.item_info.item_code, alignment: 'center', fontSize: 9 },
      { text: item.itemName, fontSize: 9 },
      { text: item.item_info.units[0]?.name.split(' - ')[0] || '', alignment: 'center', fontSize: 9 },
      { text: item.qty.toFixed(2), alignment: 'right', fontSize: 9 },
      { text: item.rate.toFixed(2), alignment: 'right', fontSize: 9 },
      { text: item.total_amt.toFixed(2), alignment: 'right', fontSize: 9 }
    ]);
    // Calculate totals
    const totalQty = d.items.reduce((sum: number, item: any) => sum + Number(item.qty), 0).toFixed(2);
    const totalGross = d.items.reduce((sum: number, item: any) => sum + Number(item.total_amt), 0).toFixed(2);
    // Charges section rows
    const chargesRows = [
      [
        { text: 'Customs Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.customs_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Insurance Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.insurance_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Demurage (AED)', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.demurage?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Total Net :', bold: true, alignment: 'right', rowSpan: 3, valign: 'middle', fontSize: 9, noWrap: true, margin: [0, 0, 0, 0] },
        { text: d.final_total_amount?.toFixed(2) || '0.00', bold: true, alignment: 'right', rowSpan: 3, valign: 'middle', fontSize: 9, noWrap: true, margin: [0, 0, 0, 0] }
      ],
      [
        { text: 'Freight Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.freight_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Port Charge Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.port_Charge_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Carriage Inwards', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.carriage_Inwards?.toFixed(2) || '0.00', fontSize: 9, margin: [0, 0, 0, 0] },
        {},
        {}
      ],
      [
        { text: 'THC & DO Charges', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.thc_Charges?.toFixed(2) || '0.00', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Bank Charge Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.bank_Charge_Payable?.toFixed(2) || '0.00', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Misc. & Others', bold: true, color: '#2222ee', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.misc_Others?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        {},
        {}
      ]
    ];
    // @ts-ignore
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [10, 10, 10, 10],
      footer: function (currentPage: number, pageCount: number) {
        return {
          columns: [
            { text: 'Print Date & Time :      6/25/2025    2:56 PM', alignment: 'left', fontSize: 9 },
            { text: 'User :   Pitchai', alignment: 'center', fontSize: 9 },
            { text: 'Page No :    ' + currentPage, alignment: 'right', fontSize: 9 }
          ],
          margin: [40, 0]
        };
      },
      content: [
        {
          table: {
            headerRows: 4,
            widths: [25, 55, '*', 30, 35, 35, 45],
            body: [
              // Company info row (spans all columns)
              [
                {
                  colSpan: 7,
                  stack: [
                    // Company logo if available
                   
                    { text: this.companyData?.business_name, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
                    // { text: this.companyData?.business_name_arabic || '', fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
                    { text: this.companyData?.address1, fontSize: 10, alignment: 'center', margin: [0, 0, 0, 0] },
                    { text: `TEL :${this.companyData?.phone_no || '04-3536699'} FAX :${this.companyData?.alternate_business_no || '04-3536611'} Email : ${this.companyData?.email || 'raisem@eim.ae'}`, fontSize: 10, alignment: 'center', margin: [0, 0, 0, 0] },
                    { text: `TRN : ${this.companyData?.tax_registration_number || '100033732700003'}`, fontSize: 11, bold: true, alignment: 'center', color: '#000', margin: [0, 0, 0, 6] },
                    // Additional company information
                    ...(this.companyData?.license_number ? [{ text: `License: ${this.companyData.license_number}`, fontSize: 9, alignment: 'center', margin: [0, 0, 0, 2] }] : []),
                    ...(this.companyData?.vat_registered ? [{ text: 'VAT Registered Company', fontSize: 9, alignment: 'center', color: '#0066cc', margin: [0, 0, 0, 2] }] : [])
                  ],
                  alignment: 'center',
                  margin: [0, 4, 0, 4]
                }, {}, {}, {}, {}, {}, {}
              ],
              // Section header row (spans all columns)
              // [
              //   {
              //     colSpan: 7,
              //     text: 'MATERIAL RECEIPT NOTE IMPORT',
              //     bold: true,
              //     fontSize: 14,
              //     alignment: 'center',
              //     margin: [0, 2, 0, 2]
              //   }, {}, {}, {}, {}, {}, {}
              // ],
              // Details row (as before, using colSpan for left/right blocks)
              [
                {
                  colSpan: 3, stack: [
                    { text: [{ text: 'Vendor     : ', bold: true, fontSize: 9 }, { text: d.party_name, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Address    : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 }], margin: [0, 0, 0, 0] },
                    { text: '', fontSize: 9, margin: [65, 0, 0, 1] },
                    { text: [{ text: 'Tel No     : ', bold: true, fontSize: 9 }, { text: d.party_tel, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Fax No     : ', bold: true, fontSize: 9 }, { text: d.party_fax, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'TRN        : ', bold: true, fontSize: 9 }, { text: d.party_trn, fontSize: 9 }], margin: [0, 0, 0, 1] }
                  ]
                }, {}, {},
                {
                  colSpan: 4, stack: [
                    { text: [{ text: 'Doc No         : ', bold: true, fontSize: 9 }, { text: d.invoice_no, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Doc Date       : ', bold: true, fontSize: 9 }, { text: d.invoice_date, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Currency       : ', bold: true, fontSize: 9 }, { text: 'USD', fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Expt Dly Date  : ', bold: true, fontSize: 9 }, { text: d.due_date, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Payment Terms  : ', bold: true, fontSize: 9 }, { text: d.terms?.toString() || '', fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Outlet         : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Branch         : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 }], margin: [0, 0, 0, 1] }
                  ]
                }, {}, {}, {}
              ],
              // Items table header
              [
                { text: 'S.No', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Item Code', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Description', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Unit', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Qty', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Rate', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Gross', bold: true, alignment: 'center', fontSize: 9 }
              ],
              ...itemRows,
              // Row for totals (Qty and Gross)
              [
                { colSpan: 4, text: 'Page Total', alignment: 'center', border: [true, false, false, false] }, {}, {}, {},
                { text: totalQty, bold: true, italics: true, alignment: 'right', border: [false, false, false, false] },
                { text: '', border: [false, false, false, false] },
                { text: totalGross, bold: true, italics: true, alignment: 'right', border: [false, false, true, false] }
              ],
            ],
            layout: {
              hLineWidth: function (i: any, node: any) {
                // Top, section header (top and bottom), header, and bottom borders
                if (i === 0 || i === 1 || i === 2 || i === 3 || i === 4 || i === 18 || i === node.table.body.length) return 1;
                return 0;
              },
              vLineWidth: function (i: any, node: any) {
                // Only leftmost and rightmost vertical lines
                if (i === 0 || i === node.table.widths.length) return 1;
                return 0;
              },
              hLineColor: function (i: any, node: any) { return 'black'; },
              vLineColor: function (i: any, node: any) { return 'black'; }
            },
            styles: {
              logoText: { fontSize: 28, bold: true, color: '#222' },
              companyName: { fontSize: 16, bold: true },
              trnBold: { fontSize: 12, bold: true },
              sectionTitle: { fontSize: 14, bold: true },
            }
          }
        },
        // Add a new section below the main table for Total Discount and Total Gross
        {
          table: {
            widths: ['*', 120, 60],
            body: [
              [
                { text: '', colSpan: 1 },
                { text: 'Total Discount :', alignment: 'right', bold: true },
                { text: d.total_discount?.toFixed(2) || '0.00', alignment: 'right' }
              ],
              [
                { text: '', colSpan: 1 },
                { text: 'Total Gross :', alignment: 'right', bold: true },
                { text: d.final_total_amount?.toFixed(2) || '0.00', alignment: 'right' }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i: number, node: any) {
              // Only top border for first row, bottom border for last row
              if (i === node.table.body.length) return 1;
              return 0;
            },
            vLineWidth: function (i: number, node: any) {
              // Only leftmost and rightmost vertical lines
              if (i === 0 || i === node.table.widths.length) return 1;
              return 0;
            },
            hLineColor: function (i: any, node: any) { return 'black'; },
            vLineColor: function (i: any, node: any) { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        // Charges section
        {
          table: {
            widths: [70, 60, 70, 60, 60, 60, 60, 62],
            body: chargesRows
          },
          layout: {
            hLineWidth: function (i: number) { return 1; },
            vLineWidth: function (i: number) { return 1; },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        // Amount in words row
        {
          table: {
            widths: [120, '*'],
            body: [
              [
                { text: 'Amount in words :', bold: true, fontSize: 10, margin: [0, 0, 0, 0] },
                { text: 'USD Two Hundred Twelve Thousand Eight Hundred Twenty Four and Fifty One Pounds Only', fontSize: 10, margin: [0, 0, 0, 0] }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i: number) { return 1; },
            vLineWidth: function (i: number) { return 1; },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        // Remarks row
        {
          table: {
            widths: [80, '*'],
            body: [
              [
                { text: 'Remarks', bold: true, fontSize: 11, margin: [0, 0, 0, 0] },
                { text: d.notes || ':', fontSize: 11, margin: [0, 0, 0, 0] }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i: number) { return 1; },
            vLineWidth: function (i: number) { return 1; },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        // Signature section with outer border
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: `For      ${this.companyData?.business_name || 'AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)'}`, bold: false, fontSize: 12, margin: [0, 8, 0, 8] },
                    {
                      table: {
                        widths: ['33%', '33%', '34%'],
                        body: [
                          [
                            { text: 'Prepared By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] },
                            { text: 'Checked By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] },
                            { text: 'Approved By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] }
                          ]
                        ]
                      },
                      layout: 'noBorders',
                      margin: [0, 0, 0, 0]
                    }
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i: number) { return 1; },
            vLineWidth: function (i: number) { return 1; },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        }
      ]
    };
    // @ts-ignore
    // pdfMake.createPdf(docDefinition).download('Material_Receipt_Note_Header.pdf');
    return docDefinition;
  }
  
  getSelectedCurrencyCode(): string {
    const selectedId = this.invoiceForm.get('currency')?.value;
    const selected = this.currencies.find((c: any) => c.id == selectedId);
    return selected ? selected.code : '';
  }
  getselectedcurrencysecond():string{
    const selectedId = this.inset_data.curency_conversion
    const selected = this.currencies.find((c: any) => c.id == selectedId);
    return selected ? selected.code : '';
  }
  getfirstcurrency():string{
    const selectedId = this.inset_data.default_currency
    const selected = this.currencies.find((c: any) => c.id == selectedId);
    return selected ? selected.code : '';
  }
  getSelectedCurrencyName(): string {
    const selectedId = this.invoiceForm.get('default_currency')?.value;
    const selected = this.currencies.find((c: any) => c.id == selectedId);
    return selected ? selected.code : 'AED';
  }

  getPaymentCurrencyCode(): string {
    const invPayCurrency = Number(this.invoiceForm.get('inv_pay_currency')?.value);
    return invPayCurrency === 2 ? 'USD' : 'AED';
  }

  /** AED↔USD rate used for payment currency conversion (sales + purchase). */
  private getPayConversionRate(): number {
    if (this.inset_data?.is_currency_conversion) {
      return Number(this.inset_data.currency_conversion_rate) || 1;
    }
    return Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
  }

  /** Convert amount from current payment currency into invoice currency for comparisons. */
  private convertPayAmountToInvoiceCurrency(amountInPayCurrency: number): number {
    const amount = Number(amountInPayCurrency) || 0;
    if (!amount) return 0;

    const currency = Number(this.invoiceForm.get('currency')?.value);
    const invPayCurrency = Number(this.invoiceForm.get('inv_pay_currency')?.value) || 1;
    const rate = this.getPayConversionRate() || 1;

    if (currency === invPayCurrency) return amount;
    // Invoice AED, payment USD → to AED
    if (currency === 1 && invPayCurrency === 2) return amount * rate;
    // Invoice USD, payment AED → to USD
    if (currency === 2 && invPayCurrency === 1) return amount / rate;

    // Other invoice currencies: bridge via exchange_rate (invoice → AED) and conversion rate
    const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
    if (invPayCurrency === 1) {
      // pay AED → invoice
      return exchangeRate ? amount / exchangeRate : amount;
    }
    if (invPayCurrency === 2) {
      // pay USD → AED → invoice
      const inAed = amount * rate;
      return exchangeRate ? inAed / exchangeRate : inAed;
    }
    return amount;
  }

  /**
   * Full payment amount expressed in the selected payment currency (AED/USD).
   * Same logic for sales and purchase invoices.
   */
  getFullPaymentAmountInPayCurrency(invPayCurrency: number): number {
    const totalAmount = Number(this.invoiceForm.get('final_total_amount')?.value) || 0;
    const currency = Number(this.invoiceForm.get('currency')?.value);
    const payCurrency = Number(invPayCurrency) || 1;
    const rate = this.getPayConversionRate() || 1;

    if (!totalAmount) return 0;

    // Same currency — use invoice total as-is
    if (currency === payCurrency) {
      return totalAmount;
    }

    if (currency === 1 && payCurrency === 2) {
      // Invoice AED → pay USD
      return totalAmount / rate;
    }
    if (currency === 2 && payCurrency === 1) {
      // Invoice USD → pay AED
      return totalAmount * rate;
    }

    // Other invoice currencies — bridge via AED
    const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
    const totalInAed = totalAmount * exchangeRate;
    if (payCurrency === 1) return totalInAed;
    if (payCurrency === 2) return totalInAed / rate;
    return totalAmount;
  }

  /** Convert a received/paid amount between AED and USD payment currencies. */
  private convertBetweenPayCurrencies(amount: number, fromPay: number, toPay: number): number {
    const from = Number(fromPay) || 1;
    const to = Number(toPay) || 1;
    if (from === to || !amount) return amount;

    const rate = this.getPayConversionRate() || 1;
    if (from === 1 && to === 2) return amount / rate; // AED → USD
    if (from === 2 && to === 1) return amount * rate; // USD → AED
    return amount;
  }

  private setReceivedAmountValue(amount: number): void {
    const value = Number(Number(amount || 0).toFixed(2));
    // setValue on control (not group patchValue) so UI always updates
    this.invoiceForm.get('received_amount')?.setValue(value, { emitEvent: false });
  }

  /**
   * Apply AED/USD payment-currency change to received_amount.
   * Always recalculates full-payment amount from invoice total (sales + purchase).
   */
  private applyReceivedAmountForPayCurrency(oldPay: number, newPay: number): void {
    const isFullPayment = !!this.invoiceForm.get('full_payment')?.value;
    const current = Number(this.invoiceForm.get('received_amount')?.value) || 0;

    if (isFullPayment) {
      const converted = this.getFullPaymentAmountInPayCurrency(newPay);
      this.setReceivedAmountValue(converted);
      return;
    }

    if (current > 0 && oldPay !== newPay) {
      const converted = this.convertBetweenPayCurrencies(current, oldPay, newPay);
      this.setReceivedAmountValue(converted);
    }
  }

  /** When user changes AED/USD on Amount Paid/Received — convert received_amount. */
  onInvPayCurrencyChange(): void {
    this.isProcessingCurrencyChange = true;

    const newPay = Number(this.invoiceForm.get('inv_pay_currency')?.value) || 1;
    const oldPay = Number(this.previousInvPayCurrency) || 1;

    this.applyReceivedAmountForPayCurrency(oldPay, newPay);
    this.previousInvPayCurrency = newPay;

    setTimeout(() => {
      this.isProcessingCurrencyChange = false;
    }, 150);
  }

  getReceivableInPaymentCurrency(): any {
    const finalTotalAmount = Number(this.invoiceForm.get('final_total_amount')?.value) || 0;
    const receivedAmount = Number(this.invoiceForm.get('received_amount')?.value) || 0;
    const currency = Number(this.invoiceForm.get('currency')?.value);
    const invPayCurrency = Number(this.invoiceForm.get('inv_pay_currency')?.value);
    const fullPayment = this.invoiceForm.get('full_payment')?.value;

    // console.log('🧮 Receivable Calculation in Payment Currency:');
    // console.log('- Final Total Amount:', finalTotalAmount);
    // console.log('- Received Amount:', receivedAmount);
    // console.log('- Invoice Currency:', currency);
    // console.log('- Payment Currency:', invPayCurrency);
    // console.log('- Full Payment:', fullPayment);

    // If full payment is checked, receivable should be 0
    if (fullPayment) {
      console.log('💰 Full payment checked - setting receivable to 0');
      this.invoiceForm.patchValue({
        receivable: 0
      }, { emitEvent: false });
      return '0.00';
    }

    let receivableAmount = 0;

    // Calculate receivable based on currency scenario
    if (currency === invPayCurrency) {
      // Same currency - simple subtraction
      receivableAmount = finalTotalAmount - receivedAmount;
      // console.log('- Same currency calculation:', finalTotalAmount, '-', receivedAmount, '=', receivableAmount);
    } else {
      // Different currencies - need to convert received amount to invoice currency first
      if (currency === 1 && invPayCurrency === 2) {
        // Invoice in AED, Payment in USD
        // Convert received USD to AED first, then calculate receivable
        let receivedAmountInAED = receivedAmount;
        // if(this.invoiceForm.get('full_payment')?.value==true){
        // receivedAmountInAED=finalTotalAmount

        if (this.inset_data?.is_currency_conversion) {
          receivedAmountInAED = receivedAmount * (this.inset_data.currency_conversion_rate || 1);
          console.log('- Converting received USD to AED:', receivedAmount, '×', this.inset_data.currency_conversion_rate, '=', receivedAmountInAED);
        } else {
          const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
          receivedAmountInAED = receivedAmount * exchangeRate;
          console.log('- Converting received USD to AED:', receivedAmount, '×', exchangeRate, '=', receivedAmountInAED);
        }
        // }
        // Calculate receivable in AED
        const receivableInAED = finalTotalAmount - receivedAmountInAED;
        // console.log('- Receivable in AED:', finalTotalAmount, '-', receivedAmountInAED, '=', receivableInAED);

        // Convert receivable back to USD
        if (this.inset_data?.is_currency_conversion) {
          receivableAmount = receivableInAED / (this.inset_data.currency_conversion_rate || 1);
          console.log('- Converting receivable AED to USD:', receivableInAED, '÷', this.inset_data.currency_conversion_rate, '=', receivableAmount);
        } else {
          const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
          receivableAmount = receivableInAED / exchangeRate;
          console.log('- Converting receivable AED to USD:', receivableInAED, '÷', exchangeRate, '=', receivableAmount);
        }
      } else if (currency === 2 && invPayCurrency === 1) {
        // Invoice in USD, Payment in AED
        // Convert received AED to USD first, then calculate receivable
        let receivedAmountInUSD = receivedAmount;
        if (this.inset_data?.is_currency_conversion) {
          receivedAmountInUSD = receivedAmount / (this.inset_data.currency_conversion_rate || 1);
          // console.log('- Converting received AED to USD:', receivedAmount, '÷', this.inset_data.currency_conversion_rate, '=', receivedAmountInUSD);
        } else {
          const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
          receivedAmountInUSD = receivedAmount / exchangeRate;
          // console.log('- Converting received AED to USD:', receivedAmount, '÷', exchangeRate, '=', receivedAmountInUSD);
        }

        // Calculate receivable in USD
        const receivableInUSD = finalTotalAmount - receivedAmountInUSD;
        // console.log('- Receivable in USD:', finalTotalAmount, '-', receivedAmountInUSD, '=', receivableInUSD);

        // Convert receivable back to AED
        if (this.inset_data?.is_currency_conversion) {
          receivableAmount = receivableInUSD * (this.inset_data.currency_conversion_rate || 1);
          // console.log('- Converting receivable USD to AED:', receivableInUSD, '×', this.inset_data.currency_conversion_rate, '=', receivableAmount);
        } else {
          const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
          receivableAmount = receivableInUSD * exchangeRate;
          // console.log('- Converting receivable USD to AED:', receivableInUSD, '×', exchangeRate, '=', receivableAmount);
        }
      }else if(currency !==1 && currency !==2){
        if(invPayCurrency === 1){
          // Payment currency is AED - convert received AED to invoice currency first, then calculate receivable
          const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
          let receivedAmountInInvoiceCurrency = receivedAmount / exchangeRate; // Convert AED to invoice currency
          // console.log('- Converting received AED to invoice currency:', receivedAmount, '÷', exchangeRate, '=', receivedAmountInInvoiceCurrency);
          
          // Calculate receivable in invoice currency
          const receivableInInvoiceCurrency = finalTotalAmount - receivedAmountInInvoiceCurrency;
          // console.log('- Receivable in invoice currency:', finalTotalAmount, '-', receivedAmountInInvoiceCurrency, '=', receivableInInvoiceCurrency);
          
          // Convert receivable back to AED
          receivableAmount = receivableInInvoiceCurrency * exchangeRate;
          // console.log('- Converting receivable to AED (currency other):', receivableInInvoiceCurrency, '×', exchangeRate, '=', receivableAmount);
        }else if(invPayCurrency === 2){
          // Payment currency is USD - convert received USD to invoice currency first, then calculate receivable
          const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;
          const conversionRate = this.inset_data.currency_conversion_rate || 1;
          let receivedAmountInInvoiceCurrency = (receivedAmount * conversionRate) / exchangeRate; // Convert USD to invoice currency
          // console.log('- Converting received USD to invoice currency:', receivedAmount, '×', conversionRate, '÷', exchangeRate, '=', receivedAmountInInvoiceCurrency);
          // 
          // Calculate receivable in invoice currency
          const receivableInInvoiceCurrency = finalTotalAmount - receivedAmountInInvoiceCurrency;
          // console.log('- Receivable in invoice currency:', finalTotalAmount, '-', receivedAmountInInvoiceCurrency, '=', receivableInInvoiceCurrency);
          
          // Convert receivable back to USD
          receivableAmount = (receivableInInvoiceCurrency * exchangeRate) / conversionRate;
          // console.log('- Converting receivable to USD (currency other):', receivableInInvoiceCurrency, '×', exchangeRate, '÷', conversionRate, '=', receivableAmount);
        }
      }
    }

    // console.log('- Final Receivable Amount (in payment currency):', receivableAmount);

    // Update the receivable field in the form
    this.invoiceForm.patchValue({
      receivable: receivableAmount
    }, { emitEvent: false });

    // Ensure it's a valid number before calling toFixed
    const numericValue = Number(receivableAmount);
    if (isNaN(numericValue) || !isFinite(numericValue)) {
      return '0.00';
    }

    return numericValue.toFixed(2);
  }

  getUSDAmount(): any {
    const totalAmount = this.invoiceForm.get('final_total_amount')?.value || 0;
    const currency = Number(this.invoiceForm.get('currency')?.value);
    const exchangeRate = this.invoiceForm.get('exchange_rate')?.value || 1;
    
    if (!this.inset_data || !this.inset_data.is_currency_conversion) {
      return '0.00';
    }

    const conversionRate = this.inset_data.currency_conversion_rate || 1;
    let usdAmount = 0;

    // if (currency === 1) { // Currency is 1 - convert AED to USD
    //   usdAmount = totalAmount / conversionRate;
    // } else if (currency === 2) { // Currency is 2 - amount is already in USD
    //   usdAmount = totalAmount;
    // } else { // Currency is neither 1 nor 2 - convert to USD
      usdAmount = Number(this.getAEDAmount()) /conversionRate;
    // }

    if (isNaN(usdAmount) || !isFinite(usdAmount)) {
      return '0.00';
    }

    return Number(usdAmount).toFixed(2);
  }
  getcurrency(){
   
    return this.api.getcurrencies();
  }
  getcurrencysecond(){
   
    return this.api.getcurrenciesecond();
  }

  getAEDAmount(): string {
    const totalAmount = this.invoiceForm.get('final_total_amount')?.value || 0;
    const currency = Number(this.invoiceForm.get('currency')?.value);
    const exchangeRate = this.invoiceForm.get('exchange_rate')?.value || 1;
    
    if (!this.inset_data || !this.inset_data.is_currency_conversion) {
      return '0.00';
    }

    const conversionRate = this.inset_data.currency_conversion_rate || 1;
    let aedAmount = 0;

    // if (currency === 1) { // Currency is 1 - amount is already in AED
    //   aedAmount = totalAmount;
    // } else if (currency === 2) { // Currency is 2 - convert USD to AED
    //   aedAmount = totalAmount * conversionRate;
    // } else { // Currency is neither 1 nor 2 - convert to AED
      aedAmount = totalAmount * exchangeRate;
    // }

    if (isNaN(aedAmount) || !isFinite(aedAmount)) {
      return '0.00';
    }

    return Number(aedAmount).toFixed(2);
  }

  getOppositeCurrencyAmount(): string {
    const totalAmount = this.invoiceForm.get('final_total_amount')?.value || 0;
    const currency = Number(this.invoiceForm.get('currency')?.value);
    const exchangeRate = this.invoiceForm.get('exchange_rate')?.value || 1;

    // console.log('🔄 Opposite Currency Amount Debug:', {
    //   totalAmount,
    //   currency,
    //   exchangeRate,
    //   isCurrencyConversion: this.inset_data?.is_currency_conversion,
    //   conversionRate: this.inset_data?.currency_conversion_rate
    // });

    // Check if inset_data exists and has required properties
    if (!this.inset_data || !this.inset_data.is_currency_conversion) {
      return '0.00';
    }

    const conversionRate = this.inset_data.currency_conversion_rate || 1;
    let oppositeAmount = 0;

    // Handle different currency scenarios based on conditions
    if (currency === 1) { // Currency is 1 - show USD amount
      // Convert from AED to USD
      oppositeAmount = totalAmount / conversionRate;
      console.log('🔄 Currency 1 (AED to USD conversion):', totalAmount, '/', conversionRate, '=', oppositeAmount);
    } else if (currency === 2) { // Currency is 2 - show AED amount
      // Convert from USD to AED
      oppositeAmount = totalAmount * conversionRate;
      console.log('🔄 Currency 2 (USD to AED conversion):', totalAmount, '*', conversionRate, '=', oppositeAmount);
    } else { // Currency is neither 1 nor 2 - show both amounts
      // For this function, we'll return USD amount when currency is not 1 or 2
      oppositeAmount = totalAmount / conversionRate; // Convert to USD
      console.log('🔄 Currency other (to USD conversion):', totalAmount, '/', conversionRate, '=', oppositeAmount);
    }

    // Handle division by zero and ensure oppositeAmount is a valid number
    if (isNaN(oppositeAmount) || !isFinite(oppositeAmount) || oppositeAmount === null || oppositeAmount === undefined) {
      return '0.00';
    }

    // Ensure oppositeAmount is a number before calling toFixed
    const numericAmount = Number(oppositeAmount);
    if (isNaN(numericAmount)) {
      return '0.00';
    }

    console.log('✅ Final opposite currency amount:', numericAmount.toFixed(2));
    return numericAmount.toFixed(2);
  }



  getOppositeCurrencyReceivableAmount(): string {
    if (!this.inset_data || !this.inset_data.is_currency_conversion) {
      return '0.00';
    }
    // const receivableAmount = Number(this.invoiceForm.get('receivable')?.value) || 0;
    const receivableAmount = Number(this.getReceivableInPaymentCurrency())
    const payCurrency = Number(this.invoiceForm.get('inv_pay_currency')?.value);
    const conversionRate = this.inset_data.currency_conversion_rate || 1;
    const exchangeRate = Number(this.invoiceForm.get('exchange_rate')?.value) || 1;

    console.log('🔍 Opposite Currency Receivable Debug:', {
      payCurrency: this.invoiceForm.get('inv_pay_currency')?.value,
      receivableAmount,
      // payCurrency,
      conversionRate,
      exchangeRate,
      isCurrencyConversion: this.inset_data?.is_currency_conversion
    });

    // Temporary debug - check all form values
    console.log('📋 Form Values:', {
      exchange_rate: this.invoiceForm.get('exchange_rate')?.value,
      currency: this.invoiceForm.get('currency')?.value,
      inv_pay_currency: this.invoiceForm.get('inv_pay_currency')?.value
    });

    let oppositeAmount = 0;
    if (payCurrency === 1) { // AED → USD
      oppositeAmount = receivableAmount / conversionRate;
      console.log('🔄 AED to USD conversion:', receivableAmount, '/', conversionRate, '=', oppositeAmount);
    } else { // USD (or other) → AED
      oppositeAmount = receivableAmount * conversionRate;
      console.log('🔄 USD to AED conversion:', receivableAmount, '*', conversionRate, exchangeRate, '=', oppositeAmount);
    }

    if (isNaN(oppositeAmount) || !isFinite(oppositeAmount)) {
      return '0.00';
    }
    console.log('✅ Final opposite currency amount:', oppositeAmount.toFixed(2));
    return oppositeAmount.toFixed(2);
  }

  onCurrencyChange() {
    // Set flag to prevent checkbox interference during currency changes
    this.isProcessingCurrencyChange = true;

    // Handle currency change logic here if needed
    // For example, you could update exchange rate or perform other actions
    // if (this.invoiceForm.get('invoice_type')?.value == 2) {
    console.log(this.inset_data.curency_conversion,this.inset_data.default_currency,'this.inset_data',this.invoiceForm.get('currency')?.value);
    if (this.inset_data.is_currency_conversion) {
      if (this.invoiceForm.get('currency')?.value == this.inset_data.curency_conversion) {
        this.invoiceForm.patchValue({
          exchange_rate: this.inset_data.currency_conversion_rate || 1,
        })
        this.invoiceForm.get('exchange_rate')?.disable()

      } else if (this.invoiceForm.get('currency')?.value == this.inset_data.default_currency) {
          this.invoiceForm.patchValue({
            exchange_rate: 1,
          })
          this.invoiceForm.get('exchange_rate')?.disable()
      }else{
        this.invoiceForm.patchValue({
          exchange_rate: 1,
        })
        this.invoiceForm.get('exchange_rate')?.enable()
      }
    } else {
      this.invoiceForm.patchValue({
        exchange_rate: 1,
      })
      if(this.invoiceForm.get('currency')?.value==this.inset_data.default_currency){
        this.invoiceForm.get('exchange_rate')?.disable()
      }else{
        this.invoiceForm.get('exchange_rate')?.enable()
      }
      
    }
 
      //  if(this.inset_data.is_currency_conversion){
      //   this.invoiceForm.get('exchange_rate')?.disable()
      //  }else{
      //  }
    // } else {
    //   if (this.inset_data.is_currency_conversion) {
    //     if (this.invoiceForm.get('currency')?.value == 2) {
    //       this.invoiceForm.patchValue({
    //         exchange_rate: this.inset_data.currency_conversion_rate || 1
    //       })
    //       this.invoiceForm.get('exchange_rate')?.disable()
    //     } else {
    //       this.invoiceForm.patchValue({
    //         exchange_rate: 1
    //       })
    //       this.invoiceForm.get('exchange_rate')?.enable()
    //     }
    //   } else {
    //     this.invoiceForm.patchValue({
    //       exchange_rate: 1
    //     })
    //     this.invoiceForm.get('exchange_rate')?.enable()
    //   }

    // }

    // When currency changes, uncheck full payment and clear received amount
    const isFullPayment = this.invoiceForm.get('full_payment')?.value;
    if (isFullPayment) {
      console.log('💱 Currency changed - unchecking full payment and clearing received amount');
      this.invoiceForm.patchValue({
        full_payment: false,
        received_amount: '0.00'
      }, { emitEvent: false });
    }

    console.log('Currency changed:', this.invoiceForm.get('currency')?.value);

    // Reset flag after a short delay to allow form changes to complete
    setTimeout(() => {
      this.isProcessingCurrencyChange = false;
    }, 100);
  }

  // Bank selection methods
  onBankToggle(bankId: number): void {
    const currentBanks = this.invoiceForm.get('bank')?.value || [];
    const index = currentBanks.indexOf(bankId);

    if (index > -1) {
      // Remove bank if already selected
      currentBanks.splice(index, 1);
    } else {
      // Add bank if not selected
      currentBanks.push(bankId);
    }

    this.invoiceForm.get('bank')?.setValue(currentBanks);
  }

  isBankSelected(bankId: number): boolean {
    const currentBanks = this.invoiceForm.get('bank')?.value || [];
    return currentBanks.includes(bankId);
  }

  removeBank(bankId: number): void {
    const currentBanks = this.invoiceForm.get('bank')?.value || [];
    const index = currentBanks.indexOf(bankId);
    if (index > -1) {
      currentBanks.splice(index, 1);
      this.invoiceForm.get('bank')?.setValue(currentBanks);
    }
  }

  getSelectedBanks(): any[] {
    const selectedBankIds = this.invoiceForm.get('bank')?.value || [];
    return this.uaeBanks.filter(bank => selectedBankIds.includes(bank.id));
  }

  onHandoverToChange(): void {
    console.log('🔥 onHandoverToChange() FUNCTION CALLED!');

    // Only set the flag if this is a real user change (not a form reset)
    const handoverToValue = this.invoiceForm.get('handover_to')?.value;
    if (handoverToValue === null) {
      console.log('🔥 Skipping currency change flag - handover_to is null (likely form reset)');
      return;
    }

    // Only set the currency change flag if we're actually changing payment currency
    const receivedAmountBy = this.invoiceForm.get('received_amount_by')?.value;
    const currentInvPayCurrency = this.invoiceForm.get('inv_pay_currency')?.value;

    let newInvPayCurrency = 1; // Default to AED

    if (receivedAmountBy == 1) {
      const cash = this.cashList.find((c: any) => c.id == handoverToValue);
      if (cash && cash.cashTypeCode == 'USD') {
        newInvPayCurrency = 2; // USD
      }
    } else {
      const bank = this.uaeBanks.find((b: any) => b.id == handoverToValue);
      if (bank && bank.bankTypeCode == 'USD') {
        newInvPayCurrency = 2; // USD
      }
    }

    // Only set the flag if the payment currency is actually changing
    if (currentInvPayCurrency !== newInvPayCurrency) {
      this.isProcessingCurrencyChange = true;
      console.log('🔥 Setting currency change flag - payment currency changing from', currentInvPayCurrency, 'to', newInvPayCurrency);
    } else {
      console.log('🔥 No currency change detected - keeping checkbox logic active');
    }

    // Set the payment currency based on selected cash/bank
    this.invoiceForm.get('inv_pay_currency')?.setValue(newInvPayCurrency);

    // Auto-copy the converted amount to received_amount ONLY if full payment is checked
    const isFullPayment = this.invoiceForm.get('full_payment')?.value;

    if (isFullPayment) {
      const invPayCurrency = Number(this.invoiceForm.get('inv_pay_currency')?.value) || 1;
      const receivedAmount = this.getFullPaymentAmountInPayCurrency(invPayCurrency);
      this.setReceivedAmountValue(receivedAmount);
    } else {
      this.setReceivedAmountValue(0);
    }

    this.previousInvPayCurrency = Number(this.invoiceForm.get('inv_pay_currency')?.value) || 1;

    // Reset flag after a short delay to allow form changes to complete
    setTimeout(() => {
      this.isProcessingCurrencyChange = false;
    }, 150);
  }

  // Update VAT percentage based on VAT category selection
  onVatCategoryChange(itemIndex: number, vatCategory: string) {
    const item = this.items.at(itemIndex);
    if (item) {
      // Set VAT category
      item.get('vat_category')?.setValue(vatCategory);
      
      // Update VAT percentage based on category
      let vatPercentage = 0;
      switch (vatCategory) {
        case '1': // Standard
          // For standard VAT, set to default UAE VAT rate (5%) if current rate is 0
          const currentVatRate = Number(item.get('vat')?.value) || 0;
          if (currentVatRate === 0) {
            vatPercentage = this.getDefaultVatRate(item.get('item_id')?.value);
            item.get('vat')?.setValue(vatPercentage);
          }
          break;
        case '2': // Zero
          vatPercentage = 0;
          item.get('vat')?.setValue(vatPercentage);
          break;
        case '3': // Exempt
          vatPercentage = 0;
          item.get('vat')?.setValue(vatPercentage);
          break;
        default:
          // Keep existing VAT rate
          break;
      }
      
      // Recalculate totals with the updated VAT values
      const currentItems = this.items.value;
      const extraCharges = this.invoiceForm.get('extra_charge')?.value || [];
      const receivedAmount = this.invoiceForm.get('received_amount')?.value || 0;
      this.calculateTotals(currentItems, extraCharges, receivedAmount);
    }
  }

  // Handle VAT rate changes and auto-update VAT category
  onVatRateChange(itemIndex: number) {
    const item = this.items.at(itemIndex);
    if (item) {
      const vatRate = Number(item.get('vat')?.value) || 0;
      
      // Auto-update VAT category based on rate
      if (vatRate === 0) {
        // If VAT rate is 0, it could be Zero or Exempt
        // Keep current category if it's already Zero or Exempt, otherwise set to Zero
        const currentCategory = item.get('vat_category')?.value;
        if (currentCategory !== '2' && currentCategory !== '3') {
          item.get('vat_category')?.setValue('2'); // Default to Zero
        }
      } else if (vatRate > 0) {
        // Any positive VAT rate should be Standard
        item.get('vat_category')?.setValue('1');
      }
      
      // Recalculate totals with the updated VAT values
      const currentItems = this.items.value;
      const extraCharges = this.invoiceForm.get('extra_charge')?.value || [];
      const receivedAmount = this.invoiceForm.get('received_amount')?.value || 0;
      this.calculateTotals(currentItems, extraCharges, receivedAmount);
    }
  }

  // Validate VAT consistency across all items
  validateVatConsistency(): boolean {
    let isValid = true;
    const items = this.items.controls;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as FormGroup;
      const vatRate = Number(item.get('vat')?.value) || 0;
      const vatCategory = item.get('vat_category')?.value;
      
      // Check for inconsistencies
      if (vatRate === 0 && vatCategory === '1') {
        // Standard VAT with 0% rate is invalid
        this.toast.show('Warning', `Item ${i + 1}: Standard VAT cannot have 0% rate`, 'warning');
        isValid = false;
      } else if (vatRate > 0 && (vatCategory === '2' || vatCategory === '3')) {
        // Zero/Exempt VAT with positive rate is invalid
        this.toast.show('Warning', `Item ${i + 1}: Zero/Exempt VAT cannot have positive rate`, 'warning');
        isValid = false;
      }
    }
    
    return isValid;
  }

  // Get default VAT rate for an item (from item master data)
  getDefaultVatRate(itemId: number): number {
    // This would typically come from the item master data
    // For now, return the default UAE VAT rate
    return 5;
  }

  // Reset VAT to default for an item
  resetVatToDefault(itemIndex: number) {
    const item = this.items.at(itemIndex);
    if (item) {
      const defaultVatRate = this.getDefaultVatRate(item.get('item_id')?.value);
      item.get('vat')?.setValue(defaultVatRate);
      item.get('vat_category')?.setValue('1'); // Set to Standard
      // Recalculate totals with the updated VAT values
      const currentItems = this.items.value;
      const extraCharges = this.invoiceForm.get('extra_charge')?.value || [];
      const receivedAmount = this.invoiceForm.get('received_amount')?.value || 0;
      this.calculateTotals(currentItems, extraCharges, receivedAmount);
    }
  }

  showTooltip(event: any): void {
    const value = this.invoiceForm.get('received_amount')?.value;
    if (value && value.toString().length > 8) {
      // Create a custom tooltip for large numbers
      const tooltip = document.createElement('div');
      tooltip.id = 'custom-tooltip';
      tooltip.textContent = value.toLocaleString();
      tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        pointer-events: none;
      `;

      const rect = event.target.getBoundingClientRect();
      tooltip.style.left = rect.left + 'px';
      tooltip.style.top = (rect.top - 40) + 'px';

      document.body.appendChild(tooltip);
    }
  }

  hideTooltip(): void {
    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  onAmountFocus(event: any): void {
    // Apply focus styling (width and font-size are now permanent in HTML)
    // event.target.style.backgroundColor = '#fff3cd';
    // event.target.style.border = '2px solid #007bff';
    // event.target.style.borderRadius = '4px';
    // event.target.style.boxShadow = '0 0 10px rgba(0,123,255,0.3)';

    // // Select all text for easy replacement
    // setTimeout(() => {
    //   event.target.select();
    // }, 100);
  }

  onAmountBlur(): void {
    // Reset the input field styling when focus is lost
    // if (this.amountInputRef?.nativeElement) {
    //   const input = this.amountInputRef.nativeElement;
    //   input.style.width = '';
    //   input.style.fontSize = '';
    //   input.style.backgroundColor = '';
    //   input.style.border = '';
    //   input.style.borderRadius = '';
    //   input.style.boxShadow = '';
    // }
  }

  onAmountClick(event: any): void {
    // Focus the input and select all text
    // event.target.focus();
    // setTimeout(() => {
    //   event.target.select();
    // }, 100);
  }
}
