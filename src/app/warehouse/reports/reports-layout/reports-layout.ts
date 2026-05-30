import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-reports-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reports-layout.html',
  styleUrl: './reports-layout.scss'
})
export class ReportsLayout {
  constructor(private router: Router) {}

  reportCategories = [
    {
      title: 'Inventory Reports',
      description: 'Stock levels, item analysis, and inventory valuation',
      icon: 'bi-box-seam',
      color: 'primary',
      reports: [
        { name: 'Current Stock Levels', route: 'warehouse/reports/inventory', icon: 'bi-list-ul' },
        { name: 'Low Stock Alerts', route: 'warehouse/reports/inventory', icon: 'bi-exclamation-triangle', filter: 'low-stock' },
        { name: 'Stock Valuation', route: 'warehouse/reports/inventory', icon: 'bi-currency-dollar', filter: 'valuation' }
      ]
    },
    {
      title: 'Movement Reports',
      description: 'Inward, outward, and relocation transactions',
      icon: 'bi-arrows-move',
      color: 'success',
      reports: [
        { name: 'Inward Transactions', route: 'warehouse/reports/movements', icon: 'bi-arrow-down-circle', filter: 'inward' },
        { name: 'Outward Transactions', route: 'warehouse/reports/movements', icon: 'bi-arrow-up-circle', filter: 'outward' },
        { name: 'Item Relocations', route: 'warehouse/reports/movements', icon: 'bi-arrow-left-right', filter: 'relocation' }
      ]
    },
    {
      title: 'Damage Reports',
      description: 'Damage analysis and loss tracking',
      icon: 'bi-exclamation-triangle',
      color: 'danger',
      reports: [
        { name: 'Damage Summary', route: 'warehouse/reports/damage', icon: 'bi-clipboard-data' },
        { name: 'Damage by Item', route: 'warehouse/reports/damage', icon: 'bi-box', filter: 'item' },
        { name: 'Damage by Location', route: 'warehouse/reports/damage', icon: 'bi-geo-alt', filter: 'location' }
      ]
    },
    {
      title: 'Requisition Reports',
      description: 'Request tracking and approval analysis',
      icon: 'bi-journal-text',
      color: 'warning',
      reports: [
        { name: 'Pending Requisitions', route: 'warehouse/requisitions', icon: 'bi-clock', filter: 'pending' },
        { name: 'Approved Requisitions', route: 'warehouse/reports/requisitions', icon: 'bi-check-circle', filter: 'approved' },
        { name: 'Requisition Summary', route: 'warehouse/reports/requisitions', icon: 'bi-bar-chart' }
      ]
    },
    {
      title: 'Performance Reports',
      description: 'Warehouse efficiency and performance metrics',
      icon: 'bi-speedometer2',
      color: 'info',
      reports: [
        { name: 'Warehouse Performance', route: 'warehouse/reports/warehouse-performance', icon: 'bi-building' },
        { name: 'Location Utilization', route: 'warehouse/reports/warehouse-performance', icon: 'bi-pie-chart', filter: 'utilization' },
        { name: 'Activity Summary', route: 'warehouse/reports/warehouse-performance', icon: 'bi-graph-up', filter: 'activity' }
      ]
    }
  ];

  navigateToReport(report: any) {
    if (report.filter) {
      this.router.navigate([report.route], { queryParams: { filter: report.filter } });
    } else {
      this.router.navigate([report.route]);
    }
  }

  isActiveReport(report: any): boolean {
    const currentUrl = this.router.url;
    return currentUrl.startsWith(report.route);
  }

  goToDashboard() {
    this.router.navigate(['/reports/dashboard']);
  }
} 