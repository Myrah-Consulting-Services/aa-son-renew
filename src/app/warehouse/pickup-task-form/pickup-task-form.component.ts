import { Component, OnInit, Input, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pickup-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid p-2">
      <div class="row mb-2">
        <div class="col">
          <h5 class="mb-1">
            <i class="bi bi-box-arrow-down text-success me-2"></i>
            {{ isEditMode ? 'Edit' : 'Create' }} Pickup Task
          </h5>
          <small class="text-muted">Create pickup task for moving items from rack to dispatch area</small>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="row g-2">
          <!-- Order Information -->
          <div class="col-md-6">
            <div class="card border-0 shadow-sm mb-2">
              <div class="card-header bg-success text-white py-2">
                <h6 class="mb-0">
                  <i class="bi bi-clipboard-check me-2"></i>
                  Order Information
                </h6>
              </div>
              <div class="card-body p-2">
                <!-- Order Type -->
                <div class="mb-2">
                  <label class="form-label fw-semibold small">Order Type *</label>
                  <select class="form-select form-select-sm" formControlName="orderType" (change)="onOrderTypeChange()">
                    <option value="">Select order type</option>
                    <option value="sales_order">Sales Order</option>
                    <option value="requisition">Internal Requisition</option>
                    <option value="transfer">Transfer Order</option>
                  </select>
                </div>

                <!-- Order Reference -->
                <div class="mb-2">
                  <label class="form-label fw-semibold small">Order Reference *</label>
                  <select class="form-select form-select-sm" formControlName="orderReference" (change)="onOrderReferenceChange()">
                    <option value="">Select order reference</option>
                    <option *ngFor="let order of availableOrderReferences" [value]="order.id">
                      {{ getOrderReferenceDisplay(order) }}
                    </option>
                  </select>
                </div>

                <!-- Priority -->
                <div class="mb-0">
                  <label class="form-label fw-semibold small">Priority *</label>
                  <select class="form-select form-select-sm" formControlName="priority">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Pickup Information -->
          <div class="col-md-6">
            <div class="card border-0 shadow-sm mb-2">
              <div class="card-header bg-primary text-white py-2">
                <h6 class="mb-0">
                  <i class="bi bi-geo-alt me-2"></i>
                  Pickup Information
                </h6>
              </div>
              <div class="card-body p-2">
                <!-- Dispatch Area -->
                <div class="mb-2">
                  <label class="form-label fw-semibold small">Dispatch Area *</label>
                  <select class="form-select form-select-sm" formControlName="dispatchArea">
                    <option value="">Select dispatch area</option>
                    <option value="Loading Bay A - Dispatch">Loading Bay A - Dispatch</option>
                    <option value="Loading Bay B - Dispatch">Loading Bay B - Dispatch</option>
                    <option value="Dock A">Dock A</option>
                    <option value="Dock B">Dock B</option>
                  </select>
                </div>

                <!-- Worker Assignment -->
                <div class="mb-2">
                  <label class="form-label fw-semibold small">Primary Picker *</label>
                  <select class="form-select form-select-sm" formControlName="primaryPicker">
                    <option value="">Auto-assign</option>
                    <option value="Akshay Raut">Akshay Raut (Forklift Operator)</option>
                    <option value="Priya Sharma">Priya Sharma (General Picker)</option>
                    <option value="Vikram Singh">Vikram Singh (Fragile Handler)</option>
                  </select>
                </div>

                <!-- Estimated Time -->
                <div class="mb-2">
                  <label class="form-label fw-semibold small">Estimated Time (minutes)</label>
                  <input 
                    type="number" 
                    class="form-control form-control-sm" 
                    formControlName="estimatedTime"
                    min="5">
                </div>

                <!-- Special Handling -->
                <div class="mb-0">
                  <label class="form-label fw-semibold small">Special Requirements</label>
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="checkbox" formControlName="requiresFragileHandling">
                    <label class="form-check-label small">Fragile Handling</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="checkbox" formControlName="requiresTemperatureControl">
                    <label class="form-check-label small">Temperature Control</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items to Pickup -->
        <div class="row">
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-info text-white py-2">
                <div class="d-flex justify-content-between align-items-center">
                  <h6 class="mb-0">Items to Pickup</h6>
                  <button 
                    type="button" 
                    class="btn btn-light btn-sm"
                    (click)="addItem()">
                    <i class="bi bi-plus-circle me-1"></i>
                    Add Item
                  </button>
                </div>
              </div>
              <div class="card-body p-2">
                <div formArrayName="items">
                  <div *ngFor="let item of items.controls; let i = index" [formGroupName]="i" class="border rounded p-2 mb-2">
                    <div class="row g-2 align-items-end">
                      <div class="col-md-4">
                        <label class="form-label small">Item Name *</label>
                        <input 
                          type="text" 
                          class="form-control form-control-sm" 
                          formControlName="itemName">
                      </div>
                      <div class="col-md-2">
                        <label class="form-label small">Quantity *</label>
                        <input 
                          type="number" 
                          class="form-control form-control-sm" 
                          formControlName="quantity"
                          min="1">
                      </div>
                      <div class="col-md-2">
                        <label class="form-label small">Unit</label>
                        <select class="form-select form-select-sm" formControlName="unit">
                          <option value="PCS">PCS</option>
                          <option value="KG">KG</option>
                          <option value="BOXES">BOXES</option>
                          <option value="SETS">SETS</option>
                          <option value="BOTTLES">BOTTLES</option>
                          <option value="ROLLS">ROLLS</option>
                          <option value="PAIRS">PAIRS</option>
                          <option value="KITS">KITS</option>
                          <option value="SHEETS">SHEETS</option>
                          <option value="METERS">METERS</option>
                        </select>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label small">Source Rack *</label>
                        <select class="form-select form-select-sm" formControlName="sourceRack">
                          <option value="">Select rack</option>
                          <option value="Rack R001-A1">Rack R001-A1</option>
                          <option value="Rack R002-B2">Rack R002-B2</option>
                          <option value="Rack FR-001">Rack FR-001 (Fragile)</option>
                          <option value="Rack TC-001">Rack TC-001 (Temperature)</option>
                        </select>
                      </div>
                      <div class="col-md-1">
                        <button 
                          type="button" 
                          class="btn btn-outline-danger btn-sm"
                          (click)="removeItem(i)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div *ngIf="items.length === 0" class="text-center py-2 text-muted">
                  <i class="bi bi-inbox fs-3 d-block mb-1"></i>
                  <small>No items added yet. Select an order reference or click "Add Item" to start.</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="row mt-2">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">
                  Pickup task will be created and assigned to selected workers
              </small>
              <div class="btn-group">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary btn-sm"
                  (click)="cancel()">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="btn btn-success btn-sm"
                  [disabled]="!form.valid || items.length === 0">
                  {{ isEditMode ? 'Update' : 'Create' }} Pickup Task
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .card-header {
      border-bottom: 2px solid rgba(255,255,255,0.1);
    }
  `]
})
export class PickupTaskFormComponent implements OnInit {
  form: FormGroup;
  @Input() taskId: number | null = null;
  isEditMode = false;
  requisition: any;
  availableOrderReferences: any[] = [];

  // Hardcoded order items data - using string keys that match API response
  private orderItemsData: { [key: string]: any[] } = {
    // Sales Orders
    'INV-001': [
      {
        itemName: 'IRONTABLE 124X45 FSUH',
        quantity: 5,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      },
      {
        itemName: 'LINEN RACK BUBBLES',
        quantity: 10,
        unit: 'PCS',
        sourceRack: 'Rack R002-B2'
      },
      {
        itemName: 'Bucket With Lid 11L Pet',
        quantity: 20,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      }
    ],
    'INV-002': [
      {
        itemName: 'CTSTZ18B 18 PCS TEA&CAWA',
        quantity: 15,
        unit: 'SETS',
        sourceRack: 'Rack R001-A1'
      },
      {
        itemName: 'STAINLESS STEEL SINK 60X45',
        quantity: 8,
        unit: 'PCS',
        sourceRack: 'Rack R002-B2'
      },
      {
        itemName: 'GAS BURNER 4 RINGS',
        quantity: 12,
        unit: 'PCS',
        sourceRack: 'Rack TC-001'
      },
      {
        itemName: 'REFRIGERATOR 135L SINGLE DOOR',
        quantity: 6,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      }
    ],
    'INV-003': [
      {
        itemName: 'DISHWASHER 12 PLACE SETTING',
        quantity: 4,
        unit: 'PCS',
        sourceRack: 'Rack FR-001'
      },
      {
        itemName: 'MICROWAVE OVEN 20L',
        quantity: 8,
        unit: 'PCS',
        sourceRack: 'Rack R002-B2'
      },
      {
        itemName: 'WASHING MACHINE 7KG',
        quantity: 5,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      }
    ],
    
    // Requisitions
    'REQ-001': [
      {
        itemName: 'CLEANING CLOTH MICROFIBER',
        quantity: 50,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      },
      {
        itemName: 'DISHWASHING LIQUID 500ML',
        quantity: 30,
        unit: 'BOTTLES',
        sourceRack: 'Rack R002-B2'
      },
      {
        itemName: 'TRASH BAGS 30L',
        quantity: 100,
        unit: 'ROLLS',
        sourceRack: 'Rack R001-A1'
      }
    ],
    'REQ-002': [
      {
        itemName: 'SAFETY GLOVES LARGE',
        quantity: 25,
        unit: 'PAIRS',
        sourceRack: 'Rack R001-A1'
      },
      {
        itemName: 'SAFETY HELMET YELLOW',
        quantity: 15,
        unit: 'PCS',
        sourceRack: 'Rack R002-B2'
      },
      {
        itemName: 'FIRST AID KIT COMPLETE',
        quantity: 8,
        unit: 'KITS',
        sourceRack: 'Rack TC-001'
      },
      {
        itemName: 'FIRE EXTINGUISHER 2KG',
        quantity: 6,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      }
    ],
    'REQ-003': [
      {
        itemName: 'SCREWDRIVER SET 6 PCS',
        quantity: 10,
        unit: 'SETS',
        sourceRack: 'Rack R001-A1'
      },
      {
        itemName: 'WRENCH SET METRIC',
        quantity: 8,
        unit: 'SETS',
        sourceRack: 'Rack R002-B2'
      },
      {
        itemName: 'HAMMER 500G',
        quantity: 12,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      }
    ],
    
    // Transfer Orders
    'TRF-001': [
      {
        itemName: 'STAINLESS STEEL SHEET 2MM',
        quantity: 100,
        unit: 'SHEETS',
        sourceRack: 'Rack R001-A1'
      },
      {
        itemName: 'ALUMINUM TUBE 25MM',
        quantity: 50,
        unit: 'PCS',
        sourceRack: 'Rack R002-B2'
      },
      {
        itemName: 'COPPER WIRE 2.5MM',
        quantity: 200,
        unit: 'METERS',
        sourceRack: 'Rack R001-A1'
      }
    ],
    'TRF-002': [
      {
        itemName: 'FINISHED KITCHEN CABINET',
        quantity: 20,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      },
      {
        itemName: 'COMPLETE DINING SET 6 SEATER',
        quantity: 8,
        unit: 'SETS',
        sourceRack: 'Rack R002-B2'
      },
      {
        itemName: 'PACKAGING BOX LARGE',
        quantity: 150,
        unit: 'PCS',
        sourceRack: 'Rack TC-001'
      },
      {
        itemName: 'BUBBLE WRAP ROLL',
        quantity: 25,
        unit: 'ROLLS',
        sourceRack: 'Rack R001-A1'
      }
    ],
    'TRF-003': [
      {
        itemName: 'MOTOR 1HP SINGLE PHASE',
        quantity: 8,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      },
      {
        itemName: 'BEARING 6205ZZ',
        quantity: 100,
        unit: 'PCS',
        sourceRack: 'Rack R002-B2'
      },
      {
        itemName: 'BELT V-BELT A-50',
        quantity: 30,
        unit: 'PCS',
        sourceRack: 'Rack R001-A1'
      }
    ]
  };

  // Hardcoded data for different order types
  private salesOrders = [
    {
      id: 'INV-001',
      invoiceNo: 'INV-001',
      customerName: 'ABC Electronics Ltd',
      date: '2025-01-15',
      status: 'pending'
    },
    {
      id: 'INV-002', 
      invoiceNo: 'INV-002',
      customerName: 'XYZ Manufacturing Co',
      date: '2025-01-16',
      status: 'pending'
    },
    {
      id: 'INV-003',
      invoiceNo: 'INV-003', 
      customerName: 'DEF Trading Company',
      date: '2025-01-17',
      status: 'pending'
    }
  ];

  private requisitions = [
    {
      id: 'REQ-001',
      requisitionNo: 'REQ-2025-0657',
      department: 'Administration',
      date: '2025-01-15',
      status: 'approved'
    },
    {
      id: 'REQ-002',
      requisitionNo: 'REQ-2025-0658',
      department: 'Safety Department',
      date: '2025-01-16',
      status: 'approved'
    },
    {
      id: 'REQ-003',
      requisitionNo: 'REQ-2025-0659',
      department: 'Maintenance',
      date: '2025-01-17',
      status: 'approved'
    }
  ];

  private transferOrders = [
    {
      id: 'TRF-001',
      transferNo: 'TRF-001',
      fromWarehouse: 'Warehouse A',
      toWarehouse: 'Warehouse B',
      date: '2025-01-15',
      status: 'pending'
    },
    {
      id: 'TRF-002',
      transferNo: 'TRF-002',
      fromWarehouse: 'Warehouse B',
      toWarehouse: 'Warehouse C',
      date: '2025-01-16',
      status: 'pending'
    },
    {
      id: 'TRF-003',
      transferNo: 'TRF-003',
      fromWarehouse: 'Warehouse C',
      toWarehouse: 'Warehouse A',
      date: '2025-01-17',
      status: 'pending'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    private router: Router,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.form = this.fb.group({
      orderType: ['', Validators.required],
      orderReference: ['', Validators.required],
      priority: ['normal', Validators.required],
      dispatchArea: ['', Validators.required],
      primaryPicker: [''],
      estimatedTime: [60],
      requiresFragileHandling: [false],
      requiresTemperatureControl: [false],
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.taskId;
    this.getRequisition();
    if (!this.isEditMode) {
      this.addItem();
    }
    
    // Debug: Log available order data
    console.log('Available order data:', this.orderItemsData);
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      itemName: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: ['PCS', Validators.required],
      sourceRack: ['', Validators.required]
    });
    
    this.items.push(itemGroup);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onOrderReferenceChange(): void {
    console.log('onOrderReferenceChange called');
    const orderReference = this.form.get('orderReference')?.value;
    console.log('Selected order reference:', orderReference);
    
    if (orderReference) {
      console.log('Clearing existing items...');
      // Clear existing items
      while (this.items.length !== 0) {
        this.items.removeAt(0);
      }
      
      // Get items for the selected order reference
      let orderItems = this.orderItemsData[orderReference] || [];
      
      // If not found by direct key, try to map from API data
      if (orderItems.length === 0) {
        orderItems = this.getItemsForOrderReference(orderReference);
      }
      
      console.log('Found order items:', orderItems);
      
      if (orderItems.length > 0) {
        console.log('Adding items to form...');
        // Add items from the order
        orderItems.forEach((item, index) => {
          console.log(`Adding item ${index + 1}:`, item);
          const itemGroup = this.fb.group({
            itemName: [item.itemName, Validators.required],
            quantity: [item.quantity, [Validators.required, Validators.min(1)]],
            unit: [item.unit, Validators.required],
            sourceRack: [item.sourceRack, Validators.required]
          });
          
          this.items.push(itemGroup);
        });
        
        console.log('Total items in form after adding:', this.items.length);
        this.toast.show('Success', `${orderItems.length} items loaded from order reference`, 'success');
      } else {
        console.log('No items found for this order reference');
        this.toast.show('Info', 'No items found for this order reference', 'info');
        // Add one empty item if no items found
        this.addItem();
      }
    } else {
      console.log('No order reference selected, clearing items');
      // Clear items if no order reference selected
      while (this.items.length !== 0) {
        this.items.removeAt(0);
      }
      this.addItem();
    }
  }

  // Method to map API order references to hardcoded data
  getItemsForOrderReference(orderRef: string): any[] {
    console.log('Mapping order reference:', orderRef);
    
    // Direct mapping since we have hardcoded data with matching keys
    const orderItems = this.orderItemsData[orderRef] || [];
    
    if (orderItems.length > 0) {
      console.log('Found items for order reference:', orderRef);
      return orderItems;
    }
    
    console.log('No items found for order reference:', orderRef);
    return [];
  }

  save(): void {
    if (!this.form.valid || this.items.length === 0) {
      this.toast.show('Error', 'Please fill all required fields and add items', 'danger');
      return;
    }

    const taskData = {
      ...this.form.value,
      status: 'pending',
      createdAt: new Date().toISOString(),
      id: `PICK-${Date.now()}`
    };

    console.log('Creating pickup task:', taskData);
    this.toast.show('Success', 'Pickup task created successfully', 'success');
    
    if (this.activeModal) {
      this.activeModal.close(taskData);
    } else {
      this.router.navigate(['/warehouse/outward']);
    }
  }

  cancel(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    } else {
      this.router.navigate(['/warehouse/outward']);
    }
  }
  
  getRequisition(){
    // Initialize with sales orders by default
    this.availableOrderReferences = this.salesOrders;
    console.log('Initial order references loaded:', this.availableOrderReferences);
  }

  // Test method to manually trigger order reference change
  testOrderReference(orderRef: string): void {
    console.log('Testing order reference:', orderRef);
    this.form.patchValue({ orderReference: orderRef });
    this.onOrderReferenceChange();
  }

  // Handle order type change
  onOrderTypeChange(): void {
    const orderType = this.form.get('orderType')?.value;
    console.log('Order type changed to:', orderType);
    
    // Clear current order reference
    this.form.patchValue({ orderReference: '' });
    
    // Update available order references based on order type
    switch (orderType) {
      case 'sales_order':
        this.availableOrderReferences = this.salesOrders;
        break;
      case 'requisition':
        this.availableOrderReferences = this.requisitions;
        break;
      case 'transfer':
        this.availableOrderReferences = this.transferOrders;
        break;
      default:
        this.availableOrderReferences = [];
    }
    
    console.log('Updated available order references:', this.availableOrderReferences);
    
    // Clear items when order type changes
    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }
    this.addItem();
  }

  getOrderReferenceDisplay(order: any): string {
    switch (this.form.get('orderType')?.value) {
      case 'sales_order':
        return order.invoiceNo;
      case 'requisition':
        return order.requisitionNo;
      case 'transfer':
        return order.transferNo;
      default:
        return '';
    }
  }
} 