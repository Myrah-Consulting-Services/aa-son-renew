import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

interface ExpenseLedgerEntry {
  date: string;
  reference_no: string;
  particular: string;
  debit: number | string;
  credit: number | string;
  balance: string;
}

interface PaginationData {
  total_data: number;
  limit: number;
  total_pages: number;
  page_number: number;
  next_page: boolean;
  previous_page: boolean;
}

interface ExpenseLedgerResponse {
  status: number;
  data: ExpenseLedgerEntry[];
  pagination_data: PaginationData;
  opening_balance: number;
  current_balance: number;
}

@Component({
  selector: 'app-expense-ledger',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './expense-ledger.html',
  styleUrl: './expense-ledger.scss'
})
export class ExpenseLedger implements OnInit, OnChanges {
  @Input() expenseId: any;
  expenseLedgerForm!: FormGroup;
  ledgerData: any[] = [];
  modalRef:any;
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
    // Form is always initialized, but data only loads if expenseId is available
    if (this.expenseId) {
      this.loadInitialData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle expenseId changes
    if (changes['expenseId']) {
      console.log('Expense ID changed:', {
        previous: changes['expenseId'].previousValue,
        current: changes['expenseId'].currentValue,
        firstChange: changes['expenseId'].firstChange
      });
      
      if (this.expenseId && !changes['expenseId'].firstChange) {
        console.log('Expense ID changed to:', this.expenseId);
        // Reset pagination and search when expense changes
        this.currentPage = 1;
        this.searchTerm = '';
        this.ledgerData = [];
        this.openingBalance = 0;
        this.currentBalance = 0;
        this.paginationData = null;
        this.hasData = false;
        
        // Load data for new expense
        this.loadInitialData();
      }
    }
  }

  initForm(): void {
    const dateRange = this.api.getDateRange();
    console.log('Setting default date range:', dateRange);
    
    this.expenseLedgerForm = this.fb.group({
      start_date: [dateRange.start_date, Validators.required],
      end_date: [dateRange.end_date, Validators.required],
      expense: [this.expenseId],
      company: [this.api.getUserCompany()],
    });
  }

  loadInitialData(): void {
    // Wait for form to be initialized, then load data
    this.expenseLedgerForm.patchValue({
      expense: this.expenseId,
      company: this.api.getUserCompany()
    });
    setTimeout(() => {
      if (this.expenseLedgerForm.valid) {
        this.onSubmit();
      }
    }, 100);
  }

  onSubmit(): void {
    if (!this.expenseId) {
      console.warn('No expense ID available');
      this.toast?.show('Warning', 'Please select an expense first', 'warning');
      return;
    }
    
    if (this.expenseLedgerForm.valid) {
      this.isLoading = true;
      this.currentPage = 1; // Reset to first page when submitting
      this.searchTerm = ''; // Clear search term when submitting new report
      
      const formData = this.expenseLedgerForm.value;
      const requestData = {
        ...formData,
        page_number: 1,
        limit: this.currentLimit
      };
      
      console.log('Form submitted:', requestData);
      
      this.api.post(`/expense/list-expense/`+this.expenseId+`/`, requestData).subscribe({
        next: (res: any) => {
          console.log('Initial data loaded:', res);
          this.handleLedgerResponse(res as ExpenseLedgerResponse);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching expense ledger data:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onSearch(): void {
    if (!this.expenseId) {
      console.warn('No expense ID available for search');
      this.toast.show('Warning', 'Please select an expense first', 'warning');
      return;
    }
    
    console.log('Searching for:', this.searchTerm);
    
    // Reset to first page when searching
    this.currentPage = 1;
    
    // Call API with search term
    if (this.expenseLedgerForm.valid) {
      this.isLoading = true;
      
      const formData = this.expenseLedgerForm.value;
      const requestData = {
        ...formData,
        page_number: 1,
        limit: this.currentLimit
      };
      
      console.log('Search API call with data:', requestData);
      console.log('Search term:', this.searchTerm);
      
      this.api.post(`/expense/list-expense/`+this.expenseId+`/`, requestData).subscribe({
        next: (res: any) => {
          console.log('Search results loaded:', res);
          this.handleLedgerResponse(res as ExpenseLedgerResponse);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching expense ledger data:', error);
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

  handleLedgerResponse(response: ExpenseLedgerResponse): void {
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
    if (!this.expenseId) {
      console.warn('No expense ID available for pagination');
      this.toast.show('Warning', 'Please select an expense first', 'warning');
      return;
    }
    
    // Check if we have the required form data for pagination
    if (!this.expenseLedgerForm.valid) {
      console.log('Form not valid, cannot load page data');
      return;
    }

    this.isLoading = true;
    const formData = this.expenseLedgerForm.value;
    
    // Add pagination parameters
    const requestData = {
      ...formData,
      page_number: page,
      limit: this.currentLimit // Use current limit
    };
    
    console.log('Loading page:', page, 'with data:', requestData);
    console.log('API endpoint:', `/expense/list-expense/`+this.expenseId+`/`);
    
    // Test the API call
    this.api.post(`/expense/list-expense/`+this.expenseId+`/`, requestData).subscribe({
      next: (res: any) => {
        console.log('Page data loaded successfully:', res);
        console.log('Response status:', res.status);
        console.log('Response data length:', res.data?.length);
        console.log('Pagination data:', res.pagination_data);
        
        this.handleLedgerResponse(res as ExpenseLedgerResponse);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching expense ledger data for page:', page, error);
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
    Object.keys(this.expenseLedgerForm.controls).forEach(key => {
      const control = this.expenseLedgerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Debug method to test pagination
  testPagination(): void {
    console.log('=== EXPENSE LEDGER PAGINATION DEBUG INFO ===');
    console.log('Expense ID:', this.expenseId);
    console.log('Current page:', this.currentPage);
    console.log('Has data:', this.hasData);
    console.log('Pagination data:', this.paginationData);
    console.log('Form valid:', this.expenseLedgerForm.valid);
    console.log('Form values:', this.expenseLedgerForm.value);
    console.log('Ledger data length:', this.ledgerData.length);
    console.log('=============================');
  }

  // Method to manually reload data for current expense
  reloadData(): void {
    if (this.expenseId) {
      console.log('Manually reloading data for expense:', this.expenseId);
      this.loadInitialData();
    } else {
      console.warn('Cannot reload data: No expense ID available');
    }
  }
}
