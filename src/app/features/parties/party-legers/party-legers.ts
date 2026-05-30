import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../../../core/services/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateInvoice } from '../../Invoices/create-invoice/create-invoice';
import { PaymentIn } from '../../manage-money/payment-in/payment-in';
import { PaymentOut } from '../../manage-money/payment-out/payment-out';
import { CreateJv } from '../../jv/create-jv/create-jv';
import { CreateExpenseComponent } from '../../Expense/create-expense/create-expense';

interface LedgerEntry {
  invoice_date: string;
  invoice_no: string;
  party: number;
  particular: string;
  debit: number | string;
  credit: number | string;
  id: number;
  type: string;
  received_for_id: number | string;
  date1: string;
  balance: number;
  amount: number;
  balance_final: string;
}

interface OpeningBalance {
  receipt_date: string;
  particular: string;
  debit: string;
  credit: string;
  receipt_no: string;
  bank_balance: string;
}

interface ClosingBalance {
  receipt_date: string;
  particular: string;
  debit: string;
  credit: string;
  receipt_no: string;
  bank_balance: string;
}

interface PaginationData {
  total_data: number;
  limit: number;
  total_pages: number;
  page_number: number;
  next_page: boolean;
  previous_page: boolean;
}

interface LedgerResponse {
  status: number;
  closing_dict: ClosingBalance;
  opening_dict: OpeningBalance;
  data: LedgerEntry[];
  pagination_data: PaginationData;
}

@Component({
  selector: 'app-party-legers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './party-legers.html',
  styleUrl: './party-legers.scss'
})
export class PartyLegers implements OnInit, OnChanges {
  @Input() partyId: any
  partyLedgerForm!: FormGroup;
  ledgerData: LedgerEntry[] = [];
  openingBalance: OpeningBalance | null = null;
  closingBalance: ClosingBalance | null = null;
  paginationData: PaginationData | null = null;
  currentPage: number = 1;
  currentLimit: number = 10;
  isLoading: boolean = false;
  hasData: boolean = false;
  searchTerm: string = '';
  private searchTimeout: any;
  selectedEntry: any;
  modalRef: any;
  constructor(private fb: FormBuilder, private api: Api, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.initForm();
    // Only load data if partyId is available
    if (this.partyId) {
      this.loadInitialData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle partyId changes
    if (changes['partyId']) {
      console.log('Party ID changed:', {
        previous: changes['partyId'].previousValue,
        current: changes['partyId'].currentValue,
        firstChange: changes['partyId'].firstChange
      });
      
      if (this.partyId && !changes['partyId'].firstChange) {
        console.log('Party ID changed to:', this.partyId);
        // Reset pagination and search when party changes
        this.currentPage = 1;
        this.searchTerm = '';
        this.ledgerData = [];
        this.openingBalance = null;
        this.closingBalance = null;
        this.paginationData = null;
        this.hasData = false;
        
        // Load data for new party
        this.loadInitialData();
      }
    }
  }

  initForm(): void {
    const dateRange = this.api.getDateRange();
    console.log('Setting default date range:', dateRange);
    
    this.partyLedgerForm = this.fb.group({
      start_date: [dateRange.start_date, Validators.required],
      end_date: [dateRange.end_date, Validators.required],
      company: [this.api.getUserCompany()],
    });
  }

  loadInitialData(): void {
    // Wait for form to be initialized, then load data
    setTimeout(() => {
      if (this.partyLedgerForm.valid) {
        this.onSubmit();
      }
    }, 100);
  }

  onSubmit(): void {
    if (!this.partyId) {
      console.warn('No party ID available');
      return;
    }
    
    if (this.partyLedgerForm.valid) {
      this.isLoading = true;
      this.currentPage = 1; // Reset to first page when submitting
      this.searchTerm = ''; // Clear search term when submitting new report
      
      const formData = this.partyLedgerForm.value;
      const requestData = {
        ...formData,
        page_number: 1,
        limit: this.currentLimit
      };
      
      console.log('Form submitted:', requestData);
      
      this.api.post(`/party/party-ledger/${this.partyId}/s=${this.searchTerm}/`, requestData).subscribe({
        next: (res: any) => {
          console.log('Initial data loaded:', res);
          this.handleLedgerResponse(res as LedgerResponse);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching ledger data:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onSearch(): void {
    if (!this.partyId) {
      console.warn('No party ID available for search');
      return;
    }
    
    console.log('Searching for:', this.searchTerm);
    
    // Reset to first page when searching
    this.currentPage = 1;
    
    // Call API with search term
    if (this.partyLedgerForm.valid) {
      this.isLoading = true;
      
      const formData = this.partyLedgerForm.value;
      const requestData = {
        ...formData,
        page_number: 1,
        limit: this.currentLimit
      };
      
      console.log('Search API call with data:', requestData);
      console.log('Search term:', this.searchTerm);
      
      this.api.post(`/party/party-ledger/${this.partyId}/s=${this.searchTerm}/`, requestData).subscribe({
        next: (res: any) => {
          console.log('Search results loaded:', res);
          this.handleLedgerResponse(res as LedgerResponse);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching ledger data:', error);
          this.isLoading = false;
        }
      });
    } else {
      console.log('Form not valid for search');
    }
  }

  onSearchInput(): void {
    // Clear previous timeout
    clearTimeout(this.searchTimeout);
    
    // Set new timeout for debounced search
    this.searchTimeout = setTimeout(() => {
      // Only search if search term has at least 2 characters or is empty
      if (this.searchTerm.trim().length >= 2 || this.searchTerm.trim().length === 0) {
        this.onSearch();
      }
    }, 500); // Wait 500ms after user stops typing
  }

  exportToPDF(): void {
    console.log('Exporting to PDF...');
    // Implement PDF export functionality
  }

  exportToExcel(): void {
    console.log('Exporting to Excel...');
    // Implement Excel export functionality
  }

  handleLedgerResponse(response: LedgerResponse): void {
    if (response.status === 200) {
      this.ledgerData = response.data;
      this.openingBalance = response.opening_dict;
      this.closingBalance = response.closing_dict;
      this.paginationData = response.pagination_data;
      this.currentPage = response.pagination_data.page_number;
      this.hasData = this.ledgerData.length > 0;
    }
  }

  onPageChange(page: number): void {
    console.log('Page change requested:', page);
    console.log('Current pagination data:', this.paginationData);
    
    if (page >= 1 && page <= (this.paginationData?.total_pages || 1)) {
      console.log('Loading page:', page);
      this.currentPage = page;
      this.loadLedgerData(page);
    } else {
      console.log('Invalid page number:', page);
    }
  }

  onLimitChange(limit: number): void {
    console.log('Limit change requested:', limit);
    this.currentLimit = limit;
    this.currentPage = 1; // Reset to first page when changing limit
    this.loadLedgerData(1);
  }

  loadLedgerData(page: number): void {
    if (!this.partyId) {
      console.warn('No party ID available for pagination');
      return;
    }
    
    // Check if we have the required form data for pagination
    if (!this.partyLedgerForm.valid) {
      console.log('Form not valid, cannot load page data');
      return;
    }

    this.isLoading = true;
    const formData = this.partyLedgerForm.value;
    
    // Add pagination parameters
    const requestData = {
      ...formData,
      page_number: page,
      limit: this.currentLimit // Use current limit
    };
    
    console.log('Loading page:', page, 'with data:', requestData);
      console.log('API endpoint:', `/party/party-ledger/${this.partyId}/`);
    
    // Test the API call
    this.api.post(`/party/party-ledger/${this.partyId}/s=${this.searchTerm}/`, requestData).subscribe({
      next: (res: any) => {
        console.log('Page data loaded successfully:', res);
        console.log('Response status:', res.status);
        console.log('Response data length:', res.data?.length);
        console.log('Pagination data:', res.pagination_data);
        
        this.handleLedgerResponse(res as LedgerResponse);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching ledger data for page:', page, error);
        console.error('Error details:', error.status, error.message);
        this.isLoading = false;
      }
    });
  }

  getPageNumbers(): number[] {
    if (!this.paginationData) return [];
    
    const totalPages = this.paginationData.total_pages;
    const currentPage = this.currentPage;
    const pages: number[] = [];
    
    // Show up to 5 pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getPageRange(): string {
    if (!this.paginationData) return '0 of 0';
    
    const start = (this.currentPage - 1) * this.currentLimit + 1;
    const end = Math.min(this.currentPage * this.currentLimit, this.paginationData.total_data);
    return `${start}-${end} of ${this.paginationData.total_data}`;
  }

  getLimitOptions(): number[] {
    return [10, 25, 50, 100];
  }

  formatAmount(amount: any): string {
    if (amount === '' || amount === null || amount === undefined) return '-';
    return amount.toString();
  }

  getBalanceClass(balance: string): string {
    if (balance.includes('Dr')) return 'text-danger';
    if (balance.includes('Cr')) return 'text-success';
    return '';
  }

  markFormGroupTouched(): void {
    Object.keys(this.partyLedgerForm.controls).forEach(key => {
      const control = this.partyLedgerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Debug method to test pagination
  testPagination(): void {
    console.log('=== PAGINATION DEBUG INFO ===');
    console.log('Party ID:', this.partyId);
    console.log('Current page:', this.currentPage);
    console.log('Has data:', this.hasData);
    console.log('Pagination data:', this.paginationData);
    console.log('Form valid:', this.partyLedgerForm.valid);
    console.log('Form values:', this.partyLedgerForm.value);
    console.log('Ledger data length:', this.ledgerData.length);
    console.log('=============================');
  }

  // Method to manually reload data for current party
  reloadData(): void {
    if (this.partyId) {
      console.log('Manually reloading data for party:', this.partyId);
      this.loadInitialData();
    } else {
      console.warn('Cannot reload data: No party ID available');
    }
  }

  openModal(modal: any, entry: any): void {
    this.selectedEntry = entry;
    this.modalRef = this.modalService.open(modal, {
      centered: true,
      size: 'lg',
      backdrop: 'static'
    });
  }
  viewInvoice(entry: any) {
    let componentToOpen: any;
    let modalSize: string = 'lg'; // Default size
    
    if (entry.type === 'payment_in') {
      componentToOpen = PaymentIn;
      modalSize = 'lg'; // Medium size for payment forms
    } else if (entry.type === 'payment_out') {
      componentToOpen = PaymentOut;
      modalSize = 'lg'; // Medium size for payment forms
    } else if (entry.type === 'sales' || entry.type === 'purchase') {
      componentToOpen = CreateInvoice;
      modalSize = 'xl'; // Large size for invoice forms
    } else if (entry.type === 'voucher') {
      componentToOpen = CreateJv;
      modalSize = 'lg'; // Large size for better fit
    }else if(entry.type === 'expense'){
      componentToOpen = CreateExpenseComponent;
      modalSize = 'lg'; // Large size for better fit
    }
    
    if (componentToOpen) {
      const modalRef = this.modalService.open(componentToOpen, { 
        centered: true, 
        windowClass: entry.type === 'voucher' ? 'voucher-modal' : 'my-class',
        size: modalSize
      });
      
      // Set the editinvoiceId for edit mode
      if (entry.type === 'voucher' && entry.invoice_no) {
        // For vouchers, use invoice_no instead of id
        modalRef.componentInstance.editinvoiceId = entry.invoice_no;
      } else if (entry.id) {
        // For other types, use id
        modalRef.componentInstance.editinvoiceId = entry.id;
      }
      modalRef.componentInstance.isEditMode = true;
      // Set modal flag
      modalRef.componentInstance.isModal = true;
      
      // Handle modal result
      modalRef.result.then((result) => {
        if (result) {
          this.loadInitialData();
        }
      }).catch(() => {
        // Modal was dismissed - no action needed
      });
    }
  }
}
