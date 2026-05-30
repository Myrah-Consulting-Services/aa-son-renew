import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportFilter } from '../reports.service';

@Component({
  selector: 'app-report-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Filters</h5>
        <button class="btn btn-sm btn-outline-secondary" (click)="clearFilters()">
          <i class="bi bi-x-circle me-1"></i> Clear All
        </button>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- Warehouse Filter -->
          <div class="col-md-2 mb-3" *ngIf="showWarehouseFilter">
            <label class="form-label">Warehouse</label>
            <select class="form-select" [(ngModel)]="filters.warehouse" (change)="onFilterChange()">
              <option value="">All Warehouses</option>
              <option *ngFor="let warehouse of warehouses" [value]="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
          </div>

          <!-- Item Filter -->
          <div class="col-md-2 mb-3" *ngIf="showItemFilter">
            <label class="form-label">Item</label>
            <select class="form-select" [(ngModel)]="filters.item" (change)="onFilterChange()">
              <option value="">All Items</option>
              <option *ngFor="let item of items" [value]="item.id">
                {{ item.name }}
              </option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="col-md-2 mb-3" *ngIf="showStatusFilter">
            <label class="form-label">Status</label>
            <select class="form-select" [(ngModel)]="filters.status" (change)="onFilterChange()">
              <option value="">All Status</option>
              <option *ngFor="let status of statusOptions" [value]="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>

          <!-- Department Filter -->
          <div class="col-md-2 mb-3" *ngIf="showDepartmentFilter">
            <label class="form-label">Department</label>
            <select class="form-select" [(ngModel)]="filters.department" (change)="onFilterChange()">
              <option value="">All Departments</option>
              <option *ngFor="let dept of departments" [value]="dept">
                {{ dept }}
              </option>
            </select>
          </div>

          <!-- Source Filter -->
          <div class="col-md-2 mb-3" *ngIf="showSourceFilter">
            <label class="form-label">Source</label>
            <select class="form-select" [(ngModel)]="filters.source" (change)="onFilterChange()">
              <option value="">All Sources</option>
              <option *ngFor="let source of sources" [value]="source">
                {{ source }}
              </option>
            </select>
          </div>

          <!-- Date Range Filters -->
          <div class="col-md-2 mb-3" *ngIf="showDateFilters">
            <label class="form-label">Start Date</label>
            <input type="date" class="form-control" [(ngModel)]="filters.startDate" (change)="onFilterChange()">
          </div>

          <div class="col-md-2 mb-3" *ngIf="showDateFilters">
            <label class="form-label">End Date</label>
            <input type="date" class="form-control" [(ngModel)]="filters.endDate" (change)="onFilterChange()">
          </div>

          <!-- Quick Date Range Buttons -->
          <div class="col-md-6 mb-3" *ngIf="showQuickDateButtons">
            <label class="form-label">Quick Date Range</label>
            <div class="btn-group w-100" role="group">
              <button type="button" class="btn btn-outline-primary btn-sm" (click)="setDateRange('today')">Today</button>
              <button type="button" class="btn btn-outline-primary btn-sm" (click)="setDateRange('week')">Week</button>
              <button type="button" class="btn btn-outline-primary btn-sm" (click)="setDateRange('month')">Month</button>
              <button type="button" class="btn btn-outline-primary btn-sm" (click)="setDateRange('quarter')">Quarter</button>
              <button type="button" class="btn btn-outline-primary btn-sm" (click)="setDateRange('year')">Year</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-group .btn {
      font-size: 0.875rem;
    }
    
    .form-select, .form-control {
      border-radius: 0.375rem;
      border: 1px solid #dee2e6;
      
      &:focus {
        border-color: #86b7fe;
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
      }
    }
  `]
})
export class ReportFiltersComponent {
  @Input() filters: ReportFilter = {};
  @Input() warehouses: any[] = [];
  @Input() items: any[] = [];
  @Input() statusOptions: { value: string; label: string }[] = [];
  @Input() departments: string[] = [];
  @Input() sources: string[] = [];
  
  @Input() showWarehouseFilter = true;
  @Input() showItemFilter = true;
  @Input() showStatusFilter = false;
  @Input() showDepartmentFilter = false;
  @Input() showSourceFilter = false;
  @Input() showDateFilters = true;
  @Input() showQuickDateButtons = true;

  @Output() filterChange = new EventEmitter<ReportFilter>();

  onFilterChange() {
    this.filterChange.emit(this.filters);
  }

  clearFilters() {
    this.filters = {};
    this.onFilterChange();
  }

  setDateRange(range: 'today' | 'week' | 'month' | 'quarter' | 'year') {
    const now = new Date();
    const start = new Date(now);
    
    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    this.filters.startDate = start.toISOString().split('T')[0];
    this.filters.endDate = now.toISOString().split('T')[0];
    this.onFilterChange();
  }
} 