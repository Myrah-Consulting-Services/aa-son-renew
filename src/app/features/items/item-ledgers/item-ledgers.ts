import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

interface ItemLedgerEntry {
  type: string;
  date: string;
  item_name: string;
  purchase_amount?: number;
  purchase_quantity?: number;
  sales_amount?: number;
  sales_quantity?: number;
  stock_balance: number;
}

interface PaginationData {
  total_data: number;
  limit: number;
  total_pages: number;
  page_number: number;
  next_page: boolean;
  previous_page: boolean;
}

interface ItemLedgerResponse {
  status: number;
  data: ItemLedgerEntry[];
  pagination_data: PaginationData;
  opening_balance: number;
  current_balance: number;
}

@Component({
  selector: 'app-item-ledgers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './item-ledgers.html',
  styleUrl: './item-ledgers.scss'
})
export class ItemLedgers implements OnInit, OnChanges {
  @Input() itemId: any;
  itemLedgerForm!: FormGroup;
  ledgerData: ItemLedgerEntry[] = [];
  openingBalance: number = 0;
  currentBalance: number = 0;
  paginationData: PaginationData | null = null;
  currentPage: number = 1;
  currentLimit: number = 10;
  isLoading: boolean = false;
  hasData: boolean = false;
  searchTerm: string = '';
  private searchTimeout: any;

  constructor(private fb: FormBuilder, private api: Api, private toast: ToastService) {}

  ngOnInit(): void {
    this.initForm();
    // Form is always initialized, but data only loads if itemId is available
    if (this.itemId) {
      this.loadInitialData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle itemId changes
    if (changes['itemId']) {
      console.log('Item ID changed:', {
        previous: changes['itemId'].previousValue,
        current: changes['itemId'].currentValue,
        firstChange: changes['itemId'].firstChange
      });
      
      if (this.itemId && !changes['itemId'].firstChange) {
        console.log('Item ID changed to:', this.itemId);
        // Reset pagination and search when item changes
        this.currentPage = 1;
        this.searchTerm = '';
        this.ledgerData = [];
        this.openingBalance = 0;
        this.currentBalance = 0;
        this.paginationData = null;
        this.hasData = false;
        
        // Load data for new item
        this.loadInitialData();
      }
    }
  }

  initForm(): void {
    const dateRange = this.api.getDateRange();
    console.log('Setting default date range:', dateRange);
    
    this.itemLedgerForm = this.fb.group({
      start_date: [dateRange.start_date, Validators.required],
      end_date: [dateRange.end_date, Validators.required],
      item: [this.itemId],
      company: [this.api.getUserCompany()],
    });
  }

  loadInitialData(): void {
    // Wait for form to be initialized, then load data
    this.itemLedgerForm.patchValue({
      item: this.itemId,
      company: this.api.getUserCompany()
    });
    setTimeout(() => {
      if (this.itemLedgerForm.valid) {
        this.onSubmit();
      }
    }, 100);
  }

  onSubmit(): void {
    if (!this.itemId) {
      console.warn('No item ID available');
      this.toast?.show('Warning', 'Please select an item first', 'warning');
      return;
    }
    
    if (this.itemLedgerForm.valid) {
      this.isLoading = true;
      this.currentPage = 1; // Reset to first page when submitting
      this.searchTerm = ''; // Clear search term when submitting new report
      
      const formData = this.itemLedgerForm.value;
      const requestData = {
        ...formData,
        page_number: 1,
        limit: this.currentLimit
      };
      
      console.log('Form submitted:', requestData);
      
      this.api.post(`/items/item-ledger/s=${this.searchTerm}/`, requestData).subscribe({
        next: (res: any) => {
          console.log('Initial data loaded:', res);
          this.handleLedgerResponse(res as ItemLedgerResponse);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching item ledger data:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onSearch(): void {
    if (!this.itemId) {
      console.warn('No item ID available for search');
      this.toast.show('Warning', 'Please select an item first', 'warning');
      return;
    }
    
    console.log('Searching for:', this.searchTerm);
    
    // Reset to first page when searching
    this.currentPage = 1;
    
    // Call API with search term
    if (this.itemLedgerForm.valid) {
      this.isLoading = true;
      
      const formData = this.itemLedgerForm.value;
      const requestData = {
        ...formData,
        page_number: 1,
        limit: this.currentLimit
      };
      
      console.log('Search API call with data:', requestData);
      console.log('Search term:', this.searchTerm);
      
      this.api.post(`/items/item-ledger/s=${this.searchTerm}/`, requestData).subscribe({
        next: (res: any) => {
          console.log('Search results loaded:', res);
          this.handleLedgerResponse(res as ItemLedgerResponse);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching item ledger data:', error);
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

  handleLedgerResponse(response: ItemLedgerResponse): void {
    if (response.status === 200) {
      this.ledgerData = response.data;
      this.openingBalance = response.opening_balance;
      this.currentBalance = response.current_balance;
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
    if (!this.itemId) {
      console.warn('No item ID available for pagination');
      this.toast.show('Warning', 'Please select an item first', 'warning');
      return;
    }
    
    // Check if we have the required form data for pagination
    if (!this.itemLedgerForm.valid) {
      console.log('Form not valid, cannot load page data');
      return;
    }

    this.isLoading = true;
    const formData = this.itemLedgerForm.value;
    
    // Add pagination parameters
    const requestData = {
      ...formData,
      page_number: page,
      limit: this.currentLimit // Use current limit
    };
    
    console.log('Loading page:', page, 'with data:', requestData);
    console.log('API endpoint:', `/item/item-ledger/${this.itemId}/s=${this.searchTerm}/`);
    
    // Test the API call
    this.api.post(`/items/item-ledger/s=${this.searchTerm}/`, requestData).subscribe({
      next: (res: any) => {
        console.log('Page data loaded successfully:', res);
        console.log('Response status:', res.status);
        console.log('Response data length:', res.data?.length);
        console.log('Pagination data:', res.pagination_data);
        
        this.handleLedgerResponse(res as ItemLedgerResponse);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching item ledger data for page:', page, error);
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

  formatDate(date: string): string {
    if (!date) return '-';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return date;
      }
      // Format as DD-MM-YYYY
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return date;
    }
  }

  getTypeClass(type: string): string {
    if (type === 'purchase_invoice') return 'text-success';
    if (type === 'sales_invoice') return 'text-danger';
    return '';
  }

  getTypeIcon(type: string): string {
    if (type === 'purchase_invoice') return 'bi-arrow-down-circle';
    if (type === 'sales_invoice') return 'bi-arrow-up-circle';
    return 'bi-circle';
  }

  markFormGroupTouched(): void {
    Object.keys(this.itemLedgerForm.controls).forEach(key => {
      const control = this.itemLedgerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Debug method to test pagination
  testPagination(): void {
    console.log('=== ITEM LEDGER PAGINATION DEBUG INFO ===');
    console.log('Item ID:', this.itemId);
    console.log('Current page:', this.currentPage);
    console.log('Has data:', this.hasData);
    console.log('Pagination data:', this.paginationData);
    console.log('Form valid:', this.itemLedgerForm.valid);
    console.log('Form values:', this.itemLedgerForm.value);
    console.log('Ledger data length:', this.ledgerData.length);
    console.log('=============================');
  }

  // Method to manually reload data for current item
  reloadData(): void {
    if (this.itemId) {
      console.log('Manually reloading data for item:', this.itemId);
      this.loadInitialData();
    } else {
      console.warn('Cannot reload data: No item ID available');
    }
  }
}
