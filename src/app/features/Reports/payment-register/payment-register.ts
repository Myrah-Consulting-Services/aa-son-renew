import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../../core/services/api';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PaymentIn } from '../../manage-money/payment-in/payment-in';
import { PaymentOut } from '../../manage-money/payment-out/payment-out';
  
@Component({
  selector: 'app-payment-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-register.html',
  styleUrl: './payment-register.scss'
})
export class PaymentRegister {
  dateFrom: string = '';
  dateTo: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  paymentRegister: any[] = [];
  pagination: any;
  loading: boolean = false;
  payment_in_or_out: any = '';
  summary: any = {};

  constructor(private api: Api, private modalService: NgbModal) {}

  ngOnInit() {
    this.getDates();
  }

  getDates() {
    this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.getPaymentRegister();
  }

  getPaymentRegister(page: number = 1, pageSize: number = this.pageSize) {
    this.loading = true;
    this.currentPage = page;
    this.pageSize = pageSize;
    
    this.api.post('/money/payment_register/all/', {
      company: this.api.getCompanyId(),
      start_date: this.dateFrom,
      end_date: this.dateTo,
      page_number: page,
      limit: pageSize,
      payment_in_or_out: this.payment_in_or_out
    }).subscribe((res: any) => {
      console.log(res);
      if(res.status == 200) {
        this.loading = false;
        this.paymentRegister = res.data;
        this.pagination = res.pagination_data;
        this.summary = res.summary;
      }
    }, (error) => {
      console.error('Error fetching payment register:', error);
      this.loading = false;
    });
  }

  exportXl() {
    this.api.post('/money/payment_register/all/', {
      company: this.api.getCompanyId(),
      start_date: this.dateFrom,
      end_date: this.dateTo,
      page_number: this.currentPage,
      limit: this.pageSize
    }).subscribe((res: any) => {
      console.log(res);
    });
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.pagination.total_pages && page !== this.currentPage) {
      this.getPaymentRegister(page, this.pageSize);
    }
  }

  onPageSizeChange(event: any) {
    // Ensure pageSize is a number and reset to first page
    this.pageSize = +this.pageSize; // Convert to number
    this.currentPage = 1;
    this.getPaymentRegister(1, this.pageSize);
  }

  onPreviousPage() {
    if (this.pagination?.previous_page && this.currentPage > 1) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  onNextPage() {
    if (this.pagination?.next_page && this.currentPage < this.pagination.total_pages) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const pages: number[] = [];
    const totalPages = this.pagination.total_pages;
    const currentPage = this.currentPage;
    
    // Show max 5 pages around current page
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else {
        startPage = Math.max(1, endPage - 4);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  isLastPage(): boolean {
    return this.currentPage === this.pagination?.total_pages;
  }

  getStartEntryNumber(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndEntryNumber(): number {
    if (!this.pagination) return 0;
    return Math.min(this.currentPage * this.pageSize, this.pagination.total_data);
  }

  // Summary getters
  get totalRecords(): number {
    return this.summary?.total_bills || 0;
  }

  get totalAmount(): number {
    return this.summary?.total_amount || 0;
  }

  get totalIn(): number {
    return this.summary?.total_payin_amount || 0;
  }

  get totalOut(): number {
    return this.summary?.total_payout_amount || 0;
  }

  editPayInModal( modalType: any) {
    let componentToOpen: any;
    let modalSize: string = 'lg';
    
    switch (modalType.payment_in_or_out) {
      case 'Payment In':
        componentToOpen = PaymentIn;
        modalSize = 'xl';
        break;
      case 'Payment Out':
        componentToOpen = PaymentOut;
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
        
        }
      }).catch(() => {
        // Modal was dismissed - no action needed
      });
    }
  }
  

  deletePayIn(id: any) {
    console.log(id);
  }
  deletePayout(id: any) {
    console.log(id);
  }
}
