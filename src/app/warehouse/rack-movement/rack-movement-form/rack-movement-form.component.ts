import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RackMovementService } from '../services/rack-movement.service';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-rack-movement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">
            <i class="bi bi-arrow-left-right text-primary me-2"></i>
            Create Rack Movement
          </h2>
          <p class="text-muted mb-0">Move materials between warehouse racks</p>
        </div>
        <button class="btn btn-outline-secondary" (click)="goBack()">
          <i class="bi bi-arrow-left me-1"></i>
          Back to List
        </button>
      </div>

      <!-- Form -->
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <form [formGroup]="movementForm" (ngSubmit)="onSubmit()">
            
            <!-- Movement Details -->
            <div class="row mb-4">
              <div class="col-md-6">
                <h6 class="fw-bold mb-3">Movement Details</h6>
                
                <div class="mb-3">
                  <label class="form-label">From Rack *</label>
                  <select class="form-select" formControlName="fromRackId">
                    <option value="">Select Source Rack</option>
                    <option *ngFor="let rack of racks" [value]="rack.id">
                      {{ rack.code }} - {{ rack.name }} ({{ rack.zone }})
                      - Available: {{ rack.capacity - rack.currentLoad }}
                    </option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">To Rack *</label>
                  <select class="form-select" formControlName="toRackId">
                    <option value="">Select Destination Rack</option>
                    <option *ngFor="let rack of racks" [value]="rack.id">
                      {{ rack.code }} - {{ rack.name }} ({{ rack.zone }})
                      - Available: {{ rack.capacity - rack.currentLoad }}
                    </option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Item *</label>
                  <select class="form-select" formControlName="itemId">
                    <option value="">Select Item</option>
                    <option *ngFor="let item of items" [value]="item.id">
                      {{ item.name }} - {{ item.code }}
                    </option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Quantity *</label>
                  <input type="number" class="form-control" formControlName="quantity" 
                         min="1" placeholder="Enter quantity">
                </div>
              </div>

              <div class="col-md-6">
                <h6 class="fw-bold mb-3">Assignment & Scheduling</h6>

                <div class="mb-3">
                  <label class="form-label">Priority *</label>
                  <select class="form-select" formControlName="priority">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Reason *</label>
                  <select class="form-select" formControlName="reason">
                    <option value="">Select Reason</option>
                    <option value="Space Optimization">Space Optimization</option>
                    <option value="Rack Maintenance">Rack Maintenance</option>
                    <option value="Item Segregation">Item Segregation</option>
                    <option value="Damage Prevention">Damage Prevention</option>
                    <option value="Temperature Control">Temperature Control</option>
                    <option value="Better Accessibility">Better Accessibility</option>
                    <option value="Safety Requirements">Safety Requirements</option>
                    <option value="Inventory Rotation">Inventory Rotation</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Assigned Worker</label>
                  <select class="form-select" formControlName="assignedWorker">
                    <option value="">Auto-assign later</option>
                    <option *ngFor="let worker of availableWorkers" [value]="worker.id">
                      {{ worker.name }} - {{ worker.designation }}
                    </option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Scheduled Date *</label>
                  <input type="datetime-local" class="form-control" formControlName="scheduledDate">
                </div>
              </div>
            </div>

            <!-- Equipment & Notes -->
            <div class="row mb-4">
              <div class="col-md-6">
                <h6 class="fw-bold mb-3">Equipment Requirements</h6>
                
                <div class="mb-3">
                  <label class="form-label">Equipment Type</label>
                  <select class="form-select" formControlName="equipmentType">
                    <option value="Manual Handling">Manual Handling</option>
                    <option value="Pallet Jack">Pallet Jack</option>
                    <option value="Forklift">Forklift</option>
                    <option value="Crane">Crane</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Estimated Duration (minutes)</label>
                  <input type="number" class="form-control" formControlName="estimatedDuration" 
                         min="5" max="480" value="30">
                </div>
              </div>

              <div class="col-md-6">
                <h6 class="fw-bold mb-3">Additional Information</h6>

                <div class="mb-3">
                  <label class="form-label">Urgency Level</label>
                  <select class="form-select" formControlName="urgencyLevel">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div class="mb-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" formControlName="approvalRequired" id="approvalRequired">
                    <label class="form-check-label" for="approvalRequired">
                      Requires Approval
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-4">
              <label class="form-label">Movement Notes</label>
              <textarea class="form-control" formControlName="movementNotes" rows="3" 
                        placeholder="Enter any additional notes about this movement..."></textarea>
            </div>

            <!-- Validation Display -->
            <div class="alert alert-info" *ngIf="validationResults">
              <h6 class="fw-bold mb-2">Movement Validation</h6>
              <div class="row">
                <div class="col-md-3">
                  <span class="badge" [class.bg-success]="validationResults.pathValid" [class.bg-danger]="!validationResults.pathValid">
                    Path Validation
                  </span>
                </div>
                <div class="col-md-3">
                  <span class="badge" [class.bg-success]="validationResults.capacityValid" [class.bg-danger]="!validationResults.capacityValid">
                    Capacity Check
                  </span>
                </div>
                <div class="col-md-3">
                  <span class="badge" [class.bg-success]="validationResults.workerValid" [class.bg-warning]="!validationResults.workerValid">
                    Worker Available
                  </span>
                </div>
                <div class="col-md-3">
                  <span class="badge" [class.bg-success]="validationResults.equipmentValid" [class.bg-danger]="!validationResults.equipmentValid">
                    Equipment Ready
                  </span>
                </div>
              </div>
            </div>

            <!-- Submit Buttons -->
            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-outline-secondary" (click)="goBack()">
                <i class="bi bi-x me-1"></i>
                Cancel
              </button>
              <button type="button" class="btn btn-outline-primary" (click)="validateMovement()">
                <i class="bi bi-check-circle me-1"></i>
                Validate
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="movementForm.invalid">
                <i class="bi bi-save me-1"></i>
                Create Movement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge {
      font-size: 0.75em;
    }
    
    .form-select:focus,
    .form-control:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }
    
    .alert {
      border: none;
      border-radius: 8px;
    }
  `]
})
export class RackMovementFormComponent implements OnInit {
  movementForm: FormGroup;
  racks: any[] = [];
  items: any[] = [];
  availableWorkers: any[] = [];
  validationResults: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private rackMovementService: RackMovementService,
    private api: Api,
    private toast: ToastService
  ) {
    this.movementForm = this.fb.group({
      fromRackId: ['', Validators.required],
      toRackId: ['', Validators.required],
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      priority: ['medium', Validators.required],
      assignedWorker: [''],
      scheduledDate: [new Date().toISOString().substring(0, 16), Validators.required],
      equipmentType: ['Manual Handling'],
      estimatedDuration: [30, [Validators.min(5), Validators.max(480)]],
      urgencyLevel: ['normal'],
      approvalRequired: [false],
      movementNotes: ['']
    });
  }

  ngOnInit(): void {
    this.loadRacks();
    this.loadItems();
    this.loadWorkers();
  }

  loadRacks(): void {
    // Sample rack data - replace with API call
    this.racks = [
      { id: 1, code: 'R001', name: 'Rack A1', zone: 'Zone A', capacity: 100, currentLoad: 50 },
      { id: 2, code: 'R002', name: 'Rack A2', zone: 'Zone A', capacity: 100, currentLoad: 30 },
      { id: 3, code: 'R003', name: 'Rack B1', zone: 'Zone B', capacity: 150, currentLoad: 75 }
    ];
  }

  loadItems(): void {
    // Sample item data - replace with API call
    this.items = [
      { id: 1, name: 'Steel Pipes', code: 'SP001' },
      { id: 2, name: 'Electronic Components', code: 'EC001' },
      { id: 3, name: 'Building Materials', code: 'BM001' }
    ];
  }

  loadWorkers(): void {
    // Sample worker data - replace with API call
    this.availableWorkers = [
      { id: 1, name: 'Akshay Raut', designation: 'Forklift Operator' },
      { id: 2, name: 'Sanjay Pawar', designation: 'Store Keeper' },
      { id: 3, name: 'Amit Verma', designation: 'Material Handler' }
    ];
  }

  validateMovement(): void {
    const formData = this.movementForm.value;
    
    // Mock validation - replace with actual service call
    this.validationResults = {
      pathValid: formData.fromRackId !== formData.toRackId,
      capacityValid: true, // Check if destination rack has capacity
      workerValid: formData.assignedWorker || this.availableWorkers.length > 0,
      equipmentValid: true // Check equipment availability
    };

    if (this.validationResults.pathValid && this.validationResults.capacityValid) {
      this.toast.show('Validation', 'Movement validated successfully', 'success');
    } else {
      this.toast.show('Validation', 'Movement validation failed', 'warning');
    }
  }

  onSubmit(): void {
    if (this.movementForm.valid) {
      const movementData = {
        ...this.movementForm.value,
        initiationType: 'manual',
        initiatedBy: 'current_user_id', // Replace with actual user ID
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      this.rackMovementService.createMovement(movementData).subscribe({
        next: (response) => {
          this.toast.show('Success', 'Rack movement created successfully', 'success');
          this.router.navigate(['/warehouse/rack-movements/list']);
        },
        error: (error) => {
          this.toast.show('Error', 'Failed to create movement', 'danger');
        }
      });
    } else {
      this.movementForm.markAllAsTouched();
      this.toast.show('Error', 'Please fill all required fields', 'warning');
    }
  }

  goBack(): void {
    this.router.navigate(['/warehouse/rack-movements/list']);
  }
} 