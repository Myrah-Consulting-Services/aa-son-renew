import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-movements-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './movements-report.html',
  styleUrl: './movements-report.scss'
})
export class MovementsReport implements OnInit {
  inwardTransactions: any[] = [];
  outwardTransactions: any[] = [];
  relocations: any[] = [];
  warehouses: any[] = [];
  items: any[] = [];
  
  filters = {
    type: 'all',
    warehouse: '',
    item: '',
    startDate: '',
    endDate: ''
  };

  constructor(
    private svc: Api,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadData();
    this.applyFilters();
    
    // Handle query parameters
    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.filters.type = params['filter'];
        this.applyFilters();
      }
    });
  }

  loadData() {
    this.svc.get('/warehouses/list-inward-transaction/').subscribe((res: any) => {
      if(res.status == 200){
        this.inwardTransactions = res.data;
      }
    });
    this.svc.get('/warehouses/list-outward-transaction/').subscribe((res: any) => {
      if(res.status == 200){
        this.outwardTransactions = res.data;
      }
    });
  }

  applyFilters() {
    // This method would filter the data based on the selected criteria
    // For now, we'll just return the data as is since filtering is handled in getFilteredData()
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

  exportToCSV() {
    const data = this.getFilteredData();
    const headers = ['Date', 'Type', 'Warehouse', 'Item', 'Quantity', 'Location'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.type,
        this.getWarehouseName(item.warehouseId),
        this.getItemName(item.itemId),
        item.quantity || item.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0,
        this.getLocationName(item.locationId)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movements-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getFilteredData() {
    let data: any[] = [];
    
    if (this.filters.type === 'all' || this.filters.type === 'inward') {
      data = data.concat(this.inwardTransactions.map(t => ({ ...t, type: 'Inward' })));
    }
    if (this.filters.type === 'all' || this.filters.type === 'outward') {
      data = data.concat(this.outwardTransactions.map(t => ({ ...t, type: 'Outward' })));
    }
    if (this.filters.type === 'all' || this.filters.type === 'relocation') {
      data = data.concat(this.relocations.map(t => ({ ...t, type: 'Relocation' })));
    }
    
    return data;
  }
} 