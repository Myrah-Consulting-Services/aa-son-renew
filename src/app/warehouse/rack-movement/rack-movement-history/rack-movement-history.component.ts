import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-rack-movement-history',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-clock-history text-primary me-2"></i>
            Movement History
          </h2>
          <p class="text-muted mb-0">Complete audit trail of all rack movements</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" (click)="refreshData()">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
          <button class="btn btn-outline-primary" (click)="exportHistory()">
            <i class="bi bi-download me-1"></i>
            Export History
          </button>
        </div>
      </div>

      <!-- Statistics -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body text-center">
              <h4 class="text-primary mb-1">{{ stats.totalMovements }}</h4>
              <p class="text-muted mb-0">Total Movements</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body text-center">
              <h4 class="text-success mb-1">{{ stats.completedMovements }}</h4>
              <p class="text-muted mb-0">Completed</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body text-center">
              <h4 class="text-info mb-1">{{ stats.avgDuration }}</h4>
              <p class="text-muted mb-0">Avg Duration (min)</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body text-center">
              <h4 class="text-warning mb-1">{{ stats.systemGenerated }}</h4>
              <p class="text-muted mb-0">System Generated</p>
            </div>
          </div>
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
                       placeholder="Search by item, rack, executor...">
              </div>
              <div class="col-md-2">
                <label class="form-label">Movement Type</label>
                <select class="form-select" formControlName="type">
                  <option value="">All Types</option>
                  <option value="manual">Manual</option>
                  <option value="system_generated">System Generated</option>
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
              <div class="col-md-2">
                <label class="form-label">Rack</label>
                <select class="form-select" formControlName="rack">
                  <option value="">All Racks</option>
                  <option value="R001">Rack R001</option>
                  <option value="R002">Rack R002</option>
                  <option value="R003">Rack R003</option>
                </select>
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

      <!-- History Timeline -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0 py-3">
          <h6 class="mb-0 fw-semibold">
            Movement Timeline ({{ history.length }} records)
          </h6>
        </div>
        <div class="card-body">
          <div class="timeline-container">
            <div *ngFor="let record of history" class="timeline-item mb-4">
              <div class="timeline-marker" 
                   [class.bg-primary]="record.type === 'manual'"
                   [class.bg-info]="record.type === 'system_generated'"></div>
              <div class="timeline-content">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <h6 class="mb-1">
                            Movement #{{ record.id }}
                            <span class="badge bg-light text-dark ms-2">{{ record.type | titlecase }}</span>
                          </h6>
                          <small class="text-muted">{{ record.completedAt | date:'medium' }}</small>
                        </div>
                        
                        <div class="row">
                          <div class="col-md-6">
                            <p class="mb-1">
                              <strong>Movement:</strong> 
                              <span class="badge bg-light text-dark me-1">{{ record.fromRack }}</span>
                              <i class="bi bi-arrow-right"></i>
                              <span class="badge bg-light text-dark ms-1">{{ record.toRack }}</span>
                            </p>
                            <p class="mb-1"><strong>Item:</strong> {{ record.itemName }} ({{ record.quantity }} units)</p>
                            <p class="mb-1"><strong>Reason:</strong> {{ record.reason }}</p>
                          </div>
                          <div class="col-md-6">
                            <p class="mb-1"><strong>Initiator:</strong> {{ record.initiatorName }}</p>
                            <p class="mb-1"><strong>Executor:</strong> {{ record.executorName }}</p>
                            <p class="mb-1"><strong>Duration:</strong> {{ record.actualDuration }} minutes</p>
                          </div>
                        </div>

                        <div *ngIf="record.notes" class="mt-2">
                          <small class="text-muted">
                            <strong>Notes:</strong> {{ record.notes }}
                          </small>
                        </div>
                      </div>
                      <div class="col-md-4 text-end">
                        <div class="d-flex flex-column gap-2">
                          <span class="badge bg-success">Completed</span>
                          <span class="badge" 
                                [class.bg-light]="record.priority === 'low'"
                                [class.bg-warning]="record.priority === 'medium'"
                                [class.bg-danger]="record.priority === 'high'">
                            {{ record.priority | titlecase }} Priority
                          </span>
                          <button class="btn btn-sm btn-outline-primary" (click)="viewDetails(record)">
                            <i class="bi bi-eye me-1"></i>
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="history.length === 0" class="text-center py-5">
            <i class="bi bi-clock-history fs-1 text-muted"></i>
            <h5 class="text-muted mt-2">No movement history found</h5>
            <p class="text-muted">Movement history will appear here once movements are completed.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      position: relative;
      padding-left: 2rem;
    }
    
    .timeline-item {
      position: relative;
      
      &:not(:last-child)::before {
        content: '';
        position: absolute;
        left: -1.5rem;
        top: 2rem;
        width: 2px;
        height: calc(100% - 1rem);
        background-color: #dee2e6;
      }
    }
    
    .timeline-marker {
      position: absolute;
      left: -1.75rem;
      top: 0.5rem;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 0 0 2px #dee2e6;
    }
    
    .timeline-content {
      margin-left: 1rem;
    }
    
    .card:hover {
      transform: translateY(-2px);
      transition: all 0.2s ease;
    }
    
    .badge {
      font-size: 0.75em;
    }
  `]
})
export class RackMovementHistoryComponent implements OnInit {
  filterForm: FormGroup;
  
  stats = {
    totalMovements: 156,
    completedMovements: 136,
    avgDuration: 42,
    systemGenerated: 89
  };

  history: any[] = [
    {
      id: 'RM156',
      type: 'manual',
      completedAt: new Date(),
      fromRack: 'R001-A1',
      toRack: 'R005-C1',
      itemName: 'Steel Pipes',
      quantity: 25,
      reason: 'Space Optimization',
      initiatorName: 'Prajakta Kamble',
      executorName: 'Akshay Raut',
      actualDuration: 38,
      priority: 'medium',
      notes: 'Moved to accommodate new shipment'
    },
    {
      id: 'RM155',
      type: 'system_generated',
      completedAt: new Date(Date.now() - 86400000),
      fromRack: 'R003-B1',
      toRack: 'R004-B2',
      itemName: 'Electronic Components',
      quantity: 150,
      reason: 'Temperature Control',
      initiatorName: 'System',
      executorName: 'Sanjay Pawar',
      actualDuration: 52,
      priority: 'high',
      notes: 'Temperature sensor detected overheating'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private api: Api
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      fromDate: [''],
      toDate: [''],
      rack: ['']
    });
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    // Load movement history from API
  }

  applyFilters(): void {
    // Apply filters to history
  }

  refreshData(): void {
    this.loadHistory();
  }

  exportHistory(): void {
    // Export history data
  }

  viewDetails(record: any): void {
    // View detailed movement information
  }
} 