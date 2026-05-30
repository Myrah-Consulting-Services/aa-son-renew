import { Component } from '@angular/core';
import { Api } from '../../../core/services/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-party-wise-bill',
  imports: [FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './party-wise-bill.html',
  styleUrl: './party-wise-bill.scss'
})
export class PartyWiseBill {
  bills: any[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  searchTerm: string = '';
  isLoading: boolean = false;
  pagination: any;
  summary: any;
  page_size: number = 10;
  current_page: number = 1;
  // expose pageSize for template bindings and Math for calculations
  pageSize: number = 10;
  Math = Math;
  constructor(private api: Api) {}
  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.generateData();
  }
  generateData() {
    this.isLoading = true;
    const params = {
      company_id: this.api.getCompanyId(),
      start_date: this.dateFrom,
      end_date: this.dateTo,
      limit: this.page_size,
      page_number: this.current_page
    }
    this.api.post('/reports/search-partywise-bills/1/all/', params).subscribe((res:any) => {
      if(res.status == 200) {
        this.isLoading = false;
        this.bills = res.data;
        this.pagination = res.pagination;
        // normalize/sync pagination fields
        if (this.pagination?.page_size) {
          this.page_size = this.pagination.page_size;
          this.pageSize = this.pagination.page_size;
        } else {
          this.pageSize = this.page_size;
        }
        if (this.pagination?.current_page && !this.pagination.page_number) {
          this.pagination.page_number = this.pagination.current_page;
        }
        this.summary = res.summary;
      }
    });
  }
  filterBills() {
    if (!this.searchTerm) return this.bills;
    return this.bills.filter(bill =>
      bill.party_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      bill.reference_no.includes(this.searchTerm)
    );
  }
  onPageChange(page: number) {
    this.current_page = page;
    this.generateData();
  }
  onPageSizeChange(newPageSize: number) {
    this.page_size = newPageSize;
    this.pageSize = newPageSize;
    this.generateData();
  }
  getPageNumbers(): number[] {
    const totalPages = this.pagination?.total_pages || 1;
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  get showingFrom(): number {
    const page = this.pagination?.page_number || this.pagination?.current_page || this.current_page || 1;
    const size = this.pagination?.page_size || this.page_size || 10;
    return (page - 1) * size + 1;
  }
  get showingTo(): number {
    const page = this.pagination?.page_number || this.pagination?.current_page || this.current_page || 1;
    const size = this.pagination?.page_size || this.page_size || 10;
    const total = this.pagination?.total_data || this.bills.length || 0;
    return Math.min(page * size, total);
  }
}
