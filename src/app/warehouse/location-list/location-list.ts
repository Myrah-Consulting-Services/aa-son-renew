import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LocationForm } from '../location-form/location-form';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './location-list.html',
  styleUrl: './location-list.scss'
})
export class LocationList implements OnInit {
  locations: any[] = [];
  filteredLocations: any[] = [];
  warehouses: any[] = [];
  selectedWarehouse: string = '';
  searchText: string = '';
  loading = false;

  kpis = {
    total_locations: 0,
    active_locations: 0,
    inactive_locations: 0,
    total_warehouses: 0,
    locations_with_stock: 0,
    empty_locations: 0
  };

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalData = 0;

  private searchSubject = new Subject<string>();

  constructor(
    private svc: Api,
    private modalService: NgbModal,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });

    this.loadWarehouses();
    this.loadData();
  }

  loadWarehouses() {
    this.svc.get('/warehouses/list-warehouse/').subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.warehouses = res.data || [];
        }
      },
      error: () => {
        this.toast.show('Error', 'Failed to load warehouses', 'danger');
      }
    });
  }

  loadData(page: number = this.currentPage) {
    this.loading = true;
    this.currentPage = page;

    const payload: any = {
      company: this.svc.getCompanyId() ?? 1,
      warehouse: this.selectedWarehouse ? Number(this.selectedWarehouse) : null,
      search: this.searchText.trim() || null,
      page_number: this.currentPage,
      page_size: this.pageSize
    };

    this.svc.post('/warehouses/list-location/', payload).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.locations = res.data || [];
          this.filteredLocations = [...this.locations];

          if (res.kpis) {
            this.kpis = {
              total_locations: res.kpis.total_locations ?? 0,
              active_locations: res.kpis.active_locations ?? 0,
              inactive_locations: res.kpis.inactive_locations ?? 0,
              total_warehouses: res.kpis.total_warehouses ?? 0,
              locations_with_stock: res.kpis.locations_with_stock ?? 0,
              empty_locations: res.kpis.empty_locations ?? 0
            };
          }

          if (res.paginated_data) {
            this.currentPage = res.paginated_data.current_page ?? this.currentPage;
            this.totalPages = res.paginated_data.total_pages ?? 0;
            this.totalData = res.paginated_data.total_data ?? this.locations.length;
            const apiPageSize = res.paginated_data.page_size;
            if (apiPageSize != null) {
              this.pageSize = typeof apiPageSize === 'string' ? parseInt(apiPageSize, 10) : apiPageSize;
            }
          } else {
            this.totalData = this.locations.length;
            this.totalPages = 1;
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Error', 'Failed to load locations', 'danger');
      }
    });
  }

  onWarehouseFilter() {
    this.currentPage = 1;
    this.loadData(1);
  }

  onSearch() {
    this.searchSubject.next(this.searchText);
  }

  clearFilters() {
    this.selectedWarehouse = '';
    this.searchText = '';
    this.currentPage = 1;
    this.loadData(1);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadData(page);
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadData(1);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.loadData(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadData(this.currentPage - 1);
    }
  }

  getWarehouseName(warehouseId: number, warehouseName?: string): string {
    if (warehouseName) return warehouseName;
    if (!warehouseId) return 'No Warehouse';
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }

  openForm(id?: number) {
    const modalRef = this.modalService.open(LocationForm, { centered: true, size: 'lg' });
    if (id) {
      modalRef.componentInstance.id = id;
    }
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadData();
      }
    }).catch(() => {});
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this location?')) {
      this.svc.post('/warehouses/delete-location/', { id: id }).subscribe((res: any) => {
        if (res.status === 200) {
          if (this.locations.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          this.loadData();
          this.toast.show('Success', 'Location deleted successfully', 'success');
        }
      });
    }
  }

  refreshData() {
    this.currentPage = 1;
    this.loadData(1);
  }
}
