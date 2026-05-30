import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-rack-movement-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-arrow-left-right text-primary me-2"></i>
            Rack Movements
          </h2>
          <p class="text-muted mb-0">Manage internal rack-to-rack material movements</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" (click)="refreshData()">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
          <button class="btn btn-outline-primary" (click)="exportData()">
            <i class="bi bi-download me-1"></i>
            Export
          </button>
          <button class="btn btn-primary" (click)="createMovement()">
            <i class="bi bi-plus-lg me-1"></i>
            New Movement
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <form [formGroup]="filterForm">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label">Search</label>
                <input type="text" class="form-control" formControlName="search" 
                       placeholder="Search movements...">
              </div>
              <div class="col-md-2">
                <label class="form-label">Status</label>
                <select class="form-select" formControlName="status">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Priority</label>
                <select class="form-select" formControlName="priority">
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">From Date</label>
                <input type="date" class="form-control" formControlName="fromDate">
              </div>
              <div class="col-md-2">
                <label class="form-label">To Date</label>
                <input type="date" class="form-control" formControlName="toDate">
              </div>
              <div class="col-md-1 d-flex align-items-end">
                <button class="btn btn-primary w-100" (click)="applyFilters()">
                  <i class="bi bi-funnel"></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Movements Table -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0 py-3">
          <h6 class="mb-0 fw-semibold">
            Movements ({{ movements.length }})
          </h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="border-0 ps-3">Movement ID</th>
                  <th class="border-0">Created</th>
                  <th class="border-0">From → To</th>
                  <th class="border-0">Item</th>
                  <th class="border-0">Initiator</th>
                  <th class="border-0">Executor</th>
                  <th class="border-0">Status</th>
                  <th class="border-0">Priority</th>
                  <th class="border-0 text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let movement of movements" class="align-middle">
                  <td class="ps-3">
                    <div class="fw-semibold text-primary">#{{ movement.id }}</div>
                    <small class="text-muted">{{ movement.type }}</small>
                  </td>
                  <td>
                    <div>{{ movement.createdAt | date:'mediumDate' }}</div>
                    <small class="text-muted">{{ movement.createdAt | date:'shortTime' }}</small>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <span class="badge bg-light text-dark me-2">{{ movement.fromRack }}</span>
                      <i class="bi bi-arrow-right me-2"></i>
                      <span class="badge bg-light text-dark">{{ movement.toRack }}</span>
                    </div>
                    <small class="text-muted d-block">{{ movement.reason }}</small>
                  </td>
                  <td>
                    <div class="fw-medium">{{ movement.itemName }}</div>
                    <small class="text-muted">Qty: {{ movement.quantity }}</small>
                  </td>
                  <td>
                    <div class="fw-medium">{{ movement.initiatorName }}</div>
                    <small class="text-muted">{{ movement.initiatorRole }}</small>
                  </td>
                  <td>
                    <div class="fw-medium">{{ movement.executorName || 'Unassigned' }}</div>
                    <small class="text-muted">{{ movement.executorRole || '' }}</small>
                  </td>
                  <td>
                    <span class="badge" 
                          [class.bg-secondary]="movement.status === 'pending'"
                          [class.bg-warning]="movement.status === 'assigned'"
                          [class.bg-info]="movement.status === 'in_progress'"
                          [class.bg-success]="movement.status === 'completed'"
                          [class.bg-danger]="movement.status === 'cancelled'">
                      {{ movement.status | titlecase }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" 
                          [class.bg-light]="movement.priority === 'low'"
                          [class.bg-warning]="movement.priority === 'medium'"
                          [class.bg-danger]="movement.priority === 'high'"
                          [class.bg-dark]="movement.priority === 'critical'">
                      {{ movement.priority | titlecase }}
                    </span>
                  </td>
                  <td class="text-end pe-3">
                    <div class="btn-group" role="group">
                      <button class="btn btn-sm btn-outline-primary" (click)="viewMovement(movement)">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-success" 
                              *ngIf="movement.status === 'assigned'"
                              (click)="startMovement(movement)">
                        <i class="bi bi-play"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-success" 
                              *ngIf="movement.status === 'in_progress'"
                              (click)="completeMovement(movement)">
                        <i class="bi bi-check"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" 
                              *ngIf="movement.status === 'pending'"
                              (click)="cancelMovement(movement)">
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-hover tbody tr:hover {
      background-color: rgba(0, 123, 255, 0.05);
    }
    
    .badge {
      font-size: 0.75em;
    }
  `]
})
export class RackMovementListComponent implements OnInit {
  filterForm: FormGroup;
  movements: any[] = [
    {
      id: 'RM001',
      type: 'System Generated',
      createdAt: new Date(),
      fromRack: 'R001-A1',
      toRack: 'R005-C1',
      itemName: 'Steel Pipes',
      quantity: 25,
      reason: 'Capacity Threshold',
      initiatorName: 'System',
      initiatorRole: 'Automated',
      executorName: 'Akshay Raut',
      executorRole: 'Forklift Operator',
      status: 'in_progress',
      priority: 'high'
    },
    {
      id: 'RM002',
      type: 'Manual',
      createdAt: new Date(),
      fromRack: 'R003-B1',
      toRack: 'R002-A2',
      itemName: 'Electronic Components',
      quantity: 150,
      reason: 'Space Optimization',
      initiatorName: 'Prajakta Kamble',
      initiatorRole: 'Warehouse Supervisor',
      executorName: 'Sanjay Pawar',
      executorRole: 'Store Keeper',
      status: 'assigned',
      priority: 'medium'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private api: Api
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      priority: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    // Load movements from API
  }

  applyFilters(): void {
    // Apply filters to movement list
  }

  refreshData(): void {
    this.loadMovements();
  }

  exportData(): void {
    // Export movement data
  }

  createMovement(): void {
    // Navigate to movement creation
  }

  viewMovement(movement: any): void {
    // View movement details
  }

  startMovement(movement: any): void {
    movement.status = 'in_progress';
    // Update movement status
  }

  completeMovement(movement: any): void {
    movement.status = 'completed';
    // Update movement status
  }

  cancelMovement(movement: any): void {
    movement.status = 'cancelled';
    // Update movement status
  }
} 