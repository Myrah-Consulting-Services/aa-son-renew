import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../../core/services/api';
@Component({
  selector: 'app-warehouse-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './warehouse-performance.html',
  styleUrl: './warehouse-performance.scss'
})
export class WarehousePerformance implements OnInit {
  warehouses: any[] = [];
  stock: any[] = [];
  inwardTransactions: any[] = [];
  outwardTransactions: any[] = [];
  relocations: any[] = [];
  damages: any[] = [];
  requisitions: any[] = [];
  
  filters = {
    warehouse: '',
    metric: 'overview',
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
  }

  loadData() {
    this.svc.get('/warehouses/list-warehouse/').subscribe((res: any) => {
      if(res.status == 200){
        this.warehouses = res.data;
      }
    });
    this.svc.get('/warehouses/list-stock/').subscribe((res: any) => {
      if(res.status == 200){
        this.stock = res.data;
      }
    });
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
    this.svc.get('/warehouses/list-relocation/').subscribe((res: any) => {
      if(res.status == 200){
        this.relocations = res.data;
      }
    });
    this.svc.get('/warehouses/list-damage-report/').subscribe((res: any) => {
      if(res.status == 200){
        this.damages = res.data;
      }
    });
    this.svc.get('/warehouses/list-requisition/').subscribe((res: any) => {
      if(res.status == 200){
        this.requisitions = res.data;
      }
    }); 
  }

  applyFilters() {
    // Implementation would filter based on selected criteria
  }

  getWarehouseName(id: number): string {
    const warehouse = this.warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : 'Unknown';
  }

  getWarehousePerformance() {
    return this.warehouses.map(warehouse => {
      const warehouseStock = this.stock.filter(s => s.warehouseId === warehouse.id);
      const warehouseInward = this.inwardTransactions.filter(t => t.warehouseId === warehouse.id);
      const warehouseOutward = this.outwardTransactions.filter(t => t.warehouseId === warehouse.id);
      const warehouseDamages = this.damages.filter(d => d.warehouseId === warehouse.id);

      const totalStock = warehouseStock.reduce((sum, s) => sum + s.quantity, 0);
      const totalInward = warehouseInward.reduce((sum, t) => sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0);
      const totalOutward = warehouseOutward.reduce((sum, t) => sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0);
      const totalDamages = warehouseDamages.reduce((sum, d) => sum + d.quantity, 0);

      const efficiency = totalOutward > 0 ? ((totalOutward - totalDamages) / totalOutward * 100) : 100;
      const utilization = totalStock > 0 ? (totalStock / 1000 * 100) : 0; // Assuming 1000 is max capacity

      return {
        id: warehouse.id,
        name: warehouse.name,
        totalStock,
        totalInward,
        totalOutward,
        totalDamages,
        efficiency: Math.round(efficiency),
        utilization: Math.round(utilization)
      };
    });
  }

  getActivitySummary() {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentInward = this.inwardTransactions.filter(t => new Date(t.date) >= lastWeek).length;
    const recentOutward = this.outwardTransactions.filter(t => new Date(t.date) >= lastWeek).length;
    const recentRelocations = this.relocations.filter(r => new Date(r.date) >= lastWeek).length;
    const recentDamages = this.damages.filter(d => new Date(d.date) >= lastWeek).length;

    return {
      recentInward,
      recentOutward,
      recentRelocations,
      recentDamages,
      totalWarehouses: this.warehouses.length,
      totalItems: this.stock.length
    };
  }

  getLocationUtilization() {
    // This would need to be implemented based on your location service
    return this.warehouses.map(warehouse => ({
      warehouse: warehouse.name,
      locations: Math.floor(Math.random() * 10) + 5, // Mock data
      utilization: Math.floor(Math.random() * 40) + 60 // Mock data 60-100%
    }));
  }

  exportToCSV() {
    const performanceData = this.getWarehousePerformance();
    const headers = ['Warehouse', 'Total Stock', 'Total Inward', 'Total Outward', 'Total Damages', 'Efficiency %', 'Utilization %'];
    const csvContent = [
      headers.join(','),
      ...performanceData.map(perf => [
        perf.name,
        perf.totalStock,
        perf.totalInward,
        perf.totalOutward,
        perf.totalDamages,
        perf.efficiency,
        perf.utilization
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'warehouse-performance.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  clearFilters() {
    this.filters = {
      warehouse: '',
      metric: 'overview',
      startDate: '',
      endDate: ''
    };
    this.applyFilters();
  }
} 