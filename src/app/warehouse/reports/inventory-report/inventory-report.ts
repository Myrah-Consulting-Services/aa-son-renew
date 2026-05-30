import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-inventory-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './inventory-report.html',
  styleUrl: './inventory-report.scss'
})
export class InventoryReport implements OnInit {
  stock: any[] = [];
  filteredStock: any[] = [];
  warehouses: any[] = [];
  items: any[] = [];
  
  filters = {
    warehouse: '',
    item: '',
    minQuantity: '',
    maxQuantity: '',
    status: ''
  };

  constructor(
    private svc: Api,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadData();
    this.applyFilters();
  }

  loadData() {
    this.svc.get('/warehouses/list-stock/').subscribe((res: any) => {
      if(res.status == 200){
        this.stock = res.data;
        this.filteredStock = [...res.data];
      }
    });
    this.svc.get('/warehouses/list-warehouse/').subscribe((res: any) => {
      if(res.status == 200){
        this.warehouses = res.data;
      }
    });
    this.svc.get('/warehouses/list-item/').subscribe((res: any) => {
      if(res.status == 200){
        this.items = res.data;
      }
    });
  }

  applyFilters() {
    this.filteredStock = this.stock.filter(item => {
      const warehouse = this.filters.warehouse;
      const itemFilter = this.filters.item;
      const minQty = this.filters.minQuantity;
      const maxQty = this.filters.maxQuantity;
      const status = this.filters.status;

      if (warehouse && item.warehouseId !== +warehouse) return false;
      if (itemFilter && item.itemId !== +itemFilter) return false;
      if (minQty && item.quantity < +minQty) return false;
      if (maxQty && item.quantity > +maxQty) return false;
      if (status) {
        const itemStatus = this.getItemStatus(item.quantity);
        if (status !== itemStatus) return false;
      }

      return true;
    });
  }

  getItemStatus(quantity: number): string {
    if (quantity >= 50) return 'In Stock';
    if (quantity >= 10) return 'Reorder';
    return 'Low Stock';
  }

  getWarehouseName(id: number): string {
    const warehouse = this.warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : 'Unknown';
  }

  getItemName(id: number): string {
    const item = this.items.find(i => i.id === id);
    return item ? item.name : 'Unknown';
  }

  getTotalValue(): number {
    return this.filteredStock.reduce((total, item) => {
      const itemData = this.items.find(i => i.id === item.itemId);
      return total + (item.quantity * (itemData?.price || 0));
    }, 0);
  }

  getInStockCount(): number {
    return this.filteredStock.filter(s => this.getItemStatus(s.quantity) === 'In Stock').length;
  }

  getLowStockCount(): number {
    return this.filteredStock.filter(s => this.getItemStatus(s.quantity) === 'Low Stock').length;
  }

  getItemSku(itemId: number): string {
    const item = this.items.find(i => i.id === itemId);
    return item?.sku || '-';
  }

  getItemValue(item: any): number {
    const itemData = this.items.find(i => i.id === item.itemId);
    return item.quantity * (itemData?.price || 0);
  }

  exportToCSV() {
    const headers = ['Item', 'SKU', 'Warehouse', 'Location', 'Quantity', 'Status', 'Value'];
    const csvContent = [
      headers.join(','),
      ...this.filteredStock.map(item => {
        const itemData = this.items.find(i => i.id === item.itemId);
        const value = item.quantity * (itemData?.price || 0);
        return [
          this.getItemName(item.itemId),
          this.getItemSku(item.itemId),
          this.getWarehouseName(item.warehouseId),
          this.getLocationName(item.locationId),
          item.quantity,
          this.getItemStatus(item.quantity),
          value.toFixed(2)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getLocationName(id: number): string {
    // This would need to be implemented based on your location service
    return `Location ${id}`;
  }

  clearFilters() {
    this.filters = {
      warehouse: '',
      item: '',
      minQuantity: '',
      maxQuantity: '',
      status: ''
    };
    this.applyFilters();
  }
} 