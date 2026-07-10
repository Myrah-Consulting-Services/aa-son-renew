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
    const company = this.svc.getCompanyId();

    // Backend CurrentStockReportAPIView requires company (POST body or query)
    this.svc.post('/warehouses/list-stock/', { company }).subscribe((res: any) => {
      if (res.status == 200) {
        // Normalize API fields to what the table/filters expect
        this.stock = (res.data || []).map((row: any) => ({
          ...row,
          itemId: row.itemId ?? row.item_id,
          itemName: row.item ?? row.item_name ?? row.itemName,
          sku: row.sku ?? row.item_code,
          warehouseId: row.warehouseId ?? row.warehouse_id,
          warehouseName: row.warehouse ?? row.warehouseName,
          locationId: row.locationId ?? row.location_id,
          locationName: row.location ?? row.locationName,
          quantity: Number(row.quantity) || 0,
          value: Number(row.value) || 0,
          apiStatus: row.status,
        }));
        this.filteredStock = [...this.stock];
        this.applyFilters();
      }
    });
    this.svc.listWarehouses().subscribe((res: any) => {
      if (res.status == 200) {
        this.warehouses = res.data || [];
      }
    });
    this.svc.listItems('').subscribe((res: any) => {
      if (res.status == 200) {
        this.items = res.data || [];
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

      if (warehouse && Number(item.warehouseId) !== +warehouse) return false;
      if (itemFilter && Number(item.itemId) !== +itemFilter) return false;
      if (minQty !== '' && minQty != null && item.quantity < +minQty) return false;
      if (maxQty !== '' && maxQty != null && item.quantity > +maxQty) return false;
      if (status) {
        const itemStatus = this.getItemStatus(item);
        if (status !== itemStatus) return false;
      }

      return true;
    });
  }

  getItemStatus(itemOrQty: any): string {
    // Prefer API status when present; else derive from quantity
    if (itemOrQty && typeof itemOrQty === 'object') {
      const api = (itemOrQty.apiStatus || itemOrQty.status || '').toString().toLowerCase();
      if (api === 'in_stock') return 'In Stock';
      if (api === 'low_stock') return 'Low Stock';
      if (api === 'out_of_stock') return 'Low Stock';
      const quantity = Number(itemOrQty.quantity) || 0;
      if (quantity >= 50) return 'In Stock';
      if (quantity >= 10) return 'Reorder';
      return 'Low Stock';
    }
    const quantity = Number(itemOrQty) || 0;
    if (quantity >= 50) return 'In Stock';
    if (quantity >= 10) return 'Reorder';
    return 'Low Stock';
  }

  getWarehouseName(id: number): string {
    const fromStock = this.stock.find(s => Number(s.warehouseId) === Number(id));
    if (fromStock?.warehouseName) return fromStock.warehouseName;
    const warehouse = this.warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : 'Unknown';
  }

  getItemName(id: number): string {
    const fromStock = this.stock.find(s => Number(s.itemId) === Number(id));
    if (fromStock?.itemName) return fromStock.itemName;
    const item = this.items.find(i => i.id === id);
    return item ? item.name : 'Unknown';
  }

  getTotalValue(): number {
    return this.filteredStock.reduce((total, item) => {
      if (item.value != null) return total + Number(item.value);
      const itemData = this.items.find(i => i.id === item.itemId);
      return total + (item.quantity * (itemData?.price || itemData?.purchase_rate || 0));
    }, 0);
  }

  getInStockCount(): number {
    return this.filteredStock.filter(s => this.getItemStatus(s) === 'In Stock').length;
  }

  getLowStockCount(): number {
    return this.filteredStock.filter(s => this.getItemStatus(s) === 'Low Stock').length;
  }

  getItemSku(itemId: number): string {
    const fromStock = this.stock.find(s => Number(s.itemId) === Number(itemId));
    if (fromStock?.sku) return fromStock.sku;
    const item = this.items.find(i => i.id === itemId);
    return item?.sku || item?.item_code || '-';
  }

  getItemValue(item: any): number {
    if (item?.value != null) return Number(item.value) || 0;
    const itemData = this.items.find(i => i.id === item.itemId);
    return item.quantity * (itemData?.price || itemData?.purchase_rate || 0);
  }

  exportToCSV() {
    const headers = ['Item', 'SKU', 'Warehouse', 'Location', 'Quantity', 'Status', 'Value'];
    const csvContent = [
      headers.join(','),
      ...this.filteredStock.map(item => {
        const value = this.getItemValue(item);
        return [
          this.getItemName(item.itemId),
          this.getItemSku(item.itemId),
          this.getWarehouseName(item.warehouseId),
          this.getLocationName(item),
          item.quantity,
          this.getItemStatus(item),
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

  getLocationName(itemOrId: any): string {
    if (itemOrId && typeof itemOrId === 'object') {
      return itemOrId.locationName || itemOrId.location || `Location ${itemOrId.locationId || ''}`;
    }
    const fromStock = this.stock.find(s => Number(s.locationId) === Number(itemOrId));
    if (fromStock?.locationName) return fromStock.locationName;
    return `Location ${itemOrId}`;
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