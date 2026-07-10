import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-damage-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './damage-report.html',
  styleUrl: './damage-report.scss'
})
export class DamageReport implements OnInit {
  damages: any[] = [];
  warehouses: any[] = [];
  items: any[] = [];
  loading = false;

  // KPIs / charts from damage-summary (full filtered set, not page)
  summary = {
    total_incidents: 0,
    damaged_items: 0,
    total_loss: 0,
    affected_items: 0,
  };
  damageBySource: { source: string; quantity: number }[] = [];
  damageByItem: { item: string; quantity: number }[] = [];

  // Pagination
  currentPage = 1;
  pageSize: number = 10;
  totalPages = 0;
  totalData = 0;
  Math = Math;
  readonly pageSizeOptions = [10, 25, 50, 100];

  filters = {
    warehouse: '',
    item: '',
    startDate: '',
    endDate: '',
    source: ''
  };

  constructor(
    private svc: Api,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);
    this.filters.endDate = end.toISOString().split('T')[0];
    this.filters.startDate = start.toISOString().split('T')[0];

    this.loadMasters();
    this.loadData(1);
    this.loadSummary();
  }

  private filterPayload(extra: Record<string, any> = {}): any {
    const payload: any = {
      company: this.svc.getCompanyId(),
      start_date: this.filters.startDate || undefined,
      end_date: this.filters.endDate || undefined,
      ...extra,
    };
    if (this.filters.warehouse) {
      payload.warehouse = Number(this.filters.warehouse);
    }
    if (this.filters.item) {
      payload.item = Number(this.filters.item);
    }
    if (this.filters.source) {
      payload.source = this.filters.source;
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

    const payload = this.filterPayload({
      group_by: 'incident',
      page_number: this.currentPage,
      page_size: Number(this.pageSize) || 10,
    });

    this.svc.post('/warehouses/damage-report/', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 200) {
          this.damages = (res.data || []).map((row: any) => ({
            ...row,
            itemId: row.item_id ?? row.itemId,
            warehouseId: row.warehouse_id ?? row.warehouseId,
            locationId: row.location_id ?? row.locationId,
            itemName: row.item || row.itemName,
            warehouseName: row.warehouse || row.warehouseName,
            locationName: row.location || row.locationName,
          }));
          if (res.paginated_data) {
            this.currentPage = Number(res.paginated_data.current_page) || this.currentPage;
            this.totalPages = Number(res.paginated_data.total_pages) || 0;
            this.totalData = Number(res.paginated_data.total_data) || this.damages.length;
            this.pageSize = Number(res.paginated_data.page_size) || this.pageSize;
          } else {
            this.totalData = this.damages.length;
            this.totalPages = 1;
          }
        } else {
          this.damages = [];
          this.totalData = 0;
          this.totalPages = 0;
          this.toast.show('Error', res.error || 'Failed to load damage report', 'danger');
        }
      },
      error: () => {
        this.loading = false;
        this.damages = [];
        this.totalData = 0;
        this.totalPages = 0;
        this.toast.show('Error', 'Failed to load damage report', 'danger');
      }
    });
  }

  loadSummary() {
    const company = this.svc.getCompanyId();
    if (!company) return;

    this.svc.post('/warehouses/damage-summary/', this.filterPayload()).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.summary = {
            total_incidents: Number(res.summary?.total_incidents) || 0,
            damaged_items: Number(res.summary?.damaged_items) || 0,
            total_loss: Number(res.summary?.total_loss) || 0,
            affected_items: Number(res.summary?.affected_items) || 0,
          };
          this.damageBySource = (res.damage_by_source || []).map((s: any) => ({
            source: s.source || 'Unknown',
            quantity: Number(s.quantity) || 0,
          }));
          this.damageByItem = (res.damage_by_item || [])
            .slice(0, 8)
            .map((i: any) => ({
              item: i.item || 'Unknown',
              quantity: Number(i.quantity) || 0,
            }));
        } else {
          this.resetSummary();
        }
      },
      error: () => this.resetSummary()
    });
  }

  private resetSummary() {
    this.summary = {
      total_incidents: 0,
      damaged_items: 0,
      total_loss: 0,
      affected_items: 0,
    };
    this.damageBySource = [];
    this.damageByItem = [];
  }

  applyFilters() {
    this.loadData(1);
    this.loadSummary();
  }

  clearFilters() {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);
    this.filters = {
      warehouse: '',
      item: '',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      source: ''
    };
    this.applyFilters();
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.loadData(page);
  }

  onPageSizeChange() {
    this.loadData(1);
  }

  get showingFrom(): number {
    if (!this.totalData) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalData);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(this.totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getDamageValue(damage: any): number {
    return Number(damage.value) || 0;
  }

  exportToCSV() {
    const headers = ['Date', 'Item', 'Warehouse', 'Location', 'Quantity', 'Reason', 'Source', 'Value'];
    const csvContent = [
      headers.join(','),
      ...this.damages.map(damage => [
        damage.date ? new Date(damage.date).toLocaleDateString() : '',
        `"${(damage.itemName || '').replace(/"/g, '""')}"`,
        `"${(damage.warehouseName || '').replace(/"/g, '""')}"`,
        `"${(damage.locationName || '').replace(/"/g, '""')}"`,
        damage.quantity,
        `"${(damage.reason || '').replace(/"/g, '""')}"`,
        damage.source || '',
        this.getDamageValue(damage).toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'damage-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
