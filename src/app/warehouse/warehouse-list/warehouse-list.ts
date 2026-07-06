import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WarehouseForm } from '../warehouse-form/warehouse-form';
import { WarehouseDetailModal } from '../warehouse-detail-modal/warehouse-detail-modal';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './warehouse-list.html',
  styleUrl: './warehouse-list.scss'
})
export class WarehouseList implements OnInit {
  warehouses: any[] = [];
  loading = false;

  // ── Filters (server-side) ────────────────────────────────────────────────────
  searchText   = '';
  selectedStatus = '';          // '' | 'true' | 'false'

  // ── Pagination ───────────────────────────────────────────────────────────────
  currentPage = 1;
  pageSize    = 10;
  totalCount  = 0;

  // ── KPI counts ───────────────────────────────────────────────────────────────
  totalWarehouses = 0;
  activeCount     = 0;
  inactiveCount   = 0;

  private searchSubject = new Subject<string>();

  constructor(
    private svc: Api,
    private modalService: NgbModal,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Debounce search input — wait 400ms before hitting API
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadWarehouses();
    });

    this.loadWarehouses();
  }

  // ── API call ─────────────────────────────────────────────────────────────────
  loadWarehouses() {
    this.loading = true;

    const params: any = {
      page:      this.currentPage,
      page_size: this.pageSize
    };

    if (this.searchText.trim()) {
      params['search'] = this.searchText.trim();
    }

    if (this.selectedStatus !== '') {
      params['is_active'] = this.selectedStatus;   // 'true' or 'false'
    }

    this.svc.listWarehouses(params).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 200 || res.data) {
          this.warehouses = res.data || [];

          // Read pagination from paginated_data
          const pagination = res.paginated_data || {};
          this.currentPage = pagination.current_page ?? 1;
          this.totalCount  = pagination.total_data   ?? this.warehouses.length;
          const totalPages = pagination.total_pages  ?? 1;
          // If API returns page_size as string, parse it
          const apiPageSize = pagination.page_size;
          if (apiPageSize && typeof apiPageSize === 'string') {
            this.pageSize = parseInt(apiPageSize, 10);
          }

          // KPI counts
          this.totalWarehouses = this.totalCount;
          this.activeCount     = this.warehouses.filter((w: any) => w.is_active === true).length;
          this.inactiveCount   = this.warehouses.filter((w: any) => w.is_active === false).length;
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading warehouses:', err);
        this.toast.show('Error', 'Failed to load warehouses', 'danger');
      }
    });
  }

  // ── Filter handlers ──────────────────────────────────────────────────────────
  onSearchInput() {
    this.searchSubject.next(this.searchText);
  }

  onStatusChange() {
    this.currentPage = 1;
    this.loadWarehouses();
  }

  clearFilters() {
    this.searchText     = '';
    this.selectedStatus = '';
    this.currentPage    = 1;
    this.loadWarehouses();
  }

  refreshData() {
    this.currentPage = 1;
    this.loadWarehouses();
  }

  // ── Pagination ───────────────────────────────────────────────────────────────
  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadWarehouses();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadWarehouses();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadWarehouses();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadWarehouses();
  }

  // ── KPI helpers ──────────────────────────────────────────────────────────────
  getActiveWarehouses(): number  { return this.activeCount; }
  getInactiveWarehouses(): number { return this.inactiveCount; }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  viewWarehouse(id: number): void {
    const modalRef = this.modalService.open(WarehouseDetailModal, { centered: true, size: 'md' });
    modalRef.componentInstance.id = id;
  }

  openForm(id?: number) {
    const modalRef = this.modalService.open(WarehouseForm, { centered: true, size: 'lg' });
    if (id) {
      modalRef.componentInstance.id = id;
    }
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadWarehouses();
      }
    }).catch(() => {});
  }

  delete(id: number) {
    const warehouse = this.warehouses.find((w: any) => w.id === id);
    if (warehouse && confirm(`Are you sure you want to delete "${warehouse.name}"?`)) {
      this.svc.delete('/warehouses/delete-warehouse/' + id).subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.toast.show('Deleted', 'Warehouse deleted successfully.', 'success');
            // If last item on page > 1, go back one page
            if (this.warehouses.length === 1 && this.currentPage > 1) {
              this.currentPage--;
            }
            this.loadWarehouses();
          }
        },
        error: () => this.toast.show('Error', 'Failed to delete warehouse', 'danger')
      });
    }
  }
}
