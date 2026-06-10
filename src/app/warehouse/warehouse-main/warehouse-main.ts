import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-warehouse-main',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './warehouse-main.html',
  styleUrls: ['./warehouse-main.scss']
})
export class WarehouseMain {
  isSidebarMode: boolean = true; // Default to tab mode
  
  // Navigation links
  navLinks = [
    { path: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: 'warehouses', label: 'Warehouses', icon: 'bi-building' },
    { path: 'locations', label: 'Locations', icon: 'bi-geo-alt' },
    { path: 'stock', label: 'Stock', icon: 'bi-boxes' },
    { path: 'inward', label: 'Inward', icon: 'bi-box-arrow-in-down' },
    { path: 'putaway-tasks/list', label: 'Putaway Tasks', icon: 'bi-arrow-up-right-square' },
    // { path: 'rack-movements/list', label: 'Rack Movements', icon: 'bi-arrow-left-right' },
    { path: 'relocation', label: 'Relocation', icon: 'bi-shuffle' },
    { path: 'requisition', label: 'Requisition', icon: 'bi-clipboard-check' },
    { path: 'outward', label: 'Outward', icon: 'bi-box-arrow-up' },
    { path: 'reports', label: 'Reports', icon: 'bi-graph-up' }
  ];

  constructor(
    private router: Router,
    private api: Api,
    private toast: ToastService
  ) {}

  toggleLayout(): void {
    this.isSidebarMode = !this.isSidebarMode;
  }
} 