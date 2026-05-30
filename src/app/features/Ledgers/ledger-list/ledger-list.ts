import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CerateLedger } from '../cerate-ledger/cerate-ledger';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateGroup } from '../create-group/create-group';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentIn } from '../../manage-money/payment-in/payment-in';
import { PaymentOut } from '../../manage-money/payment-out/payment-out';
import { CreateInvoice } from '../../Invoices/create-invoice/create-invoice';
import { CreateJv } from '../../jv/create-jv/create-jv';
import { CreateExpenseComponent } from '../../Expense/create-expense/create-expense';
@Component({
  selector: 'app-ledger-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CerateLedger, CreateGroup],
  templateUrl: './ledger-list.html',
  styleUrl: './ledger-list.scss'
})
export class LedgerList {
ledgers:any[]=[
  
]
modalRef:any;
emitid:any;
ledgerslistdata:any[]=[];
ledgerlistForm:FormGroup;
ledgerid: any;

// Pagination properties for main ledger list
mainCurrentPage: number = 1;
mainTotalPages: number = 1;
mainTotalData: number = 0;
mainPageSize: number = 10;
mainHasNextPage: boolean = false;
mainHasPreviousPage: boolean = false;

// Pagination properties for ledger detail modal
currentPage: number = 1;
totalPages: number = 1;
totalData: number = 0;
limit: number = 10;
hasNextPage: boolean = false;
hasPreviousPage: boolean = false;

// Loading state
isLoadingLedger: boolean = false;
isLoadingMainList: boolean = false;

// Opening balance
openingBalance: any = null;

// Make Math available in template
Math = Math;

constructor(private modalService:NgbModal,private api:Api,private fb:FormBuilder){
  this.ledgerlistForm=this.fb.group({
    start_date:[this.api.getDateRange().start_date,Validators.required],
    end_date:[this.api.getDateRange().end_date,Validators.required],
    company_id:[]
  })
}
ngOnInit(){
  this.getledgerlist();

}

// Pagination methods for main ledger list
onMainPageChange(page: number) {
  if (page < 1 || page > this.mainTotalPages) {
    return;
  }
  this.getledgerlist(page);
}

onMainNextPage() {
  if (this.mainHasNextPage && this.mainCurrentPage < this.mainTotalPages) {
    this.onMainPageChange(this.mainCurrentPage + 1);
  }
}

onMainPreviousPage() {
  if (this.mainHasPreviousPage && this.mainCurrentPage > 1) {
    this.onMainPageChange(this.mainCurrentPage - 1);
  }
}

getMainPageNumbers(): number[] {
  const pages: number[] = [];
  const maxVisiblePages = 5;
  
  if (this.mainTotalPages <= maxVisiblePages) {
    for (let i = 1; i <= this.mainTotalPages; i++) {
      pages.push(i);
    }
  } else {
    let startPage = Math.max(1, this.mainCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.mainTotalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
  }
  
  return pages;
}

// Method to handle page size change
onPageSizeChange(event: any) {
  this.mainPageSize = parseInt(event.target.value);
  this.mainCurrentPage = 1; // Reset to first page
  this.getledgerlist(1);
}

// Method to handle search
onSearch(event: any) {
  const searchTerm = event.target.value.trim();
  // You can implement search logic here
  // For now, just reset to first page
  this.mainCurrentPage = 1;
  this.getledgerlist(1);
}

getledgerlist(page: number = 1){
  this.isLoadingMainList = true;
  this.mainCurrentPage = page;
  
  this.api.post(`/ledger/list-ledger/`+this.api.getUserCompany()+'/',{
    page_number:page,
    page_size:this.mainPageSize,
    
  }).subscribe({
    next: (res: any) => {
      if(res.status === 200){
        this.ledgers = res.data || [];
        
        // Handle pagination data
        if (res.pagination) {
          this.mainTotalData = res.pagination.total_data || 0;
          this.mainTotalPages = res.pagination.total_pages || 1;
          this.mainCurrentPage = res.pagination.current_page || 1;
          this.mainPageSize = res.pagination.page_size || 10;
          
          // Calculate next/previous page availability
          this.mainHasNextPage = this.mainCurrentPage < this.mainTotalPages;
          this.mainHasPreviousPage = this.mainCurrentPage > 1;
        }
      }
      this.isLoadingMainList = false;
    },
    error: (error) => {
      console.error('Error loading ledger list:', error);
      this.isLoadingMainList = false;
    }
  })
}
  openCreateLedgerModal(content:any,id?:any){
    if(id){
      this.emitid=id;
    }
   this.modalRef= this.modalService.open(content,{
      centered:true,
      size:'lg'
    });
  }

  openCreateGroupModal(content:any){
    this.modalRef=this.modalService.open(content,{
      centered:true,
      size:'lg'
    });
  }
    closeModal(){
    this.modalService.dismissAll();
  }

  addledger(event:any){
    this.getledgerlist();
    console.log(event);
  }
  addgroup(event:any){
    this.getledgerlist();
    console.log(event);
  }

  onSubmit() {
    if (this.ledgerlistForm.valid) {
      // Reset pagination when applying new filters
      this.currentPage = 1;
      this.totalPages = 1;
      this.totalData = 0;
      this.hasNextPage = false;
      this.hasPreviousPage = false;
      this.getledgerviewdata(1);
    }
  }

  openLedgerlistModal(content:any,id:any){
    this.modalRef=this.modalService.open(content,{
      centered:true,
      size:'xl'
    });
    this.ledgerid=id;
    // Reset pagination when opening modal
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalData = 0;
    this.hasNextPage = false;
    this.hasPreviousPage = false;
    this.getledgerviewdata(1);
  }

  // Pagination methods
  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.getledgerviewdata(page);
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
  getcurrency(){
   
    return this.api.getcurrencies();
  }

  // Action methods for ledger entries
  viewEntry(entry: any) {
    console.log('Viewing entry:', entry);
    // You can implement view logic here or open a modal
  }

  editEntry(entry: any) {
    console.log('Editing entry:', entry);
    // You can implement edit logic here or open a modal
    let componentToOpen: any;
    let modalSize: string = 'lg';
    
    if (entry.type === 'payment_in') {
      componentToOpen = PaymentIn;
      modalSize = 'xl';
    } else if (entry.type === 'payment_out') {
      componentToOpen = PaymentOut;
      modalSize = 'xl';
    } else if (entry.type === 'sales' || entry.type === 'purchase') {
      componentToOpen = CreateInvoice;
      modalSize = 'xl';
    } else if (entry.type === 'voucher') {
      componentToOpen = CreateJv;
      modalSize = 'lg';
    } else if (entry.type === 'expense') {
      componentToOpen = CreateExpenseComponent;
      modalSize = 'lg';
    }
    
    if (componentToOpen) {
      const modalRef = this.modalService.open(componentToOpen, { 
        centered: true, 
        windowClass: entry.type === 'voucher' ? 'voucher-modal' : 'my-class',
        size: modalSize
      });
      
      if (entry.type === 'voucher' && entry.invoice_no) {
        modalRef.componentInstance.editinvoiceId = entry.invoice_no;
      } else if (entry.id) {
        modalRef.componentInstance.editinvoiceId = entry.id;
      }
      modalRef.componentInstance.isEditMode = true;
      modalRef.componentInstance.isModal = true;
      
      modalRef.result.then((result) => {
        if (result) {
          this.getledgerviewdata(this.currentPage);
        }
      }).catch(() => {});
    }
  }

  deleteEntry(entry: any) {
    if (confirm(`Are you sure you want to delete this entry: ${entry.particular}?`)) {
      console.log('Deleting entry:', entry);
      // You can implement delete logic here
      // Refresh the data after deletion
      this.getledgerviewdata(this.currentPage);
    }
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

  // Method to get opening balance display
  getOpeningBalanceDisplay(): string {
    if (!this.openingBalance) return '';
    
    return this.openingBalance.bank_balance || '0.00';
  }

  getledgerviewdata(page: number = 1){
    this.isLoadingLedger = true;
    this.currentPage = page;
    
    const data={
      company_id:this.api.getUserCompany(),
      start_date:this.ledgerlistForm.value.start_date,
      end_date:this.ledgerlistForm.value.end_date,
      page_number: page,
      limit: this.limit
    }
    
    this.api.post('/money/get-ledger-report/'+this.ledgerid+'/',data).subscribe({
      next: (res: any) => {
        if(res.status === 200){
          this.ledgerslistdata=res.data || [];
          this.openingBalance = res.opening_dict || null;
          
          // Handle pagination data
          if (res.pagination_data) {
            this.totalData = res.pagination_data.total_data || 0;
            this.totalPages = res.pagination_data.total_pages || 1;
            this.currentPage = res.pagination_data.page_number || 1;
            this.hasNextPage = res.pagination_data.next_page || false;
            this.hasPreviousPage = res.pagination_data.previous_page || false;
            this.limit = res.pagination_data.limit || 10;
          }
        }
        this.isLoadingLedger = false;
      },
      error: (error) => {
        console.error('Error loading ledger data:', error);
        this.isLoadingLedger = false;
      }
    })
  }
}
