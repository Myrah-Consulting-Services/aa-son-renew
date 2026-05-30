import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

interface VatTransaction {
  invoice_no: string;
  invoice_date: string;
  party_name: string;
  party_trn: string;
  transaction_type: 'Sale' | 'Purchase';
  taxable_amount: number;
  vat_rate: number;
  vat_amount: number;
  vat_category: 'Standard' | 'Zero-Rated' | 'Exempt' | 'Reverse Charge';
  emirate?: string;
  description: string;
}

@Component({
  selector: 'app-vat-detailed-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vat-detailed-report.html',
  styleUrls: ['./vat-detailed-report.scss']
})
export class VatDetailedReport implements OnInit {
  transactions: VatTransaction[] = [];
  filteredTransactions: VatTransaction[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  selectedType: string = 'All';
  selectedCategory: string = 'All';
  searchTerm: string = '';
  summary: any;
  netVatSummary: any;
  pagination: any;
  isLoading: boolean = false;
  currentPage: number=1;
  page_size: number=10;
  constructor(private api: Api) {}
  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.generateReport();
  }

  generateReport() {
    this.isLoading = true;
    // reports/vat-details-report/  ---> post method
    // company, start_date, end_date, page_number, limit, transaction_type, vat_category
    this.api.post('/reports/vat-details-report/s='+this.searchTerm+"/", {
      company: this.api.getCompanyId(),
      start_date: this.dateFrom,
      end_date: this.dateTo,
      page_number: this.currentPage,
      limit: this.page_size,
      vat_type: this.selectedType,
    }).subscribe((res: any) => {
      if(res.status == 200){
      this.isLoading = false;
      this.transactions = res.data.vat_transactions;
      this.netVatSummary = res.data.net_vat_summary;
      this.pagination = res.data.pagination;
      this.currentPage = res.data.pagination.current_page;
      this.summary = res.data.summary_cards;
      }
    });


  }
  get showingFrom(): number {
    const page = this.pagination?.page_number || this.pagination?.current_page || this.currentPage || 1;
    const size = this.pagination?.page_size || this.page_size || 10;
    return (page - 1) * size + 1;
  }
  get showingTo(): number {
    const page = this.pagination?.page_number || this.pagination?.current_page || this.currentPage || 1;
    const size = this.pagination?.page_size || this.page_size || 10;
    const total = this.pagination?.total_count || this.transactions.length || 0;
    return Math.min(page * size, total);
  }


  getTypeClass(type: string): string {
    return type === 'Sale' ? 'text-success' : 'text-danger';
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.generateReport();
  }
  onPageSizeChange(newPageSize: number) {
    this.page_size = newPageSize;
    this.currentPage = 1;
    this.generateReport();
  }
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.pagination.total_pages; i++) {
      pages.push(i);
    }
    return pages;
  } 
} 