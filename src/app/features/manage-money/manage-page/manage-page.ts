import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateBank } from '../create-bank/create-bank';
import { CreateCash } from '../create-cash/create-cash';
import { CashWithdraw } from '../cash-withdraw/cash-withdraw';
import { CashDeposit } from '../cash-deposit/cash-deposit';
import { BankToBank } from '../bank-to-bank/bank-to-bank';
import { PaymentIn } from '../payment-in/payment-in';
import { PaymentOut } from '../payment-out/payment-out';
import { Api } from '../../../core/services/api';
import { Reconciliation } from '../reconciliation/reconciliation';
import { ToastService } from '../../../core/services/toast.service';
import { CreateJv } from '../../jv/create-jv/create-jv';
import { CreateInvoice } from '../../Invoices/create-invoice/create-invoice';
import { CreateExpenseComponent } from '../../Expense/create-expense/create-expense';
@Component({
  selector: 'app-manage-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CreateBank, CreateCash, CashWithdraw, CashDeposit, BankToBank, PaymentIn, PaymentOut],
  templateUrl: './manage-page.html',
  styleUrl: './manage-page.scss'
})
export class ManagePage {
  selectedTab: 'bank' | 'cash' = 'bank';
  modalRef: any;
  editingBankId: string | null = null;
  editingCashId: string | null = null;
  selectedBank: any = null;
  selectedCash: any = null;
  bankList: any[] = [];
  cashList: any[] = [];
  filterForm!: FormGroup;
  bankLedgerData: any[] = [];
  openingBalance: any = null;
  isLoadingLedger: boolean = false;
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
    private modalService: NgbModal,
    private api: Api,
    private toast: ToastService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForm();
  }

  initForm() {
    this.filterForm = this.fb.group({
      start_date: [this.api.getDateRange().start_date, Validators.required],
      end_date: [this.api.getDateRange().end_date, Validators.required],
      company: [this.api.getUserCompany()]
    });
  }

  onSubmit() {
    if (this.filterForm.valid) {
      // Handle form submission logic here
      if (this.selectedTab === 'bank' && this.selectedBank) {
        this.getbankledgers(this.selectedBank, 1);
      } else if (this.selectedTab === 'cash' && this.selectedCash) {
        this.getCashLedgers(this.selectedCash, 1);
      }
      this.toast.show('Success', 'Filter applied successfully', 'success');
    } else {
      this.toast.show('Error', 'Please fill all required fields', 'danger');
    }
  }

  ngOnInit(){
    this.getBankList();
    this.getCashList();
    
    // Set today's date for start_date and end_dat
  }
  getbankledgers(a:any, page: number = 1){
    this.isLoadingLedger = true;
    this.currentPage = page;
    
    // Add page_number to the form data
    const formData = { 
      ...this.filterForm.value, 
      page_number: page,
      limit: this.limit
    };
    
    this.api.post('/money/get-bank-ledger/'+a.id+'/', formData).subscribe({
      next: (response: any) => {
        if(response.status === 200) {
          this.bankLedgerData = response.data || [];
          this.openingBalance = response.opening_balance || null;
          
          // Handle pagination data
          if (response.pagination_data) {
            this.totalData = response.pagination_data.total_data || 0;
            this.totalPages = response.pagination_data.total_pages || 1;
            this.currentPage = response.pagination_data.page_number || 1;
            this.hasNextPage = response.pagination_data.next_page || false;
            this.hasPreviousPage = response.pagination_data.previous_page || false;
            this.limit = response.pagination_data.limit || 10;
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

  // Action methods for cash ledger entries
  viewEntry(entry: any) {
    console.log('Viewing entry:', entry);
    // You can implement view logic here or open a modal
    this.toast.show('Info', `Viewing entry: ${entry.particular}`, 'info');
  }

  editEntry(entry: any) {
    this.openbankmodal(entry);
  }

  deleteEntry(entry: any) {
    if (confirm(`Are you sure you want to delete this entry: ${entry.particular}?`)) {
      console.log('Deleting entry:', entry);
      // You can implement delete logic here
      this.toast.show('Success', `Entry deleted: ${entry.particular}`, 'success');
      // Refresh the data after deletion
      if (this.selectedCash) {
        this.getCashLedgers(this.selectedCash, this.currentPage);
      }
    }
  }

  // Enhanced pagination methods
  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    console.log('Page change - Current tab:', this.selectedTab, 'Page:', page);
    console.log('Selected Bank:', this.selectedBank, 'Selected Cash:', this.selectedCash);
    
    // Debug current state
    this.debugCurrentState();
    
    // Use the current selected tab to determine which API to call
    if (this.selectedTab === 'bank' && this.selectedBank) {
      console.log('Calling bank API for page:', page);
      this.getbankledgers(this.selectedBank, page);
    } else if (this.selectedTab === 'cash' && this.selectedCash) {
      console.log('Calling cash API for page:', page);
      this.getCashLedgers(this.selectedCash, page);
    } else {
      // Fallback: check which modal is currently open
      if (this.selectedBank && this.bankLedgerData.length > 0) {
        console.log('Fallback: Calling bank API for page:', page);
        this.getbankledgers(this.selectedBank, page);
      } else if (this.selectedCash && this.cashLedgerData.length > 0) {
        console.log('Fallback: Calling cash API for page:', page);
        this.getCashLedgers(this.selectedCash, page);
      }
    }
  }

  onNextPage() {
    if (this.hasNextPage && this.currentPage < this.totalPages) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  onPreviousPage() {
    if (this.hasPreviousPage && this.currentPage > 1) {
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

  // Method to get entry type display
  getEntryTypeDisplay(entry: any): string {
    switch (entry.type) {
      case 'payment_in':
        return 'Payment In';
      case 'payment_out':
        return 'Payment Out';
      case 'withdrawal':
        return 'Withdrawal';
      case 'deposit':
        return 'Deposit';
      case 'bank_to_bank':
        return 'Bank Transfer';
      default:
        return entry.type || 'Other';
    }
  }

  // Method to get entry status color
  getEntryStatusColor(entry: any): string {
    switch (entry.type) {
      case 'payment_in':
        return 'success';
      case 'payment_out':
        return 'danger';
      case 'withdrawal':
        return 'warning';
      case 'deposit':
        return 'info';
      default:
        return 'secondary';
    }
  }

  // Method to format balance values
  formatBalance(balance: string): string {
    if (!balance) return '-';
    
    // Handle Dr/Cr notation
    if (balance.includes('Dr')) {
      return `<span class="text-danger fw-semibold">${balance}</span>`;
    } else if (balance.includes('Cr')) {
      return `<span class="text-success fw-semibold">${balance}</span>`;
    }
    
    return balance;
  }

  // Method to get balance class for styling
  getBalanceClass(balance: string): string {
    if (!balance) return '';
    
    if (balance.includes('Dr')) {
      return 'text-danger fw-semibold';
    } else if (balance.includes('Cr')) {
      return 'text-success fw-semibold';
    }
    
    return 'fw-semibold';
  }

  // Method to format amount values
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

  // Method to format dates
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

  // Method to get opening balance display
  getOpeningBalanceDisplay(): string {
    if (!this.cashOpeningBalance) return '';
    
    return this.cashOpeningBalance.balance || 
           this.cashOpeningBalance.bank_balance || 
           this.cashOpeningBalance.cash_balance || 
           '0.00';
  }

  // Debug method to show current state
  debugCurrentState() {
    console.log('=== Current State Debug ===');
    console.log('Selected Tab:', this.selectedTab);
    console.log('Selected Bank:', this.selectedBank);
    console.log('Selected Cash:', this.selectedCash);
    console.log('Bank Ledger Data Length:', this.bankLedgerData.length);
    console.log('Cash Ledger Data Length:', this.cashLedgerData.length);
    console.log('Current Page:', this.currentPage);
    console.log('Total Pages:', this.totalPages);
    console.log('==========================');
  }

  getCashLedgers(a:any, page: number = 1){
    this.isLoadingCashLedger = true;
    this.currentPage = page;
    
    // Add page_number to the form data
    const formData = { 
      ...this.filterForm.value, 
      page_number: page,
      limit: this.limit
    };
    
    this.api.post('/money/get-cash-ledger/'+a.id+'/', formData).subscribe({
      next: (response: any) => {
        if(response.status === 200) {
          this.cashLedgerData = response.data || [];
          this.cashOpeningBalance = response.opening_balance || null;
          
          // Handle pagination data
          if (response.pagination_data) {
            this.totalData = response.pagination_data.total_data || 0;
            this.totalPages = response.pagination_data.total_pages || 1;
            this.currentPage = response.pagination_data.page_number || 1;
            this.hasNextPage = response.pagination_data.next_page || false;
            this.hasPreviousPage = response.pagination_data.previous_page || false;
            this.limit = response.pagination_data.limit || 10;
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
  selectTab(tab: 'bank' | 'cash') {
    console.log('Switching tab from', this.selectedTab, 'to', tab);
    this.selectedTab = tab;
    
    // Clear data when switching tabs to avoid confusion
    if (tab === 'bank') {
      this.cashLedgerData = [];
      this.cashOpeningBalance = null;
      this.selectedCash = null;
    } else if (tab === 'cash') {
      this.bankLedgerData = [];
      this.openingBalance = null;
      this.selectedBank = null;
    }
    
    // Reset pagination
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalData = 0;
    this.hasNextPage = false;
    this.hasPreviousPage = false;
  }
  getCashList(){
    this.api.get('/money/list-cash/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        if(response.status === 200){
          this.cashList = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading cash list:', error);
        this.toast.show('Error', 'Failed to load cash list', 'danger');
      }
    });
  }

  openAddBankModal(content: any) {
    this.editingBankId = null;
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }

  openEditBankModal(content: any, bankId: string) {
    this.editingBankId = bankId;
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }

  openAddCashLedgerModal(content: any) {
    this.editingCashId = null;
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }

  openEditCashModal(content: any, cashId: string) {
    this.editingCashId = cashId;
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }

  openCashWithdrawModal(content: any) {
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }

  openCashDepositModal(content: any) {
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }

  openBankToBankModal(content: any) {
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }

  openPaymentInModal(content: any) {
    this.modalRef = this.modalService.open(content, { size: 'xl', centered: true, keyboard: false, backdrop: 'static' });
  }

  openPaymentOutModal(content: any) {
    this.modalRef = this.modalService.open(content, { size: 'xl', centered: true, keyboard: false, backdrop: 'static' });
  }
  openReconcile(){
    this.modalService.open(Reconciliation)
  }

  openViewBankModal(content: any, bank: any) {
    // Navigate to bank detail page instead of opening modal
    this.router.navigate(['/manage-money/bank-detail', bank.id]);
  }

  openViewCashModal(content: any, cash: any) {
    // Navigate to cash detail page instead of opening modal
    this.router.navigate(['/manage-money/cash-detail', cash.id]);
  }
  getBankList(){
    this.api.get('/money/list-bank/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        if(response.status === 200){
          this.bankList = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading bank list:', error);
        this.toast.show('Error', 'Failed to load bank list', 'danger');
      }
    });
  }
  onBankSaved(response: any) {
    console.log('Bank saved:', response);
    this.getBankList();
    this.toast.show('Success', 'Bank saved successfully', 'success');
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
        // windowClass: modalType === 'create-jv' ? 'voucher-modal' : 'my-class',
        size: modalSize,
        backdrop: 'static',
        keyboard: false
      });
      if(modalType.type === 'voucher'){
        modalRef.componentInstance.editinvoiceId = modalType.invoice_no
      }else{
        modalRef.componentInstance.editinvoiceId = modalType.id;
      }
      
      // Set modal properties
      modalRef.componentInstance.isModal = true;
      modalRef.componentInstance.isEditMode = false;
      
      // Handle modal result
      modalRef.result.then((result) => {
        if (result) {
          // Refresh data if needed
          this.getBankList();
          this.getCashList();
        }
      }).catch(() => {
        // Modal was dismissed - no action needed
      });
    }
  }
}
