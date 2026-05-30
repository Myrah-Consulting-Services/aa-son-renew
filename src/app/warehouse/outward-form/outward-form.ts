import { Component, OnInit, Optional, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';
import * as pdfMake from 'pdfmake/build/pdfmake';

@Component({
  selector: 'app-outward-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './outward-form.html',
  styleUrl: './outward-form.scss'
})
export class OutwardForm implements OnInit {
  form: FormGroup | any;
  inwardType: '3' | '4' | '5' = '3';
  
  // Edit mode properties
  @Input() editOutwardId: number | null = null;
  isEditMode = false;
  outwardId: number | null = null;
  originalData: any = null;

  // Preview modal properties
  showPreviewModal = false;

  // Data arrays
  requisitions: any[] = [];
  salesOrders: any[] = [];
  customerSalesOrders: any[] = []; // Customer-specific sales orders
  warehouses: any[] = [];
  locations: any[] = [];
  filteredLocations: any[] = [];
  availableItems: any[] = [];
  employees: any[] = [];
  filteredEmployees: any[] = [];
  customers: any[] = [];
  filteredCustomers: any[] = [];
  
  // Dropdown states
  showRequisitionDropdown = false;
  showSalesOrderDropdown = false;
  showCustomerDropdown = false;
  showEmployeeDropdown = false;
  showItemDropdown: boolean[] = [];
  filteredItems: any[][] = [];
  itemSearchTerms: string[] = [];
  
  // Selected data
  selectedCustomer: any = null;
  selectedRequisitions: any[] = [];
  
  // Workflow properties
  workflowSteps: any[] = [];
  assignedTasks: any[] = [];
  warehouseWorkers: any[] = [];
  dispatchArea: 'LOADING_BAY' | 'DOCK_A' | 'DOCK_B' | 'CUSTOM' = 'LOADING_BAY';
  loadingbayAreas: any[]=[];
  dispatchedByName: string = '';

  constructor(
    private fb: FormBuilder,
    @Optional() public activeModal: NgbActiveModal,
    private api: Api,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if we're in edit mode
    if (this.editOutwardId) {
      this.isEditMode = true;
      this.outwardId = this.editOutwardId;
    }

    this.form = this.fb.group({
      inwardType: ['3', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      
      // Requisition/Sales Order reference
      requisitionId: [''],
      salesOrderId: [''],
      referenceNo: [''],
      
      // Customer/Destination details
      customerId: [''],
      customerName: [''],
      customerAddress: [''],
      customerPhone: [''],
      deliveryAddress: [''],
      
      // Dispatch details
      dispatchNo: [''],
      requiredDate: ['', Validators.required],
      requiredTime: ['', Validators.required],
      priority: ['NORMAL', Validators.required],
      
      // Personnel
      dispatchedBy: ['', Validators.required],
      pickedBy: [''],
      authorizedBy: [''],
      
      // Transport details
      vehicleNo: [''],
      driverName: [''],
      driverPhone: [''],
      transporterName: [''],
      
      // Warehouse details
      sourceWarehouseId: [''],
      sourceLocationId: [''],
      dispatchArea: ['1'],
      customDispatchArea: [''],
      
      // Other details
      remarks: [''],
      specialInstructions: [''],
      
      // Items
      items: this.fb.array([]),
      
      // Totals
      totalQuantity: [0],
      totalAmount: [0],
      
      // Workflow
      // status: [''],
      workflowStep: ['REQUISITION_RECEIVED'],
      
      company: [1, Validators.required],
      // New: Store selected requisitions as array
      poNo: [[]],
      created_by_user:[]
    });
    const user = JSON.parse(localStorage.getItem('user') || '[]');
    if (user[0]?.username) {
      this.form.patchValue({ created_by_user: user[0].username });
    }
    // Watch for outward type changes
    this.form.get('inwardType').valueChanges.subscribe((type: string) => {
      this.inwardType = type as '3' | '4' | '5';
      this.updateFormValidation();
    });

    // Watch for dispatch area changes
    this.form.get('dispatchArea').valueChanges.subscribe((area: string) => {
      this.dispatchArea = area as 'LOADING_BAY' | 'DOCK_A' | 'DOCK_B' | 'CUSTOM';
    });

    this.loadInitialData();
    this.updateFormValidation();
    
    // Load existing data if in edit mode
    if (this.isEditMode && this.outwardId) {
      this.loadOutwardData(this.outwardId);
    } else {
      this.generateDispatchNumber();
      // this.addItem(); // Add one empty item for new records
    }
    this.loadbay()
    // Set dispatchedByName if editing
    const dispatchedById = this.form.get('dispatchedBy')?.value;
    if (dispatchedById) {
      const emp = this.employees.find(e => e.id == dispatchedById);
      this.dispatchedByName = emp ? (emp.name || (emp.firstName + ' ' + (emp.lastName || ''))) : '';
    }
  }
  loadbay(){
    this.api.get('/invoice/list-placement-category/').subscribe((res:any)=>{
      if(res.status==200){
        this.loadingbayAreas=res.data
      }else{
        this.loadingbayAreas=[]
      }
    })
  }
  updateFormValidation(): void {
    // Clear all validators first
    this.form.get('requisitionId')?.clearValidators();
    this.form.get('salesOrderId')?.clearValidators();
    this.form.get('customerId')?.clearValidators();
    this.form.get('customerName')?.clearValidators();

    switch (this.inwardType) {
      case '3':
        this.form.get('requisitionId')?.setValidators([Validators.required]);
        break;
      case '4':
        this.form.get('salesOrderId')?.setValidators([Validators.required]);
        this.form.get('customerId')?.setValidators([Validators.required]);
        break;
      case '5':
        this.form.get('customerName')?.setValidators([Validators.required]);
        break;
    }

    // Update validation
    this.form.get('requisitionId')?.updateValueAndValidity();
    this.form.get('salesOrderId')?.updateValueAndValidity();
    this.form.get('customerId')?.updateValueAndValidity();
    this.form.get('customerName')?.updateValueAndValidity();
  }

  loadInitialData(): void {
    this.loadRequisitions();
    this.loadSalesOrders();
    this.loadWarehouses();
    this.loadLocations();
    this.loadItems();
    this.loadEmployees();
    this.loadCustomers();
    // this.loadWarehouseWorkers();
  }

  loadRequisitions(): void {
      this.api.post(`/invoice/get-requisition-list/`,{"company":1}).subscribe({
        next: (res: any) => {
          if (res && Array.isArray(res.data)) {
            this.requisitions = res.data;
            console.log(this.requisitions);
            
          } else {
            this.requisitions = [];
          }
        },
        error: (error) => {
          this.requisitions = [];
          console.error('Error loading requisitions:', error);
        }
      });
    }

  setDefaultRequisitions(): void {
    this.requisitions = [
      {
        id: 1,
        requisitionNo: 'REQ-2024-001',
        department: 'Showroom A',
        requestor: 'Ahmad Hassan',
        requiredDate: '2024-12-30',
        priority: 'HIGH',
        status: 'APPROVED',
        items: [
          { itemId: 1, itemName: 'Steel Pipes', quantity: 50, unit: 'PCS' },
          { itemId: 2, itemName: 'Plastic Granules', quantity: 100, unit: 'KG' }
        ]
      },
      {
        id: 2,
        requisitionNo: 'REQ-2024-002',
        department: 'Showroom B',
        requestor: 'Fatima Ali',
        requiredDate: '2024-12-31',
        priority: 'NORMAL',
        status: 'APPROVED',
        items: [
          { itemId: 3, itemName: 'Cardboard Boxes', quantity: 200, unit: 'BOX' }
        ]
      }
    ];
  }

  loadSalesOrders(): void {
    // this.api.get('/sales/orders/', { 
    //   company: 1,
    //   status: 'CONFIRMED'
    // }).subscribe({
    //   next: (res: any) => {
    //     if (res.status === 200) {
    //       this.salesOrders = res.data || [];
    //     } else {
    //       this.setDefaultSalesOrders();
    //     }
    //   },
    //   error: (error) => {
    //     console.error('Error loading sales orders:', error);
    //     this.setDefaultSalesOrders();
    //   }
    // });
  }

  setDefaultSalesOrders(): void {
    this.salesOrders = [
      {
        id: 1,
        orderNo: 'SO-2024-001',
        customerName: 'ABC Trading LLC',
        orderDate: '2024-12-25',
        deliveryDate: '2024-12-30',
        amount: 15000,
        items: [
          { itemId: 1, itemName: 'Steel Pipes', quantity: 25, rate: 150 },
          { itemId: 4, itemName: 'Aluminum Sheets', quantity: 10, rate: 300 }
        ]
      }
    ];
  }

  loadWarehouses(): void {
    this.api.get('/warehouses/list-warehouse/').subscribe({
      next: (res: any) => {
        if (res.status == 200 && Array.isArray(res.data)) {
          this.warehouses = res.data;
        } else {
          this.warehouses = [];
        }
      },
      error: (error) => {
        this.warehouses = [];
        console.error('Error loading warehouses:', error);
      }
    });
  }

  loadLocations(): void {
    this.api.post('/warehouses/list-location/', { warehouse:null, company: 1 }).subscribe({
      next: (res: any) => {
        if (res.status == 200 && Array.isArray(res.data)) {
          this.locations = res.data;
          this.filteredLocations = [...this.locations];
        } else {
          this.locations = [];
          this.filteredLocations = [];
        }
      },
      error: (error) => {
        this.locations = [];
        this.filteredLocations = [];
        console.error('Error loading locations:', error);
      }
    });
  }

  // loadItems(): void {
  //   this.api.post('/items/list-item/s=/', { company: 1 }).subscribe({
  //     next: (res: any) => {
  //       if (res.status == 200 && Array.isArray(res.data)) {
  //         this.availableItems = res.data;
  //       } else {
  //         this.availableItems = [];
  //       }
  //     },
  //     error: (error) => {
  //       this.availableItems = [];
  //       console.error('Error loading items:', error);
  //     }
  //   });
  // }

  loadEmployees(): void {
    this.api.get('/employee/list-employees/1').subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.employees = res;
        } else if (res && Array.isArray(res.data)) {
          this.employees = res.data;
        } else {
          this.employees = [];
        }
        this.filteredEmployees = [...this.employees];
      },
      error: (error) => {
        this.employees = [];
        this.filteredEmployees = [];
        console.error('Error loading employees:', error);
        this.setDefaultEmployees();
      }
    });
  }

  setDefaultEmployees(): void {
    this.employees = [
      { id: 1, name: 'Warehouse Manager', designation: 'Manager', department: 'Warehouse' },
      { id: 2, name: 'Dispatch Supervisor', designation: 'Supervisor', department: 'Dispatch' },
      { id: 3, name: 'Picker A', designation: 'Picker', department: 'Warehouse' },
      { id: 4, name: 'Picker B', designation: 'Picker', department: 'Warehouse' },
      { id: 5, name: 'Quality Inspector', designation: 'Inspector', department: 'Quality' }
    ];
    this.filteredEmployees = [...this.employees];
  }

  loadCustomers(): void {
    this.api.post('/party/list-party/s=/', { company: 1, partyType: 1 }).subscribe({
      next: (res: any) => {
        if (res.status === 200 && Array.isArray(res.data)) {
          this.customers = res.data;
          this.filteredCustomers = [...this.customers];
        } else {
          this.customers = [];
          this.filteredCustomers = [];
        }
      },
      error: (error) => {
        this.customers = [];
        this.filteredCustomers = [];
        console.error('Error loading customers:', error);
      }
    });
  }

  // Customer dropdown methods
  onCustomerFocus(): void {
    this.showCustomerDropdown = true;
    this.filteredCustomers = [...this.customers];
  }

  onCustomerInput(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer => 
      customer.partyName?.toLowerCase().includes(searchTerm) ||
      customer.contact?.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm)
    );
    this.showCustomerDropdown = true;
  }

  selectCustomer(customer: any): void {
    this.selectedCustomer = customer;
    this.form.patchValue({
      customerId: customer.id,
      customerName: customer.partyName,
      customerAddress: customer.address || '',
      customerPhone: customer.contact || ''
    });
    this.showCustomerDropdown = false;
    
    // Load customer-specific sales orders
    this.loadCustomerSalesOrders(customer.id);
    
    this.toast.show('Success', `Customer selected: ${customer.partyName}`, 'success');
  }

  onCustomerBlur(): void {
    setTimeout(() => {
      this.showCustomerDropdown = false;
    }, 200);
  }

  // Load customer-wise sales orders
  loadCustomerSalesOrders(customerId: number): void {
    this.api.get(`/invoice/party-wise-sales/${customerId}/1/`).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.customerSalesOrders = res.data || [];
          
          // Clear sales order selection when customer changes
          this.form.patchValue({
            salesOrderId: '',
            referenceNo: ''
          });
          
          if (this.customerSalesOrders.length === 0) {
            this.toast.show('Info', 'No sales orders found for this customer', 'info');
          } else {
            this.toast.show('Success', `${this.customerSalesOrders.length} sales orders loaded`, 'success');
          }
        } else {
          this.customerSalesOrders = [];
          this.toast.show('Warning', 'Failed to load customer sales orders', 'warning');
        }
      },
      error: (error) => {
        console.error('Error loading customer sales orders:', error);
        this.customerSalesOrders = [];
        this.toast.show('Error', 'Failed to load customer sales orders', 'danger');
      }
    });
  }

  loadWarehouseWorkers(): void {
    this.api.get('/warehouse/workers/', { company: 1 }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.warehouseWorkers = res.data || [];
        } else {
          this.setDefaultWorkers();
        }
      },
      error: (error) => {
        console.error('Error loading warehouse workers:', error);
        this.setDefaultWorkers();
      }
    });
  }

  setDefaultWorkers(): void {
    this.warehouseWorkers = [
      { id: 1, name: 'Ahmad Ali', designation: 'Picker', mobile: '+971501234567' },
      { id: 2, name: 'Hassan Omar', designation: 'Forklift Operator', mobile: '+971501234568' },
      { id: 3, name: 'Fatima Said', designation: 'Quality Checker', mobile: '+971501234569' }
    ];
  }

  // Get existing barcode from item data
  getItemBarcode(itemId: any): string {
    const item = this.availableItems.find((i: { id: any; }) => i.id == itemId);
    return item?.barcode1 || item?.item_code || item?.code || '';
  }

  // Items management
  get items(): FormArray {
    return this.form?.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      itemId: ['', Validators.required],
      item_name:['',Validators.required],
      item_code:['',Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      pickedQuantity: [0],
      units: [[]],
      unit: [0, Validators.required],
      rate: [0, [Validators.required, Validators.min(0)]],
      amount: [0, [Validators.required, Validators.min(0)]],
      sourceWarehouseId: [null],
      sourceLocationId: [null],
      remarks: [''],
      barcode: ['']
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
    this.showItemDropdown.push(false);
    this.filteredItems.push([...this.availableItems]);
    this.itemSearchTerms.push('');
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.showItemDropdown.splice(index, 1);
      this.filteredItems.splice(index, 1);
      this.itemSearchTerms.splice(index, 1);
    }
  }

  // Requisition selection and processing
  onRequisitionSelect(event: any): void {
    const requisitionId = parseInt(event.target.value);
    if (!requisitionId) return;
    
    const selectedRequisition = this.requisitions.find(r => r.id === requisitionId);
    if (selectedRequisition) {
      this.form.patchValue({
        referenceNo: selectedRequisition.requisitionNo,
        requiredDate: selectedRequisition.requiredDate,
        priority: selectedRequisition.priority,
        customerName: selectedRequisition.department // Department acts as customer for requisitions
      });

      // Clear existing items and populate from requisition
      this.clearItems();
      selectedRequisition.items.forEach((reqItem: any) => {
        const newItem = this.fb.group({
          itemId: [reqItem.itemId, Validators.required],
          item_name: [reqItem.itemName, Validators.required],
          item_code: [reqItem.item_code || '', Validators.required],
          quantity: [reqItem.quantity, [Validators.required, Validators.min(1)]],
          pickedQuantity: [0],
          units: [reqItem.units || []],
          unit: [reqItem.unit || 0, Validators.required],
          rate: [reqItem.rate || 0, [Validators.required, Validators.min(0)]],
          amount: [reqItem.amount || 0, [Validators.required, Validators.min(0)]],
          sourceWarehouseId: [null],
          sourceLocationId: [null],
          remarks: [''],
          barcode: [reqItem.barcode1 || '']
        });
        
        this.items.push(newItem);
        this.showItemDropdown.push(false);
        this.filteredItems.push([...this.availableItems]);
        this.itemSearchTerms.push(reqItem.itemName);
      });

      this.showRequisitionDropdown = false;
      this.toast.show('Success', 'Requisition items loaded successfully', 'success');
      
      // Auto-generate tasks for this requisition
      this.generatePickingTasks();
    }
  }

  onRequisitionDropdownFocus() {
    this.showRequisitionDropdown = true;
  }
  onRequisitionDropdownBlur() {
    setTimeout(() => this.showRequisitionDropdown = false, 200);
  }

  isRequisitionSelected(id: number): boolean {
    return this.selectedRequisitions.some(req => req.id === id);
  }

  toggleRequisitionSelection(req: any) {
    if (this.isRequisitionSelected(req.id)) {
      this.selectedRequisitions = this.selectedRequisitions.filter(r => r.id !== req.id);
      this.removeRequisitionItemsFromForm(req);
    } else {
      this.selectedRequisitions.push(req);
      this.addRequisitionItemsToForm(req);
    }
    // Sync with form
    this.form.patchValue({ poNo: this.selectedRequisitions.map(r => r.id) });
  }

  removeRequisition(id: number) {
    this.selectedRequisitions = this.selectedRequisitions.filter(r => r.id !== id);
    // Remove items from form if needed (existing logic)
    this.removeRequisitionItemsFromForm({ id: id, item_info: [] }); // Assuming item_info is not directly available here, pass an empty array for now
    // Sync with form
    this.form.patchValue({ poNo: this.selectedRequisitions.map(r => r.id) });
  }

  addRequisitionItemsToForm(req: any) {
    if (Array.isArray(req.item_info)) {
      req.item_info.forEach((item: any) => {
        // Use your existing createItem() or similar logic if possible
        const newItem = this.fb.group({
          itemId: [item.itemId, Validators.required],
          item_name: [item.item_name, Validators.required],
          item_code: [item.item_code || '', Validators.required],
          quantity: [item.quantity, [Validators.required, Validators.min(1)]],
          pickedQuantity: [0],
          units: [item.units || []],
          unit: [item.unit || 0, Validators.required],
          rate: [item.rate || 0, [Validators.required, Validators.min(0)]],
          amount: [item.amount || 0, [Validators.required, Validators.min(0)]],
          sourceWarehouseId: [null],
          sourceLocationId: [null],
          remarks: [''],
          barcode: [item.barcode || '']
        });
        this.items.push(newItem);
        this.showItemDropdown.push(false);
        this.filteredItems.push([...this.availableItems]);
        this.itemSearchTerms.push(item.item_name || '');
      });
    }
  }

  removeRequisitionItemsFromForm(req: any) {
    if (Array.isArray(req.item_info)) {
      req.item_info.forEach((item: any) => {
        const idx = this.items.controls.findIndex(ctrl => ctrl.value.itemId === item.itemId);
        if (idx > -1) {
          this.items.removeAt(idx);
          this.showItemDropdown.splice(idx, 1);
          this.filteredItems.splice(idx, 1);
          this.itemSearchTerms.splice(idx, 1);
        }
      });
    }
  }

  // Sales Order selection and processing
  onSalesOrderSelect(event: any): void {
    const salesOrderId = parseInt(event.target.value);
    if (!salesOrderId) return;
    
    // Use customer-specific sales orders for Sales Order dispatch type
    const salesOrdersList = this.inwardType === '4' ? this.customerSalesOrders : this.salesOrders;
    const selectedOrder = salesOrdersList.find(so => so.id === salesOrderId);
    
    if (selectedOrder) {
      this.form.patchValue({
        referenceNo: selectedOrder.invoice_no || selectedOrder.orderNo,
        requiredDate: selectedOrder.delivery_date || selectedOrder.deliveryDate,
        priority: selectedOrder.priority || 'NORMAL',
        // Don't override customer details if already selected for customer-specific orders
        ...(this.inwardType !== '4' && {
          customerName: selectedOrder.customerName || selectedOrder.customer_name,
          customerId: selectedOrder.customerId || selectedOrder.customer_id
        })
      });

      // Clear existing items and populate from sales order
      this.clearItems();
      if (selectedOrder.items && selectedOrder.items.length > 0) {
        selectedOrder.items.forEach((orderItem: any) => {
          const newItem = this.fb.group({
            itemId: [orderItem.item_info?.id || orderItem.itemId, Validators.required],
            item_name: [orderItem.item_info?.name || orderItem.itemName, Validators.required],
            item_code: [orderItem.item_info?.item_code || orderItem.item_info?.item_code || orderItem.item_info?.item_code || '', Validators.required],
            quantity: [orderItem.quantity, [Validators.required, Validators.min(1)]],
            pickedQuantity: [0],
            units: [orderItem.item_info?.units || orderItem.units || []],
            unit: [orderItem.unit || 0, Validators.required],
            rate: [orderItem.rate || 0, [Validators.required, Validators.min(0)]],
            amount: [orderItem.total_amt || orderItem.amount || (orderItem.quantity * orderItem.rate), [Validators.required, Validators.min(0)]],
            sourceWarehouseId: [null],
            sourceLocationId: [null],
            remarks: [''],
            barcode: [orderItem.item_info?.barcode1 || orderItem.item_info?.barcode1 || orderItem.item_info?.barcode1 || '']
          });
          
          this.items.push(newItem);
          this.showItemDropdown.push(false);
          this.filteredItems.push([...this.availableItems]);
          this.itemSearchTerms.push(orderItem.item_info?.name || orderItem.itemName);
        });
      }

      this.showSalesOrderDropdown = false;
      this.toast.show('Success', 'Sales order items loaded successfully', 'success');
      
      // Auto-generate tasks for this sales order
      this.generatePickingTasks();
    }
  }

  clearItems(): void {
    while (this.items.length > 0) {
      this.items.removeAt(0);
    }
    this.showItemDropdown = [];
    this.filteredItems = [];
    this.itemSearchTerms = [];
  }

  // Generate dispatch number
  generateDispatchNumber(): void {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    const dispatchNumber = `DISP-${year}${month}${day}-${timestamp}`;
    
    this.form.patchValue({
      dispatchNo: dispatchNumber
    });
  }

  // Method to generate picking tasks for requisition-based workflow
  generatePickingTasks(): void {
    this.items.controls.forEach((control: AbstractControl, index: number) => {
      const item = control as FormGroup;
      const pickingTask = {
        id: Date.now() + index,
        dispatchRef: this.form.get('dispatchNo')?.value,
        requisitionRef: this.form.get('referenceNo')?.value,
        itemId: item.get('itemId')?.value,
        itemName: this.itemSearchTerms[index],
        quantity: item.get('quantity')?.value,
        pickedQuantity: 0,
        sourceLocation: item.get('sourceLocationId')?.value || 'Rack Storage',
        targetLocation: this.getDispatchLocationName(),
        status: 'PENDING_ASSIGNMENT',
        priority: this.form.get('priority')?.value,
        createdAt: new Date().toISOString(),
        requiredDateTime: this.getRequiredDateTime(),
        assignedWorker: null,
        estimatedTime: this.calculatePickingTime(item.get('quantity')?.value)
      };
      
      // Add to workflow steps
      this.workflowSteps.push({
        id: Date.now() + index + 1000,
        name: `Pick & Transport: ${this.itemSearchTerms[index]}`,
        status: 'pending',
        assignee: null,
        estimatedTime: pickingTask.estimatedTime,
        description: `Pick ${item.get('quantity')?.value} units and transport to ${this.getDispatchLocationName()}`,
        taskType: 'picking',
        taskData: pickingTask
      });
    });
  }

  // Calculate picking time based on quantity
  calculatePickingTime(quantity: number): number {
    return Math.max(15, quantity * 2 + 10); // 2 minutes per unit + 10 minutes transport
  }

  // Get required date and time
  getRequiredDateTime(): string {
    const date = this.form.get('requiredDate')?.value;
    const time = this.form.get('requiredTime')?.value;
    return date && time ? `${date}T${time}:00` : new Date().toISOString();
  }

  // Get dispatch location display name
  getDispatchLocationName(): string {
    const area = this.form.get('dispatchArea')?.value;
    const custom = this.form.get('customDispatchArea')?.value;
    
    if (area === 'CUSTOM' && custom) return custom;
    
    const locations = {
      'LOADING_BAY': 'Loading Bay',
      'DOCK_A': 'Dock A', 
      'DOCK_B': 'Dock B'
    };
    return locations[area as keyof typeof locations] || 'Loading Bay';
  }

  // Auto-assign tasks to available workers
  autoAssignTasks(): void {
    const availableWorkers = this.warehouseWorkers.filter(worker => 
      worker.designation.toLowerCase().includes('picker') || 
      worker.designation.toLowerCase().includes('handler')
    );

    if (availableWorkers.length === 0) {
      this.toast.show('Warning', 'No available workers for task assignment', 'warning');
      return;
    }

    let assignedCount = 0;
    this.workflowSteps.forEach((step, index) => {
      if (step.taskType === 'picking' && step.status === 'pending') {
        const workerIndex = index % availableWorkers.length;
        const assignedWorker = availableWorkers[workerIndex];
        
        step.assignee = assignedWorker.name;
        step.status = 'assigned';
        step.taskData.assignedWorker = assignedWorker.id;
        step.taskData.assignedAt = new Date().toISOString();
        step.taskData.status = 'ASSIGNED';
        
        assignedCount++;
      }
    });

    if (assignedCount > 0) {
      this.toast.show('Success', `${assignedCount} tasks assigned to warehouse workers`, 'success');
    }
  }

  // Mark task as completed by worker
  completeTask(taskId: number, pickedQuantity: number, notes: string = ''): void {
    const task = this.workflowSteps.find(step => step.id === taskId);
    if (task && task.taskType === 'picking') {
      task.status = 'completed';
      task.taskData.pickedQuantity = pickedQuantity;
      task.taskData.pickingNotes = notes;
      task.taskData.pickedAt = new Date().toISOString();
      task.taskData.status = 'COMPLETED';
      
      // Update the form item with picked quantity
      const itemIndex = this.workflowSteps.filter(s => s.taskType === 'picking').indexOf(task);
      if (itemIndex >= 0 && itemIndex < this.items.length) {
        this.items.at(itemIndex).patchValue({
          pickedQuantity: pickedQuantity
        });
      }
      
      this.toast.show('Success', `Task completed: ${task.name}`, 'success');
      
      // Check if all picking tasks are completed
      this.checkWorkflowCompletion();
    }
  }

  // Check if workflow is ready for final dispatch
  checkWorkflowCompletion(): void {
    const pickingTasks = this.workflowSteps.filter(step => step.taskType === 'picking');
    const completedTasks = pickingTasks.filter(step => step.status === 'completed');
    
    if (pickingTasks.length > 0 && completedTasks.length === pickingTasks.length) {
      // All picking tasks completed, enable final dispatch
      const dispatchTask = this.workflowSteps.find(step => step.taskType === 'dispatch');
      if (dispatchTask) {
        dispatchTask.status = 'ready';
        this.toast.show('Success', 'All items picked! Ready for final dispatch', 'success');
      }
    }
  }

  // Complete final dispatch
  completeFinalDispatch(dispatchNotes: string = ''): void {
    const dispatchTask = this.workflowSteps.find(step => step.taskType === 'dispatch');
    if (dispatchTask) {
      dispatchTask.status = 'completed';
      dispatchTask.taskData.dispatchNotes = dispatchNotes;
      dispatchTask.taskData.dispatchedAt = new Date().toISOString();
      
      // Update form status
      this.form.patchValue({
        status: 'DISPATCHED',
        workflowStep: 'COMPLETED'
      });
      
      this.toast.show('Success', 'Dispatch completed successfully!', 'success');
    }
  }

  // Get workflow progress percentage
  getWorkflowProgress(): number {
    if (this.workflowSteps.length === 0) return 0;
    
    const completedSteps = this.workflowSteps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / this.workflowSteps.length) * 100);
  }

  // Get current workflow phase
  getCurrentWorkflowPhase(): string {
    const pendingTasks = this.workflowSteps.filter(step => step.status === 'pending' || step.status === 'assigned');
    
    if (pendingTasks.length === 0) {
      return 'COMPLETED';
    }
    
    const pickingTasks = pendingTasks.filter(step => step.taskType === 'picking');
    if (pickingTasks.length > 0) {
      return 'PICKING_IN_PROGRESS';
    }
    
    return 'READY_FOR_DISPATCH';
  }

  // Employee dropdown methods
  onDispatchedByFocus(): void {
    this.showEmployeeDropdown = true;
    this.filteredEmployees = [...this.employees];
  }

  onDispatchedByInput(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.dispatchedByName = event.target.value;
    this.form.patchValue({ dispatchedBy: '' }); // Clear the ID if typing
    this.filteredEmployees = this.employees.filter(employee => 
      (employee.name || (employee.firstName + ' ' + (employee.lastName || ''))).toLowerCase().includes(searchTerm) ||
      (employee.designation && employee.designation.toLowerCase().includes(searchTerm)) ||
      (employee.department && employee.department.toLowerCase().includes(searchTerm))
    );
    this.showEmployeeDropdown = true;
  }

  selectEmployee(employee: any): void {
    this.form.patchValue({
      dispatchedBy: employee.id
    });
    this.dispatchedByName = employee.name || (employee.firstName + ' ' + (employee.lastName || ''));
    this.showEmployeeDropdown = false;
  }

  onEmployeeBlur(): void {
    setTimeout(() => {
      this.showEmployeeDropdown = false;
    }, 200);
  }

  // Calculation methods
  calculateTotalAmount(): number {
    return this.items.controls.reduce((total: number, control: AbstractControl) => {
      const item = control as FormGroup;
      const amount = item.get('amount')?.value || 0;
      return total + amount;
    }, 0);
  }

  calculateTotalQuantity(): number {
    return this.items.controls.reduce((total: number, control: AbstractControl) => {
      const item = control as FormGroup;
      const quantity = item.get('quantity')?.value || 0;
      return total + quantity;
    }, 0);
  }

  // Load existing outward data for editing
  loadOutwardData(outwardId: number): void {
    this.api.get(`/warehouse/outward/${outwardId}/`).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.originalData = res.data;
          this.populateFormWithData(res.data);
        } else {
          this.toast.show('Error', 'Failed to load outward data', 'danger');
          this.isEditMode = false;
        }
      },
      error: (error) => {
        console.error('Error loading outward data:', error);
        this.toast.show('Error', 'Failed to load outward data', 'danger');
        this.isEditMode = false;
      }
    });
  }

  populateFormWithData(data: any): void {
    // Set form values
    this.form.patchValue({
      inwardType: data.inwardType || 'REQUISITION',
      date: data.date ? new Date(data.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
      requisitionId: data.requisitionId || '',
      salesOrderId: data.salesOrderId || '',
      referenceNo: data.referenceNo || '',
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      customerAddress: data.customerAddress || '',
      customerPhone: data.contact || '',
      deliveryAddress: data.deliveryAddress || '',
      dispatchNo: data.dispatchNo || '',
      requiredDate: data.requiredDate || '',
      requiredTime: data.requiredTime || '',
      priority: data.priority || 'NORMAL',
      dispatchedBy: data.dispatchedBy || '',
      pickedBy: data.pickedBy || '',
      authorizedBy: data.authorizedBy || '',
      vehicleNo: data.vehicleNo || '',
      driverName: data.driverName || '',
      driverPhone: data.driverPhone || '',
      transporterName: data.transporterName || '',
      sourceWarehouseId: data.sourceWarehouseId || '',
      sourceLocationId: data.sourceLocationId || '',
      dispatchArea: data.dispatchArea || 'LOADING_BAY',
      customDispatchArea: data.customDispatchArea || '',
      remarks: data.remarks || '',
      specialInstructions: data.specialInstructions || '',
      totalQuantity: data.totalQuantity || 0,
      totalAmount: data.totalAmount || 0,
      // status: data.status || 'PENDING_APPROVAL',
      workflowStep: data.workflowStep || 'REQUISITION_RECEIVED',
      poNo: data.poNo || [] // Populate requisitionsSelected
    });

    // Set instance variables
    this.inwardType = (data.inwardType || '3') as '3' | '4' | '5';
    this.dispatchArea = (data.dispatchArea || 'LOADING_BAY') as 'LOADING_BAY' | 'DOCK_A' | 'DOCK_B' | 'CUSTOM';

    // Clear existing items and populate with data items
    this.clearItems();
    if (data.items && data.items.length > 0) {
      data.items.forEach((itemData: any, index: number) => {
        const itemForm = this.fb.group({
          itemId: [itemData.itemId || itemData.item_id || itemData.item, Validators.required],
          item_name: [itemData.item_name || itemData.name || '', Validators.required],
          item_code: [itemData.item_code || '', Validators.required],
          quantity: [itemData.quantity || 1, [Validators.required, Validators.min(1)]],
          pickedQuantity: [itemData.pickedQuantity || 0],
          units: [itemData.units || []],
          unit: [itemData.unit || itemData.unit_id || 0, Validators.required],
          rate: [itemData.rate || itemData.price || 0, [Validators.required, Validators.min(0)]],
          amount: [itemData.amount || itemData.total_amount || 0, [Validators.required, Validators.min(0)]],
          sourceWarehouseId: [itemData.sourceWarehouseId || itemData.source_warehouse_id || null],
          sourceLocationId: [itemData.sourceLocationId || itemData.source_location_id || null],
          remarks: [itemData.remarks || ''],
          barcode: [itemData.barcode1 || '', Validators.required]
        });

        this.items.push(itemForm);
        this.showItemDropdown.push(false);
        this.filteredItems.push([...this.availableItems]);
        
        // Set item search term with item name
        const itemName = this.getItemNameById(itemData.itemId || itemData.item_id || itemData.item);
        this.itemSearchTerms.push(itemName);
      });
    } else {
      this.addItem();
    }

    this.updateFormValidation();
    this.toast.show('Info', 'Outward record loaded for editing', 'info');
    // Set dispatchedByName for edit mode
    const dispatchedById = data.dispatchedBy;
    if (dispatchedById) {
      const emp = this.employees.find(e => e.id == dispatchedById);
      this.dispatchedByName = emp ? (emp.name || (emp.firstName + ' ' + (emp.lastName || ''))) : '';
    }
  }

  getItemNameById(itemId: any): string {
    if (!itemId) return '';
    const item = this.availableItems.find((i: { id: any; }) => i.id == itemId);
    return item?.name || item?.item_name || `Item ${itemId}`;
  }

  // Save method
  save(): void {
    console.log('api',this.form.value);
    
    // if (this.form?.valid) {
      const data = this.form?.value;
      
      // Generate picking tasks
      // this.generatePickingTasks();
      
      data.totalQuantity = this.calculateTotalQuantity();
      data.totalAmount = this.calculateTotalAmount();
      data.workflowSteps = this.workflowSteps;
      data.poNo = this.selectedRequisitions.map(r => r.id); // Save selected requisitions
      
      // Add outward ID for update operations
      if (this.isEditMode && this.outwardId) {
        data.id = this.outwardId;
      }
      
      // Choose endpoint based on edit mode
      const endpoint = this.isEditMode ? `/invoice/update-outward/${this.outwardId}/` : '/invoice/create-outward/';
      const method = this.isEditMode ? 'put' : 'post';
      
      // Make API call
      this.api[method](endpoint, data).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            const action = this.isEditMode ? 'updated' : 'created';
            this.toast.show('Success', `Outward dispatch ${action} successfully`, 'success');
            
            // Show task generation notification
            if (this.workflowSteps.length > 0 && !this.isEditMode) {
              this.toast.show('Info', `${this.workflowSteps.length} picking tasks generated`, 'info');
            }
            
            if (this.activeModal) {
              this.activeModal.close(data);
            } else {
              this.router.navigate(['/warehouse/outward-list']);
            }
          } else {
            const action = this.isEditMode ? 'update' : 'create';
            this.toast.show('Error', `Failed to ${action} outward dispatch`, 'danger');
          }
        },
        error: (error) => {
          console.error('Save error:', error);
          const action = this.isEditMode ? 'update' : 'create';
          this.toast.show('Error', `Failed to ${action} outward dispatch`, 'danger');
        }
      });
    // } else {
    //   this.form?.markAllAsTouched();
    //   this.toast.show('Validation Error', 'Please fill all required fields correctly', 'warning');
    // }
  }

  cancel(): void {
    if (this.activeModal) {
      this.activeModal.dismiss('cancel');
    } else {
      this.router.navigate(['/warehouse/outward-list']);
    }
  }

  // Preview Modal Methods
  openPreviewModal(): void {
    if (!this.form?.get('dispatchNo')?.value) {
      this.generateDispatchNumber();
    }
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
  }

  printFromPreview(): void {
    this.showPreviewModal = false;
    setTimeout(() => {
      this.printDispatchNote();
      setTimeout(() => {
        this.showPreviewModal = true;
      }, 1000);
    }, 100);
  }

  printDispatchNote(): void {
    if (!this.form?.get('dispatchNo')?.value) {
      this.toast.show('Error', 'Please save the dispatch note first before printing', 'warning');
      return;
    }

    const printContent = document.getElementById('printTemplate');
    if (printContent) {
      printContent.style.display = 'block';
      
      setTimeout(() => {
        window.print();
        printContent.style.display = 'none';
      }, 100);
    }
  }

  downloadPDF(): void {
    if (!this.form?.get('dispatchNo')?.value) {
      this.generateDispatchNumber();
    }

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      
      content: [
        // Company header
        {
          text: 'AA SONS',
          style: 'companyLogo',
          alignment: 'center'
        },
        {
          text: 'AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)',
          style: 'companyName',
          alignment: 'center'
        },
        {
          text: 'DISPATCH NOTE',
          style: 'documentTitle',
          alignment: 'center',
          margin: [0, 20, 0, 20]
        },

        // Document details
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  stack: [
                    this.createDetailRow('Dispatch No', this.form?.get('dispatchNo')?.value || 'N/A'),
                    this.createDetailRow('Date', this.formatDate(this.form?.get('date')?.value)),
                    this.createDetailRow('Reference', this.form?.get('referenceNo')?.value || 'N/A'),
                    this.createDetailRow('Priority', this.form?.get('priority')?.value || 'NORMAL')
                  ]
                },
                {
                  stack: [
                    this.createDetailRow('Customer', this.form?.get('customerName')?.value || 'N/A'),
                    this.createDetailRow('Required Date', this.formatDate(this.form?.get('requiredDate')?.value)),
                    this.createDetailRow('Dispatched By', this.form?.get('dispatchedBy')?.value || 'N/A'),
                    this.createDetailRow('Vehicle No', this.form?.get('vehicleNo')?.value || 'N/A')
                  ]
                }
              ]
            ]
          },
          margin: [0, 0, 0, 20]
        },

        // Items table
        {
          table: {
            headerRows: 1,
            widths: ['8%', '40%', '12%', '12%', '12%', '16%'],
            body: [
              [
                { text: 'S.No', style: 'tableHeader', alignment: 'center' },
                { text: 'Item Description', style: 'tableHeader', alignment: 'center' },
                { text: 'Quantity', style: 'tableHeader', alignment: 'center' },
                { text: 'Unit', style: 'tableHeader', alignment: 'center' },
                { text: 'Rate', style: 'tableHeader', alignment: 'center' },
                { text: 'Amount', style: 'tableHeader', alignment: 'center' }
              ],
              ...this.generateItemRowsForPDF()
            ]
          },
          layout: {
            fillColor: function(rowIndex: number) {
              return rowIndex === 0 ? '#f0f0f0' : null;
            }
          }
        },

        // Footer
        {
          margin: [0, 20, 0, 0],
          text: `Generated on: ${new Date().toLocaleString()} | Total Items: ${this.items.length} | Total Amount: AED ${this.calculateTotalAmount().toFixed(2)}`,
          style: 'footer',
          alignment: 'center'
        }
      ],

      styles: {
        companyLogo: {
          fontSize: 24,
          bold: true,
          color: '#d32f2f'
        },
        companyName: {
          fontSize: 16,
          bold: true,
          margin: [0, 3, 0, 3]
        },
        documentTitle: {
          fontSize: 18,
          bold: true,
          color: 'white',
          fillColor: '#000000',
          margin: [0, 8, 0, 8]
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          margin: [4, 6, 4, 6]
        },
        tableCell: {
          fontSize: 9,
          margin: [4, 4, 4, 4]
        },
        footer: {
          fontSize: 8,
          italics: true,
          color: '#666666'
        }
      }
    };

    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      const fileName = `Dispatch_Note_${this.form?.get('dispatchNo')?.value || 'Draft'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      pdfDocGenerator.download(fileName);
      this.toast.show('Success', 'PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('PDF generation error:', error);
      this.toast.show('Error', 'Failed to generate PDF. Please try again.', 'danger');
    }
  }

  private createDetailRow(label: string, value: string): any {
    return {
      columns: [
        { text: label + ':', width: '35%' },
        { text: value, width: '65%' }
      ],
      margin: [0, 2, 0, 2]
    };
  }

  private formatDate(dateValue: any): string {
    if (!dateValue) return new Date().toLocaleDateString('en-GB');
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-GB');
  }

  private generateItemRowsForPDF(): any[] {
    const rows: any[] = [];
    
    this.items.controls.forEach((item: AbstractControl, index: number) => {
      const formGroup = item as FormGroup;
      rows.push([
        { text: (index + 1).toString(), style: 'tableCell', alignment: 'center' },
        { text: this.itemSearchTerms[index] || 'N/A', style: 'tableCell', alignment: 'left' },
        { text: (formGroup.get('quantity')?.value || 0).toString(), style: 'tableCell', alignment: 'center' },
        { text: this.getUnitName(formGroup.get('units')?.value, formGroup.get('unit')?.value), style: 'tableCell', alignment: 'center' },
        { text: (formGroup.get('rate')?.value || 0).toFixed(2), style: 'tableCell', alignment: 'right' },
        { text: (formGroup.get('amount')?.value || 0).toFixed(2), style: 'tableCell', alignment: 'right' }
      ]);
    });

    return rows;
  }

  getUnitName(units: any[], unitId: any): string {
    if (!units || !unitId) return 'N/A';
    const unit = units.find(u => u.id == unitId);
    return unit ? (unit.unit || unit.name) : 'N/A';
  }

  getCurrentDate(): Date {
    return new Date();
  }

  getOutwardTypeName(type: string): string {
    const typeNames = {
      'REQUISITION': 'Requisition-based Dispatch',
      'SALES_ORDER': 'Sales Order Dispatch',
      'DIRECT_DISPATCH': 'Direct Dispatch'
    };
    return typeNames[type as keyof typeof typeNames] || type;
  }

  getPriorityBadgeClass(priority: string): string {
    const classes = {
      'LOW': 'badge bg-secondary',
      'NORMAL': 'badge bg-info',
      'HIGH': 'badge bg-warning',
      'URGENT': 'badge bg-danger'
    };
    return classes[priority as keyof typeof classes] || 'badge bg-secondary';
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'PENDING_APPROVAL': 'badge bg-warning',
      'APPROVED': 'badge bg-info',
      'PICKING_IN_PROGRESS': 'badge bg-primary',
      'READY_FOR_DISPATCH': 'badge bg-success',
      'DISPATCHED': 'badge bg-dark',
      'DELIVERED': 'badge bg-success',
      'CANCELLED': 'badge bg-danger'
    };
    return classes[status as keyof typeof classes] || 'badge bg-secondary';
  }

  onItemSearchInput(index: number) {
    const searchTerm = this.itemSearchTerms[index]?.toLowerCase() || '';
    this.filteredItems[index] = this.availableItems.filter(item =>
      (item.name || item.item_name || '').toLowerCase().includes(searchTerm)
    );
    this.showItemDropdown[index] = true;
  }

  onItemBlur(index: number) {
    setTimeout(() => {
      this.showItemDropdown[index] = false;
    }, 200);
  }

  onItemInput(index: number, event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.itemSearchTerms[index] = searchTerm;
    this.filteredItems[index] = this.availableItems.filter((item: any) =>
      (item.name || '').toLowerCase().includes(searchTerm) ||
      (item.code && item.code.toLowerCase().includes(searchTerm))
    );
    this.showItemDropdown[index] = true;
    this.loadItems(searchTerm);
  }

  onItemFocus(index: number) {
    this.showItemDropdown[index] = true;
    this.filteredItems[index] = [...this.availableItems];
  }

  loadItems(searchTerm: string = ''): void {
    this.api.post('/items/list-item/s=' + encodeURIComponent(searchTerm) + '/', { company: 1 }).subscribe({
      next: (res: any) => {
        if (res.status == 200 && Array.isArray(res.data)) {
          this.availableItems = res.data;
        } else {
          this.availableItems = [];
        }
      },
      error: (error) => {
        this.availableItems = [];
        console.error('Error loading items:', error);
      }
    });
  }

  selectItem(index: number, itemOption: any) {
    this.items.at(index).patchValue({
      itemId: itemOption.id,
      item_name: itemOption.name || itemOption.item_name,
      item_code: itemOption.item_code || itemOption.item_code || itemOption.item_code || '',
      units: itemOption.units || [],
      unit: (itemOption.units && itemOption.units.length > 0) ? itemOption.units[0].id : 0,
      rate: itemOption.sales_price || 0,
      amount: 0,
      barcode: itemOption.barcode1 || itemOption.barcode1 || itemOption.barcode1 || ''
    });
    this.itemSearchTerms[index] = itemOption.name || itemOption.item_name;
    this.filteredItems[index] = [];
    this.showItemDropdown[index] = false;
  }
}
