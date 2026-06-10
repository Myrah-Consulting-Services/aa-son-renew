import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RelocationForm } from '../relocation-form/relocation-form';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-relocation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './relocation-list.html',
  styleUrl: './relocation-list.scss'
})
export class RelocationList implements OnInit {
  relocations: any[] = [];
  warehouses: any[] = [];
  locations: any[] = [];
  items: any[] = [];
  readonly relocateTransactionType = 3;
  loading = false;
  // Filters and pagination
  searchText = '';
  startDate = '';
  endDate = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalData = 0;
  Math = Math;
  summaryCards = [
    { title: 'Total Relocations', value: () => this.totalData || this.relocations.length, icon: 'bi bi-arrows-move', bg: 'bg-primary' },
    { title: 'Total Items', value: () => this.getTotalQuantity(), icon: 'bi bi-box-seam', bg: 'bg-success' },
    { title: 'Warehouses', value: () => this.getRelocationWarehouseCount(), icon: 'bi bi-building', bg: 'bg-info' },
    { title: 'Locations', value: () => this.getRelocationLocationCount(), icon: 'bi bi-geo-alt', bg: 'bg-warning' }
  ];
  itemId: any;
  viewRelocationData: any = null;

  constructor(
    public svc: Api,
    private modalService: NgbModal,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Set default date range: start of current month to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const firstDay = '01';
    this.startDate = `${yyyy}-${mm}-${firstDay}`;
    this.endDate = `${yyyy}-${mm}-${dd}`;
    this.loadData();
    this.loadWarehouses();
    this.loadLocations();
  }

  loadData(page: number = this.currentPage) {
    this.loading = true;
    this.currentPage = page;
    const payload: any = {
      company: 1,
      transaction_type: this.relocateTransactionType,
      start_date: this.startDate,
      end_date: this.endDate,
      page_number: this.currentPage,
      page_size: this.pageSize,
      search: this.searchText || ''
    };
    this.svc.post('/items/movement-transactions/', payload).subscribe({
      next: (res: any) => {
        if (res.status == 200) {
          this.relocations = res.data;
          if (res.paginated_data) {
            this.currentPage = res.paginated_data.current_page;
            this.totalPages = res.paginated_data.total_pages;
            this.totalData = res.paginated_data.total_data;
            this.pageSize = res.paginated_data.page_size;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toast.show('Error', 'Failed to load relocations', 'danger');
      }
    });
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

  clearFilters() {
    this.searchText = '';
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.startDate = `${yyyy}-${mm}-01`;
    this.endDate = `${yyyy}-${mm}-${dd}`;
    this.loadData(1);
  }

  triggerSearch() {
    this.loadData(1);
  }

  loadWarehouses() {
    this.svc.get('/warehouses/list-warehouse/').subscribe({
      next: (res: any) => {
        if(res.status == 200){
          this.warehouses = res.data;
        }
      },
      error: (error) => {
        console.error('Error loading warehouses:', error);
      }
    });
  }

  loadLocations() {
    this.svc.post('/warehouses/list-location/').subscribe({
      next: (res: any) => {
        if(res.status == 200){
          this.locations = res.data;
        }
      },
      error: (error) => {
        console.error('Error loading locations:', error);
      }
    });
  }

  
  openForm() {
    const modalRef = this.modalService.open(RelocationForm, { centered: true, size: 'lg' });
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadData();
      }
    }).catch(() => {});
  }

    onView(modal: any, item: any) {
    this.viewRelocationData = item;
    this.modalService.open(modal, { centered: true, size: 'lg' });
    console.log('View relocation item:', item);
  }

  onEdit(item: any) {
    const modalRef = this.modalService.open(RelocationForm, { centered: true, size: 'lg' });
    modalRef.componentInstance.initializeEditMode(item);
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadData();
      }
    }).catch(() => {});
  }
  // onDelete(item: any) {
  //   this.svc.post('/warehouses/delete-relocation/'+item.id).subscribe({
  //     next: (res: any) => {
  //       if(res.status == 200){  
  //       this.loadData();
  //       this.toast.show('Success', 'Relocation deleted successfully', 'success');
  //       }else{
  //         this.toast.show('Error', 'Failed to delete relocation', 'danger');
  //       }
  //     },
  //     error: (error) => {
  //       this.toast.show('Error', 'Failed to delete relocation', 'danger');
  //     }
  //   });
  // }

  // Helper methods to get names from IDs
  getWarehouseName(id: number): string {
    const warehouse = this.warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name || warehouse.description : `Warehouse ${id}`;
  }

  getLocationName(id: number): string {
    const location = this.locations.find(l => l.id === id);
    return location ? location.name || location.description : `Location ${id}`;
  }

  getItemName(id: number): string {
    const item = this.items.find(i => i.id == id);
    return item ? item.name : `Item ${id}`;
  }

  getItemCode(id: number): string {
    const item = this.items.find(i => i.id === id);
    return item ? item.item_code || item.code : '';
  }

  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  // Get transaction type display name
  getTransactionTypeDisplay(type: string): string {
    switch(type?.toLowerCase()) {
      case 'transfer':
        return 'Transfer';
      case 'movement':
        return 'Movement';
      default:
        return type || 'Transfer';
    }
  }

  // Calculate total quantity of items moved
  getTotalQuantity(): number {
    return this.relocations.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  }

  // Get status badge class based on status
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case '1': return 'bg-success';
      case '0': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case '1': return 'Completed';
      case '0': return 'Pending';
      default: return status || '-';
    }
  }

  // Check if relocation is recent (within 7 days)
  isRecentRelocation(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return d > sevenDaysAgo;
  }

  // Refresh data
  refreshData() {
    this.loadData();
    this.loadWarehouses();
    this.loadLocations();
  }

  getRelocationWarehouseCount(): number {
    const set = new Set<string>();
    this.relocations.forEach(item => {
      if (item.warehouse) {
        item.warehouse.split('->').forEach((w: string) => set.add(w.trim()));
      }
    });
    return set.size;
  }

  getRelocationLocationCount(): number {
    const set = new Set<string>();
    this.relocations.forEach(item => {
      if (item.location) {
        item.location.split('->').forEach((l: string) => set.add(l.trim()));
      }
    });
    return set.size;
  }

  getTotalQty(locations: any[]): number {
    if (!locations) return 0;
    return locations.reduce((sum, l) => sum + (l.qty || 0), 0);
  }

  getQtyClass(qty: number): string {
    if (qty <= 5) return 'text-danger';
    if (qty <= 15) return 'text-warning';
    return 'text-success';
  }
}
