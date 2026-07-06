import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-damage-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './damage-report.html',
  styleUrl: './damage-report.scss'
})
export class DamageReport implements OnInit {
  damages: any[] = [];
  filteredDamages: any[] = [];
  warehouses: any[] = [];
  items: any[] = [];
  
  filters = {
    warehouse: '',
    item: '',
    startDate: '',
    endDate: '',
    source: ''
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
    this.svc.get('/warehouses/damage-report/').subscribe((res: any) => {
      if(res.status == 200){
        this.damages = res.data;
        this.filteredDamages = [...res.data];
      }
    });
    this.svc.listWarehouses().subscribe((res: any) => {
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
    this.filteredDamages = this.damages.filter(damage => {
      const warehouse = this.filters.warehouse;
      const item = this.filters.item;
      const startDate = this.filters.startDate;
      const endDate = this.filters.endDate;
      const source = this.filters.source;

      if (warehouse && damage.warehouseId !== +warehouse) return false;
      if (item && damage.itemId !== +item) return false;
      if (startDate && new Date(damage.date) < new Date(startDate)) return false;
      if (endDate && new Date(damage.date) > new Date(endDate)) return false;
      if (source && damage.source !== source) return false;

      return true;
    });
  }

  getWarehouseName(id: number): string {
    const warehouse = this.warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : 'Unknown';
  }

  getItemName(id: number): string {
    const item = this.items.find(i => i.id === id);
    return item ? item.name : 'Unknown';
  }

  getLocationName(id: number): string {
    // This would need to be implemented based on your location service
    return `Location ${id}`;
  }

  getTotalDamageValue(): number {
    return this.filteredDamages.reduce((total, damage) => {
      const item = this.items.find(i => i.id === damage.itemId);
      return total + (damage.quantity * (item?.price || 0));
    }, 0);
  }

  getTotalDamagedQuantity(): number {
    return this.filteredDamages.reduce((total, damage) => total + damage.quantity, 0);
  }

  getUniqueItemsCount(): number {
    const uniqueItems = new Set(this.filteredDamages.map(damage => damage.itemId));
    return uniqueItems.size;
  }

  getDamageValue(damage: any): number {
    const item = this.items.find(i => i.id === damage.itemId);
    return damage.quantity * (item?.price || 0);
  }

  getDamageBySource() {
    const sourceMap = new Map<string, number>();
    this.filteredDamages.forEach(damage => {
      const count = sourceMap.get(damage.source) || 0;
      sourceMap.set(damage.source, count + 1);
    });
    return Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count }));
  }

  getDamageByItem() {
    const itemMap = new Map<string, number>();
    this.filteredDamages.forEach(damage => {
      const itemName = this.getItemName(damage.itemId);
      const count = itemMap.get(itemName) || 0;
      itemMap.set(itemName, count + damage.quantity);
    });
    return Array.from(itemMap.entries()).map(([item, quantity]) => ({ item, quantity }));
  }

  exportToCSV() {
    const headers = ['Date', 'Item', 'Warehouse', 'Location', 'Quantity', 'Reason', 'Source', 'Value'];
    const csvContent = [
      headers.join(','),
      ...this.filteredDamages.map(damage => {
        const item = this.items.find(i => i.id === damage.itemId);
        const value = damage.quantity * (item?.price || 0);
        return [
          new Date(damage.date).toLocaleDateString(),
          this.getItemName(damage.itemId),
          this.getWarehouseName(damage.warehouseId),
          this.getLocationName(damage.locationId),
          damage.quantity,
          damage.reason,
          damage.source,
          value.toFixed(2)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'damage-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  clearFilters() {
    this.filters = {
      warehouse: '',
      item: '',
      startDate: '',
      endDate: '',
      source: ''
    };
    this.applyFilters();
  }
} 