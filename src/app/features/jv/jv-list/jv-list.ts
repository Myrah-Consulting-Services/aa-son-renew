import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import { CreateJv } from '../create-jv/create-jv';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface JvEntry {
  voucher_id: number;
  voucher_no: string;
  voucher_date: string;
  amount: number;
  debit: string;
  credit: string;
}

interface JvResponse {
  status: number;
  pagination: {
    current_page: number;
    total_pages: number;
    total_data: number;
    page_size: number;
  };
  data: JvEntry[];
  summary: {
    total_bills: number;
    total_amounts: number;
    total_credit_amounts: number;
    total_debit_amounts: number;
  };
}

@Component({
  selector: 'app-jv-list',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, FormsModule],
  templateUrl: './jv-list.html',
  styleUrl: './jv-list.scss'
})
export class JvList implements OnInit {
  jvForm: FormGroup;
  loading = false;
  
  // Data properties
  jvData: JvEntry[] = [];
  hasData = false;
  
  // Pagination properties
  currentPage = 1;
  totalPages = 1;
  totalData = 0;
  pageSize = 10;
  
  // Summary properties
  summary: any = {};

  // Make Math available in template
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    private modalService: NgbModal
  ) {
    this.jvForm = this.fb.group({
      start_date: [this.api.getDateRange().start_date, Validators.required],
      end_date: [this.api.getDateRange().end_date, Validators.required],
      company: [this.api.getUserCompany()]
    });
  }

  ngOnInit() {
    this.getJvList();
  }

  getJvList() {
    if (!this.jvForm.valid) return;
    
    this.loading = true;
    const payload = {
      ...this.jvForm.value,
      page_number: this.currentPage,
      limit: this.pageSize
    };
    
    this.api.post('/journal-voucher/jv-report/s=/', payload).subscribe({
      next: (res: any) => {
        console.log(res);
        const response = res as JvResponse;
        if (response.status === 200) {
          this.jvData = response.data || [];
          this.hasData = this.jvData.length > 0;
          
          // Set pagination data
          if (response.pagination) {
            this.currentPage = response.pagination.current_page;
            this.totalPages = response.pagination.total_pages;
            this.totalData = response.pagination.total_data;
            this.pageSize = response.pagination.page_size;
          }
          
          // Set summary data
          this.summary = response.summary || {};
          
          this.loading = false;
        } else {
          this.jvData = [];
          this.hasData = false;
          this.summary = {};
          this.loading = false;
          this.toast.show('Error', 'Failed to fetch JV list', 'danger');
        }
      },
      error: (error) => {
        console.error('Error fetching JV list:', error);
        this.jvData = [];
        this.hasData = false;
        this.summary = {};
        this.loading = false;
        this.toast.show('Error', 'Failed to fetch JV list', 'danger');
      }
    });
  }

  onSubmit() {
    if (this.jvForm.valid) {
      this.currentPage = 1; // Reset to first page
      this.getJvList();
    } else {
      this.markFormGroupTouched();
      this.toast.show('Error', 'Please fill all required fields', 'danger');
    }
  }

  // Pagination methods
  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.getJvList();
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
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }

  getLimitOptions(): number[] {
    return [10, 20, 50];
  }

  onLimitChange(newLimit: number) {
    this.pageSize = newLimit;
    this.currentPage = 1; // Reset to first page when changing limit
    this.getJvList();
  }

  // Utility methods
  // formatAmount(amount: number): string {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'AED'
  //   }).format(amount);
  // }

  // Action methods
  viewJv(entry: JvEntry) {
    console.log('View JV:', entry);
    // TODO: Implement view JV functionality
    this.toast.show('Info', `Viewing JV ${entry.voucher_no}`, 'info');
  }

  editJv(entry: any) {
    const modalRef = this.modalService.open(CreateJv, { 
      centered: true, 
      windowClass: 'voucher-modal',
      size: 'lg'
    });
    
    // Set the editinvoiceId for edit mode
    if (entry.voucher_no) {
      modalRef.componentInstance.editinvoiceId = entry.voucher_no;
    }
    
    // Set modal flag
    modalRef.componentInstance.isModal = true;
    
    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.getJvList();
      }
    }).catch(() => {
      // Modal was dismissed - no action needed
    });
  }

  deleteJv(entry: JvEntry) {
    console.log('Delete JV:', entry);
    // TODO: Implement delete JV functionality with confirmation
    if (confirm(`Are you sure you want to delete JV ${entry.voucher_no}?`)) {
      this.toast.show('Info', `Deleting JV ${entry.voucher_no}`, 'info');
      // TODO: Call delete API
    }
  }

  markFormGroupTouched() {
    Object.keys(this.jvForm.controls).forEach(key => {
      const control = this.jvForm.get(key);
      control?.markAsTouched();
    });
  }

  createJv() {
    const modalRef = this.modalService.open(CreateJv, { 
      centered: true, 
      windowClass: 'voucher-modal',
      size: 'lg'
    });
    modalRef.componentInstance.isModal = true;
    modalRef.componentInstance.isEditMode = false;
    modalRef.result.then((result) => {
      if (result) {
        this.getJvList();
      }
    }).catch(() => {
      // Modal was dismissed - no action needed
    });
  }
  getcurrency(){
   
    return this.api.getcurrencies();
  }
}
