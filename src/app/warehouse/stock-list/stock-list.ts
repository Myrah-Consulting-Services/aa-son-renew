import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl:'./stock-list.html',
  styleUrl: './stock-list.scss'
})
export class StockList implements OnInit {
  stock: any[] = [];
  warehouses: any[] = [];
  locations: any[] = [];
  items: any[] = [];
  total_count: any;
  loading = false;
  
  // Warehouse/Showroom selection
  selectedWarehouseId: number = 1; // Default to warehouse
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalData = 0;
  constructor(
    public svc: Api,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData(page: number = this.currentPage) {
    this.loading = true;
    this.currentPage = page;
    const payload: any = {
      company: 1,
      warehouse: this.selectedWarehouseId,
      page: this.currentPage,
      page_size: this.pageSize,
    };
    this.svc.post('/items/list-item/s=/', payload).subscribe((res: any) => {
      this.loading = false;
      if(res.status == 200){
        this.total_count = res.total_count;
        this.stock = res.data;
        // Process location data if available
        if (res) {
          this.currentPage = res.current_page;
          this.totalPages = res.total_pages;
          this.totalData = res.total_count;
          this.pageSize = res.page_size;
        }
        this.processLocationData();
        
        // Show success message
        const locationType = this.selectedWarehouseId === 1 ? 'Warehouse' : 'Showroom';
      } 
    }, (error) => {
      this.loading = false;
      console.error('Error loading stock data:', error);
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

  onWarehouseChange() {
    this.currentPage = 1;
    this.loadData(1);
  }

  refreshData() {
    this.currentPage = 1;
    this.loadData(1);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadData(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.loadData(this.currentPage + 1);
    }
  }

  // Statistics methods
  getInStockCount(): number {
    return this.stock.filter(item => this.getTotalQuantity(item) >= 50).length;
  }

  getLowStockCount(): number {
    return this.stock.filter(item => this.getTotalQuantity(item) < 10).length;
  }

  getStockStatus(item: any): string {
    const qty = this.getTotalQuantity(item);
    if (qty >= 50) return 'In Stock';
    if (qty < 10) return 'Low Stock';
    return 'Reorder';
  }

  getStockStatusBadgeClass(item: any): string {
    const qty = this.getTotalQuantity(item);
    if (qty >= 50) return 'badge-active';
    if (qty < 10) return 'badge-inactive';
    return 'badge-warning';
  }

  getStockStatusIcon(item: any): string {
    const qty = this.getTotalQuantity(item);
    if (qty >= 50) return 'bi-check-circle-fill';
    if (qty < 10) return 'bi-exclamation-circle-fill';
    return 'bi-arrow-repeat';
  }

  processLocationData() {
    // If stock data contains location information, process it
    this.stock.forEach(item => {
      if (item.location_data) {
        // Handle location data structure like the one provided
        const locationInfo = item.location_data;
        if (Array.isArray(locationInfo)) {
          // If it's an array of location data
          item.locations = locationInfo.map((loc: any) => ({
            location_id: loc.location_id,
            location_name: loc.location_name,
            warehouse_id: loc.warehouse_id,
            warehouse_name: loc.warehouse_name,
            qty: loc.qty
          }));
        } else if (typeof locationInfo === 'object') {
          // If it's a single location object
          item.locations = [{
            location_id: locationInfo.location_id,
            location_name: locationInfo.location_name,
            warehouse_id: locationInfo.warehouse_id,
            warehouse_name: locationInfo.warehouse_name,
            qty: locationInfo.qty
          }];
        }
      }
    });
  }

  getItem(id: number) { 
    return this.items.find(i => i.id === id);
  }
  
  getWarehouseName(id: number) { 
    return this.warehouses.find(w => w.id === id)?.name || 'Unknown'; 
  }
  
  getLocationDisplay(item: any): string {
    if (item.locations && item.locations.length > 0) {
      return item.locations.map((loc: any) => 
        `${loc.location_name} (${loc.qty})`
      ).join(', ');
    }
    return item.location || 'N/A';
  }

  getTotalQuantity(item: any): number {
    if (item.locations && item.locations.length > 0) {
      return item.locations.reduce((total: number, loc: any) => total + (loc.qty || 0), 0);
    }
    return item.quantity || 0;
  }

  getTotalStockValue(): number {
    return this.stock.reduce((total, item) => total + this.getTotalQuantity(item), 0);
  }
}
