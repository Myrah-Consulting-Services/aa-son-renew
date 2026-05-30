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
  selector: 'app-bank-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './bank-detail.html',
  styleUrl: './bank-detail.scss'
})
export class BankDetail implements OnInit {
  bankId: string | null = null;
  bankData: any = null;
  filterForm!: FormGroup;
  bankLedgerData: any[] = [];
  openingBalance: any = null;
  isLoadingLedger: boolean = false;
  
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
      this.bankId = params.get('id');
      if (this.bankId) {
        this.loadBankData();
        this.getbankledgers({ id: this.bankId }, 1);
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

  loadBankData() {
    if (!this.bankId) return;
    
    this.api.get('/money/list-bank/' + this.api.getUserCompany() + '/').subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.bankData = response.data.find((bank: any) => bank.id === parseInt(this.bankId || '0'));
        }
      },
      error: (error) => {
        console.error('Error loading bank data:', error);
        this.toast.show('Error', 'Failed to load bank data', 'danger');
      }
    });
  }

  onSubmit() {
    if (this.filterForm.valid && this.bankId) {
      this.getbankledgers({ id: this.bankId }, 1);
      this.toast.show('Success', 'Filter applied successfully', 'success');
    } else {
      this.toast.show('Error', 'Please fill all required fields', 'danger');
    }
  }

  getbankledgers(bank: any, page: number = 1) {
    this.isLoadingLedger = true;
    this.currentPage = page;
    
    const formData = { 
      ...this.filterForm.value, 
      page_number: page,
      limit: this.limit
    };
    
    this.api.post('/money/get-bank-ledger/' + bank.id + '/', formData).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.bankLedgerData = response.data || [];
          this.openingBalance = response.opening_balance || null;
          
          if (response.pagination_data) {
            this.totalData = response.pagination_data.total_data || 0;
            this.totalPages = response.pagination_data.total_pages || 1;
            this.currentPage = response.pagination_data.page_number || 1;
            this.hasNextPage = response.pagination_data.next_page || false;
            this.hasPreviousPage = response.pagination_data.previous_page || false;
            // Update limit from API response - this ensures dropdown shows correct value
            if (response.pagination_data.limit !== undefined && response.pagination_data.limit !== null) {
              const apiLimit = Number(response.pagination_data.limit);
              // Ensure the limit is one of the valid options
              const validLimits = this.getLimitOptions();
              if (validLimits.includes(apiLimit)) {
                this.limit = apiLimit;
              }
            }
          }
        }
        this.isLoadingLedger = false;
      },
      error: (error) => {
        console.error('Error loading bank ledger:', error);
        this.toast.show('Error', 'Failed to load bank ledger data', 'danger');
        this.isLoadingLedger = false;
      }
    });
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages || !this.bankId) {
      return;
    }
    this.getbankledgers({ id: this.bankId }, page);
  }

  onNextPage() {
    if (this.hasNextPage && this.bankId) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  onPreviousPage() {
    if (this.hasPreviousPage && this.bankId) {
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
    if (this.bankId) {
      this.limit = newLimit;
      this.currentPage = 1; // Reset to first page when changing limit
      this.getbankledgers({ id: this.bankId }, 1);
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
        if (result && this.bankId) {
          this.getbankledgers({ id: this.bankId }, this.currentPage);
        }
      }).catch(() => {
        // Modal was dismissed
      });
    }
  }
}

