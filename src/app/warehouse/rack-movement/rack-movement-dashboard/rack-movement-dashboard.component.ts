import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-rack-movement-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid p-4">
      <!-- Dashboard Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-diagram-3 text-primary me-2"></i>
            Rack Movement Dashboard
          </h2>
          <p class="text-muted mb-0">Monitor and manage internal rack movements</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary" routerLink="../list">
            <i class="bi bi-list me-1"></i>
            View All Movements
          </button>
          <button class="btn btn-outline-secondary" routerLink="../history">
            <i class="bi bi-clock-history me-1"></i>
            Movement History
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                  <div class="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i class="bi bi-arrow-left-right text-primary fs-4"></i>
                  </div>
                </div>
                <div class="flex-grow-1 ms-3">
                  <h6 class="card-title text-muted mb-1">Total Movements</h6>
                  <h3 class="mb-0 fw-bold">{{ stats.totalMovements }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                  <div class="bg-warning bg-opacity-10 rounded-circle p-3">
                    <i class="bi bi-hourglass-split text-warning fs-4"></i>
                  </div>
                </div>
                <div class="flex-grow-1 ms-3">
                  <h6 class="card-title text-muted mb-1">Pending</h6>
                  <h3 class="mb-0 fw-bold">{{ stats.pendingMovements }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                  <div class="bg-info bg-opacity-10 rounded-circle p-3">
                    <i class="bi bi-play-circle text-info fs-4"></i>
                  </div>
                </div>
                <div class="flex-grow-1 ms-3">
                  <h6 class="card-title text-muted mb-1">In Progress</h6>
                  <h3 class="mb-0 fw-bold">{{ stats.inProgressMovements }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                  <div class="bg-success bg-opacity-10 rounded-circle p-3">
                    <i class="bi bi-check-circle text-success fs-4"></i>
                  </div>
                </div>
                <div class="flex-grow-1 ms-3">
                  <h6 class="card-title text-muted mb-1">Completed</h6>
                  <h3 class="mb-0 fw-bold">{{ stats.completedMovements }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Movements -->
      <div class="row">
        <div class="col-md-8">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0 py-3">
              <h6 class="mb-0 fw-semibold">
                <i class="bi bi-activity me-2"></i>
                Active Movements
              </h6>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="border-0 ps-3">Movement ID</th>
                      <th class="border-0">From → To</th>
                      <th class="border-0">Item</th>
                      <th class="border-0">Executor</th>
                      <th class="border-0">Status</th>
                      <th class="border-0">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let movement of activeMovements" class="align-middle">
                      <td class="ps-3">
                        <div class="fw-semibold text-primary">#{{ movement.id }}</div>
                        <small class="text-muted">{{ movement.createdAt | date:'short' }}</small>
                      </td>
                      <td>
                        <div class="d-flex align-items-center">
                          <span class="badge bg-light text-dark me-2">{{ movement.fromRack }}</span>
                          <i class="bi bi-arrow-right me-2"></i>
                          <span class="badge bg-light text-dark">{{ movement.toRack }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="fw-medium">{{ movement.itemName }}</div>
                        <small class="text-muted">Qty: {{ movement.quantity }}</small>
                      </td>
                      <td>
                        <div class="fw-medium">{{ movement.executorName }}</div>
                        <small class="text-muted">{{ movement.executorRole }}</small>
                      </td>
                      <td>
                        <span class="badge" 
                              [class.bg-warning]="movement.status === 'pending'"
                              [class.bg-info]="movement.status === 'assigned'"
                              [class.bg-primary]="movement.status === 'in_progress'">
                          {{ movement.status | titlecase }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" 
                              [class.bg-light]="movement.priority === 'low'"
                              [class.bg-warning]="movement.priority === 'medium'"
                              [class.bg-danger]="movement.priority === 'high'">
                          {{ movement.priority | titlecase }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0 py-3">
              <h6 class="mb-0 fw-semibold">
                <i class="bi bi-speedometer2 me-2"></i>
                System Triggers
              </h6>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-outline-warning btn-sm" (click)="triggerCapacityAlert()">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  Capacity Alert
                </button>
                <button class="btn btn-outline-danger btn-sm" (click)="triggerMaintenance()">
                  <i class="bi bi-tools me-2"></i>
                  Maintenance Required
                </button>
                <button class="btn btn-outline-info btn-sm" (click)="triggerTemperatureControl()">
                  <i class="bi bi-thermometer-snow me-2"></i>
                  Temperature Control
                </button>
                <button class="btn btn-outline-success btn-sm" (click)="triggerDemandSpike()">
                  <i class="bi bi-graph-up-arrow me-2"></i>
                  High Demand
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card border-0 shadow-sm mt-3">
            <div class="card-header bg-white border-0 py-3">
              <h6 class="mb-0 fw-semibold">
                <i class="bi bi-lightning me-2"></i>
                Quick Actions
              </h6>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-primary btn-sm" (click)="createMovement()">
                  <i class="bi bi-plus me-2"></i>
                  New Movement
                </button>
                <button class="btn btn-outline-primary btn-sm" routerLink="../history">
                  <i class="bi bi-clock-history me-2"></i>
                  View History
                </button>
                <button class="btn btn-outline-secondary btn-sm" (click)="generateReport()">
                  <i class="bi bi-file-earmark-text me-2"></i>
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: all 0.2s ease;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
    }
    
    .table-hover tbody tr:hover {
      background-color: rgba(0, 123, 255, 0.05);
    }
    
    .badge {
      font-size: 0.75em;
    }
  `]
})
export class RackMovementDashboardComponent implements OnInit {
  stats = {
    totalMovements: 156,
    pendingMovements: 12,
    inProgressMovements: 8,
    completedMovements: 136
  };

  activeMovements = [
    {
      id: 'RM001',
      fromRack: 'R001',
      toRack: 'R005',
      itemName: 'Steel Pipes',
      quantity: 25,
      executorName: 'Akshay Raut',
      executorRole: 'Forklift Operator',
      status: 'in_progress',
      priority: 'high',
      createdAt: new Date()
    },
    {
      id: 'RM002',
      fromRack: 'R003',
      toRack: 'R002',
      itemName: 'Electronic Components',
      quantity: 150,
      executorName: 'Sanjay Pawar',
      executorRole: 'Store Keeper',
      status: 'assigned',
      priority: 'medium',
      createdAt: new Date()
    }
  ];

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load dashboard statistics and active movements
  }

  triggerCapacityAlert(): void {
    // Trigger capacity threshold alert
  }

  triggerMaintenance(): void {
    // Trigger maintenance schedule
  }

  triggerTemperatureControl(): void {
    // Trigger temperature control movement
  }

  triggerDemandSpike(): void {
    // Trigger high demand movement
  }

  createMovement(): void {
    // Navigate to movement creation
  }

  generateReport(): void {
    // Generate movement report
  }
} 