import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-movements-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './movements-report.html',
  styleUrl: './movements-report.scss'
})
export class MovementsReport implements OnInit {
  movements: any[] = [];
  warehouses: any[] = [];
  items: any[] = [];
  loading = false;

  // KPI totals (from API total_data, not current page)
  inwardCount = 0;
  outwardCount = 0;
  relocationCount = 0;

  // Pagination
  currentPage = 1;
  pageSize: number = 10;
  totalPages = 0;
  totalData = 0;
  Math = Math;
  readonly pageSizeOptions = [10, 25, 50, 100];

  filters = {
    type: 'all',
    warehouse: '',
    item: '',
    startDate: '',
    endDate: ''
  };

  constructor(
    private svc: Api,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);
    this.filters.endDate = end.toISOString().split('T')[0];
    this.filters.startDate = start.toISOString().split('T')[0];

    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.filters.type = params['filter'];
      }
      this.loadMasters();
      this.loadData(1);
      this.loadKpis();
    });
  }

  private basePayload(extra: Record<string, any> = {}): any {
    const payload: any = {
      company: this.svc.getCompanyId(),
      transaction_type: this.filters.type || 'all',
      start_date: this.filters.startDate || undefined,
      end_date: this.filters.endDate || undefined,
      page_number: 1,
      page_size: 1,
      ...extra,
    };
    if (this.filters.warehouse) {
      payload.warehouse = Number(this.filters.warehouse);
    }
    if (this.filters.item) {
      payload.item = Number(this.filters.item);
    }
    return payload;
  }

  loadMasters() {
    this.svc.listWarehouses().subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.warehouses = res.data || [];
        }
      }
    });
    this.svc.listItems('').subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.items = res.data || [];
        }
      }
    });
  }

  loadData(page: number = this.currentPage) {
    this.loading = true;
    this.currentPage = page;

    const payload = this.basePayload({
      page_number: this.currentPage,
      page_size: Number(this.pageSize) || 10,
    });

    this.svc.post('/warehouses/movement-transactions/', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 200) {
          this.movements = (res.data || []).map((row: any) => ({
            ...row,
            type: row.transaction_type || row.type,
          }));
          if (res.paginated_data) {
            this.currentPage = Number(res.paginated_data.current_page) || this.currentPage;
            this.totalPages = Number(res.paginated_data.total_pages) || 0;
            this.totalData = Number(res.paginated_data.total_data) || this.movements.length;
            this.pageSize = Number(res.paginated_data.page_size) || this.pageSize;
          } else {
            this.totalData = this.movements.length;
            this.totalPages = 1;
          }
        } else {
          this.movements = [];
          this.totalData = 0;
          this.totalPages = 0;
          this.toast.show('Error', res.error || 'Failed to load movements', 'danger');
        }
      },
      error: () => {
        this.loading = false;
        this.movements = [];
        this.totalData = 0;
        this.totalPages = 0;
        this.toast.show('Error', 'Failed to load movements', 'danger');
      }
    });
  }

  /** Separate count calls so KPIs reflect full totals, not just the current page. */
  loadKpis() {
    const company = this.svc.getCompanyId();
    if (!company) return;

    const shared = {
      company,
      start_date: this.filters.startDate || undefined,
      end_date: this.filters.endDate || undefined,
      page_number: 1,
      page_size: 1,
    };
    if (this.filters.warehouse) {
      (shared as any).warehouse = Number(this.filters.warehouse);
    }
    if (this.filters.item) {
      (shared as any).item = Number(this.filters.item);
    }

    forkJoin({
      inward: this.svc.post('/warehouses/movement-transactions/', { ...shared, transaction_type: 'inward' }),
      outward: this.svc.post('/warehouses/movement-transactions/', { ...shared, transaction_type: 'outward' }),
      relocation: this.svc.post('/warehouses/movement-transactions/', { ...shared, transaction_type: 'relocation' }),
    }).subscribe({
      next: (res: any) => {
        this.inwardCount = Number(res.inward?.paginated_data?.total_data) || 0;
        this.outwardCount = Number(res.outward?.paginated_data?.total_data) || 0;
        this.relocationCount = Number(res.relocation?.paginated_data?.total_data) || 0;
      },
      error: () => {
        this.inwardCount = 0;
        this.outwardCount = 0;
        this.relocationCount = 0;
      }
    });
  }

  get totalMovements(): number {
    if (this.filters.type === 'inward') return this.inwardCount;
    if (this.filters.type === 'outward') return this.outwardCount;
    if (this.filters.type === 'relocation') return this.relocationCount;
    return this.inwardCount + this.outwardCount + this.relocationCount;
  }

  applyFilters() {
    this.loadData(1);
    this.loadKpis();
  }

  clearFilters() {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);
    this.filters = {
      type: 'all',
      warehouse: '',
      item: '',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
    this.applyFilters();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadData(page);
    }
  }

  onPageSizeChange() {
    this.pageSize = Number(this.pageSize) || 10;
    this.loadData(1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }

  get showingFrom(): number {
    if (!this.totalData) return 0;
    return (this.currentPage - 1) * Number(this.pageSize) + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * Number(this.pageSize), this.totalData);
  }

  formatItems(row: any): string {
    if (row.items == null) return '-';
    if (typeof row.items === 'number') {
      return `${row.items} item(s)` + (row.quantity != null ? ` · qty ${row.quantity}` : '');
    }
    if (typeof row.items === 'string') {
      return row.items + (row.quantity != null ? ` (${row.quantity})` : '');
    }
    if (Array.isArray(row.items)) {
      return row.items
        .map((i: any) => `${i.item_name || i.name || i.itemId} (${i.quantity})`)
        .join(', ');
    }
    return String(row.items);
  }

  exportToCSV() {
    const headers = ['Date', 'Type', 'ID', 'Warehouse', 'Location', 'Items', 'Quantity', 'Status', 'Reference'];
    const csvContent = [
      headers.join(','),
      ...this.movements.map(row => [
        row.date ? new Date(row.date).toLocaleDateString() : '',
        row.type || row.transaction_type || '',
        row.id,
        `"${(row.warehouse || '').toString().replace(/"/g, '""')}"`,
        `"${(row.location || '').toString().replace(/"/g, '""')}"`,
        `"${this.formatItems(row).replace(/"/g, '""')}"`,
        row.quantity ?? '',
        row.status || '',
        row.reference_no ?? ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movements-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.toast.show('Success', 'Report exported (current page)', 'success');
  }
}
