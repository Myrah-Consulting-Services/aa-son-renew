import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import { BankToBank } from '../bank-to-bank/bank-to-bank';
import { CashDeposit } from '../cash-deposit/cash-deposit';
import { CashWithdraw } from '../cash-withdraw/cash-withdraw';
import { PaymentIn } from '../payment-in/payment-in';
import { PaymentOut } from '../payment-out/payment-out';
import { CreateJv } from '../../jv/create-jv/create-jv';
import { CreateInvoice } from '../../Invoices/create-invoice/create-invoice';
import { CreateExpenseComponent } from '../../Expense/create-expense/create-expense';

@Component({
  selector: 'app-cash-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './cash-detail.html',
  styleUrl: './cash-detail.scss'
})
export class CashDetail implements OnInit {
  cashId: string | null = null;
  cashData: any = null;
  filterForm!: FormGroup;
  cashLedgerData: any[] = [];
  cashOpeningBalance: any = null;
  isLoadingCashLedger: boolean = false;
  
  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalData: number = 0;
  limit: number = 10;
  hasNextPage: boolean = false;
  hasPreviousPage: boolean = false;
  
  // Make Math available in template
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    private modalService: NgbModal
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.cashId = params.get('id');
      if (this.cashId) {
        this.loadCashData();
        this.getCashLedgers({ id: this.cashId }, 1);
      }
    });
  }

  initForm() {
    this.filterForm = this.fb.group({
      start_date: [this.api.getDateRange().start_date, Validators.required],
      end_date: [this.api.getDateRange().end_date, Validators.required],
      company: [this.api.getUserCompany()]
    });
  }

  loadCashData() {
    if (!this.cashId) return;
    
    this.api.get('/money/list-cash/' + this.api.getUserCompany() + '/').subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.cashData = response.data.find((cash: any) => cash.id === parseInt(this.cashId || '0'));
        }
      },
      error: (error) => {
        console.error('Error loading cash data:', error);
        this.toast.show('Error', 'Failed to load cash data', 'danger');
      }
    });
  }

  onSubmit() {
    if (this.filterForm.valid && this.cashId) {
      this.getCashLedgers({ id: this.cashId }, 1);
      this.toast.show('Success', 'Filter applied successfully', 'success');
    } else {
      this.toast.show('Error', 'Please fill all required fields', 'danger');
    }
  }

  getCashLedgers(cash: any, page: number = 1) {
    this.isLoadingCashLedger = true;
    this.currentPage = page;
    
    const formData = { 
      ...this.filterForm.value, 
      page_number: page,
      limit: this.limit
    };
    
    this.api.post('/money/get-cash-ledger/' + cash.id + '/', formData).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.cashLedgerData = response.data || [];
          this.cashOpeningBalance = response.opening_balance || null;
          
          if (response.pagination_data) {
            this.totalData = response.pagination_data.total_data || 0;
            this.totalPages = response.pagination_data.total_pages || 1;
            this.currentPage = response.pagination_data.page_number || 1;
            this.hasNextPage = response.pagination_data.next_page || false;
            this.hasPreviousPage = response.pagination_data.previous_page || false;
            // Update limit from API response - this ensures dropdown shows correct value
            if (response.pagination_data.limit) {
              const apiLimit = Number(response.pagination_data.limit);
              // Ensure the limit is one of the valid options
              const validLimits = this.getLimitOptions();
              this.limit = validLimits.includes(apiLimit) ? apiLimit : this.limit;
            }
          }
        }
        this.isLoadingCashLedger = false;
      },
      error: (error) => {
        console.error('Error loading cash ledger:', error);
        this.toast.show('Error', 'Failed to load cash ledger data', 'danger');
        this.isLoadingCashLedger = false;
      }
    });
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages || !this.cashId) {
      return;
    }
    this.getCashLedgers({ id: this.cashId }, page);
  }

  onNextPage() {
    if (this.hasNextPage && this.cashId) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  onPreviousPage() {
    if (this.hasPreviousPage && this.cashId) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  getLimitOptions(): number[] {
    return [10, 25, 50, 100];
  }

  onLimitChange(newLimit: number) {
    if (this.cashId) {
      this.limit = newLimit;
      this.currentPage = 1; // Reset to first page when changing limit
      this.getCashLedgers({ id: this.cashId }, 1);
    }
  }

  formatAmount(amount: any): string {
    if (amount === null || amount === undefined || amount === '') {
      return '-';
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return amount.toString();
    }
    
    return numAmount.toFixed(2);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return date;
      }
      
      return dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return date;
    }
  }

  getOpeningBalanceDisplay(): string {
    if (!this.cashOpeningBalance) return '';
    
    return this.cashOpeningBalance.balance || 
           this.cashOpeningBalance.bank_balance || 
           this.cashOpeningBalance.cash_balance || 
           '0.00';
  }

  getBalanceClass(balance: string): string {
    if (!balance) return '';
    
    if (balance.includes('Dr')) {
      return 'text-danger fw-semibold';
    } else if (balance.includes('Cr')) {
      return 'text-success fw-semibold';
    }
    
    return 'fw-semibold';
  }

  editEntry(entry: any) {
    this.openbankmodal(entry);
  }

  deleteEntry(entry: any) {
    if (confirm(`Are you sure you want to delete this entry: ${entry.particular}?`)) {
      console.log('Deleting entry:', entry);
      this.toast.show('Success', `Entry deleted: ${entry.particular}`, 'success');
      if (this.cashId) {
        this.getCashLedgers({ id: this.cashId }, this.currentPage);
      }
    }
  }

  openbankmodal(modalType: any) {
    let componentToOpen: any;
    let modalSize: string = 'lg';
    
    switch (modalType.type) {
      case 'to_bank':
        componentToOpen = BankToBank;
        modalSize = 'lg';
        break;
      case 'deposit':
        componentToOpen = CashDeposit;
        modalSize = 'lg';
        break;
      case 'withdrawal':
        componentToOpen = CashWithdraw;
        modalSize = 'lg';
        break;
      case 'payment_in':
        componentToOpen = PaymentIn;
        modalSize = 'xl';
        break;
      case 'payment_out':
        componentToOpen = PaymentOut;
        modalSize = 'xl';
        break;
      case 'voucher':
        componentToOpen = CreateJv;
        modalSize = 'lg';
        break;
      case 'expense':
        componentToOpen = CreateExpenseComponent;
        modalSize = 'xl';
        break;
      case 'purchase':
      case 'sale':
        componentToOpen = CreateInvoice;
        modalSize = 'xl';
        break;
      default:
        console.warn('Unknown modal type:', modalType);
        return;
    }
    
    if (componentToOpen) {
      const modalRef = this.modalService.open(componentToOpen, { 
        centered: true,
        size: modalSize,
        backdrop: 'static',
        keyboard: false
      });
      
      if (modalType.type === 'voucher') {
        modalRef.componentInstance.editinvoiceId = modalType.invoice_no;
      } else {
        modalRef.componentInstance.editinvoiceId = modalType.id;
      }
      
      modalRef.componentInstance.isModal = true;
      modalRef.componentInstance.isEditMode = false;
      
      modalRef.result.then((result) => {
        if (result && this.cashId) {
          this.getCashLedgers({ id: this.cashId }, this.currentPage);
        }
      }).catch(() => {
        // Modal was dismissed
      });
    }
  }
}

