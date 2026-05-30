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
    { title: 'Total Relocations', value: () => this.relocations.length, icon: 'bi bi-arrows-move', bg: 'bg-primary' },
    { title: 'Total Items', value: () => this.getTotalQuantity(), icon: 'bi bi-box-seam', bg: 'bg-success' },
    { title: 'Warehouses', value: () => this.getRelocationWarehouseCount(), icon: 'bi bi-building', bg: 'bg-info' },
    { title: 'Locations', value: () => this.getRelocationLocationCount(), icon: 'bi bi-geo-alt', bg: 'bg-warning' }
  ];
itemId: any;
viewRelocationData: any;

  constructor(
    public svc: Api,
    private modalService: NgbModal,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Set default date range to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yyyy}-${mm}-${dd}`;
    this.startDate = formattedToday;
    this.endDate = formattedToday;
    this.loadData();
    this.loadWarehouses();
    this.loadLocations();
    // this.loadlog(null)
    // For testing - you can remove this after confirming the API works
    // this.loadSampleData();
  }
  loadlog(id:any){
    this.svc.post('/warehouses/list-reloaction/',{item:id}).subscribe({
      next: (res: any) => {
        if(res.status == 200){
          this.viewRelocationData = res.data;
          if (res.paginated_data) {
            this.currentPage = res.paginated_data.current_page;
            this.totalPages = res.paginated_data.total_pages;
            this.totalData = res.paginated_data.total_data;
            this.pageSize = res.paginated_data.page_size;
          }
        }
       
      },
      error: (error) => {
        console.error('Error loading relocations:', error);
        
      }
    })
  }

  loadData(page: number = this.currentPage) {
    this.loading = true;
    this.currentPage = page;
    const payload: any = {
      company: 1,
      warehouse: 1,
      page_number: this.currentPage,
      page_size: this.pageSize,
      start_date: this.startDate,
      end_date: this.endDate
    };
    const search = this.searchText ? this.searchText : '';
    this.svc.post('/items/list-item/s=' + search + '/', payload).subscribe({
      next: (res: any) => {
        if(res.status == 200){
          this.relocations = res.data;
          if (res) {
            this.currentPage = res.current_page;
            this.totalPages = res.total_pages;
            this.totalData = res.total_data;
            this.pageSize = res.page_size;
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
    const formattedToday = `${yyyy}-${mm}-${dd}`;
    this.startDate = formattedToday;
    this.endDate = formattedToday;
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

    onView(modal: any,item: any) {
      this.loadlog(item.id)
    const modalRef = this.modalService.open(modal, { centered: true, size: 'lg' });

    console.log('View relocation item:', item);
  }

  onEdit(item: any) {
    const modalRef = this.modalService.open(RelocationForm, { centered: true, size: 'lg' });
    modalRef.componentInstance.relocationData = item;
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
    return this.relocations.reduce((sum, item) => sum + this.getTotalQty(item.locations), 0);
  }

  // Get status badge class based on transaction type
  getStatusBadgeClass(type: string): string {
    switch(type?.toLowerCase()) {
      case 'transfer':
        return 'bg-info';
      case 'movement':
        return 'bg-warning';
      case 'adjustment':
        return 'bg-secondary';
      default:
        return 'bg-primary';
    }
  }

  // Check if relocation is recent (within 7 days)
  isRecentRelocation(createdAt: string): boolean {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate > sevenDaysAgo;
  }

  // Refresh data
  refreshData() {
    this.loadData();
    this.loadWarehouses();
    this.loadLocations();
  }

  // Load sample data for testing - remove this after API integration
  loadSampleData() {
    const sampleData = [
      {
        "id": 2,
        "quantity": 1,
        "transaction_type": "transfer",
        "transaction_date": "2025-06-25T13:59:01+05:30",
        "created_at": "2025-06-25T13:59:01+05:30",
        "updated_at": null,
        "deleted": false,
        "company": 1,
        "from_warehouse": 1,
        "to_warehouse": 2,
        "from_location": 1,
        "to_location": 3,
        "item": 2,
        "batch": null
      }
    ];
    
    // Only use sample data if no data is loaded from API
    if (this.relocations.length === 0) {
      this.relocations = sampleData;
      this.toast.show('Info', 'Loaded sample data for testing', 'info');
    }
  }

  getUniqueWarehouses(locations: any[]): string[] {
    if (!locations) return [];
    const names = locations.map(l => l.warehouse_name);
    return [...new Set(names)];
  }

  getWarehousesWithLocations(locations: any[]): { name: string, locations: any[] }[] {
    if (!locations) return [];
    const map = new Map<string, any[]>();
    locations.forEach(loc => {
      if (!map.has(loc.warehouse_name)) {
        map.set(loc.warehouse_name, []);
      }
      const arr = map.get(loc.warehouse_name);
      if (arr) {
        arr.push(loc);
      }
    });
    return Array.from(map.entries()).map(([name, locations]) => ({ name, locations }));
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

  getStockStatus(qty: number): string {
    if (qty <= 5) return 'Low Stock';
    if (qty <= 15) return 'Reorder';
    return 'In Stock';
  }

  getRelocationWarehouseCount(): number {
    const warehouseNames = new Set<string>();
    this.relocations.forEach(item => {
      if (item.locations) {
        item.locations.forEach((loc: any) => {
          if (loc.warehouse_name) {
            warehouseNames.add(loc.warehouse_name);
          }
        });
      }
    });
    return warehouseNames.size;
  }

  getRelocationLocationCount(): number {
    const locationNames = new Set<string>();
    this.relocations.forEach(item => {
      if (item.locations) {
        item.locations.forEach((loc: any) => {
          if (loc.location_name) {
            locationNames.add(loc.location_name);
          }
        });
      }
    });
    return locationNames.size;
  }
}
