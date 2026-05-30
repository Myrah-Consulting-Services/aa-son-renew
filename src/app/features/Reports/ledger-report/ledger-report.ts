import { Component } from '@angular/core';
import { Api } from '../../../core/services/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ledger-report',
  imports: [FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './ledger-report.html',
  styleUrl: './ledger-report.scss'
})
export class LedgerReport {
  ledgerReport: any[] = [];
  pagination: any;
  currentPage: number = 1;
  loading: boolean = false;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5,10, 25, 50, 100];

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.getLedgerReport();
  }

  getLedgerReport(page: number = 1, pageSize: number = this.pageSize) {
    this.loading = true;
    this.currentPage = page;
    this.pageSize = pageSize;
    
    const params = {
      company_id: this.api.getCompanyId(),
      page: page,
      limit: pageSize
    }
    
    this.api.post('/reports/display_ledger_report/', params).subscribe((res: any) => {
      if(res.status == 200) {
        this.ledgerReport = res.data;
        this.pagination = res.pagination;
      }
      this.loading = false;
    }, (error) => {
      console.error('Error fetching ledger report:', error);
      this.loading = false;
    });
  }

  onPageSizeChange(event: any) {
    // Ensure pageSize is a number and reset to first page
    this.pageSize = +this.pageSize; // Convert to number
    this.currentPage = 1;
    this.getLedgerReport(1, this.pageSize);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.pagination.total_pages && page !== this.currentPage) {
      this.getLedgerReport(page, this.pageSize);
    }
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

  getEndEntryNumber(): number {
    if (!this.pagination) return 0;
    return Math.min(this.currentPage * this.pageSize, this.pagination.total_data);
  }

  getStartEntryNumber(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
}
