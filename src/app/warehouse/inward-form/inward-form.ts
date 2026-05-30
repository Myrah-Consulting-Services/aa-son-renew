import { Component, OnInit, Optional, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';
import * as pdfMake from 'pdfmake/build/pdfmake';

@Component({
  selector: 'app-inward-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inward-form.html',
  styleUrl:'./inward-form.scss'
})
export class InwardForm implements OnInit {
  form:FormGroup | any;
  inwardType: '1' | '2' = '1';
  showSupplierDropdown = false;
  parties: any[] = [];
  filteredParties: any[] = [];
  selectedParty: any = null;
  partyInvoices: any[] = []; // Array to store invoices for selected party
  selectedPoNumbers: any[] = []; // Array to store selected PO objects with id and invoice_no
  showPoDropdown = false; // To control PO dropdown visibility

  // Sample data — replace with actual service calls
  warehouses:any = [ ];

  locations:any = [ ];
  filteredLocations:any = [ ]; // Locations filtered by selected warehouse

  availableItems:any = [];
  showItemDropdown: boolean[] = [];
  filteredItems: any[][] = [];
  itemSearchTerms: string[] = [];

  // Employees for "Received By" field
  employees: any[] = [];
  filteredEmployees: any[] = [];
  showEmployeeDropdown = false;
  employeeSearchTerm = '';

  // New properties for warehouse functionality
  placementOption: '1' | '2' = '1';
  workflowSteps: any[] = [];
  currentWorkflowStep = 0;
  
  // Enhanced movement tracking
  movementInitiators: any[] = [];
  movementReasons: any[] = [];
  systemTriggers: any[] = [];

  // Task assignment properties
  assignedTasks: any[] = [];
  warehouseWorkers: any[] = [];
  
  // Mobile completion tracking
  mobileTaskCompletion = {
    enabled: false,
    completedTasks: [] as any[],
    pendingTasks: [] as any[]
  };

  // Preview modal properties
  showPreviewModal = false;

  // Edit mode properties
  @Input() editInwardId: number | null = null;
  isEditMode = false;
  inwardId: number | null = null;
  originalData: any = null;
  originalGrnNo: string = '';

  // Barcode functionality properties
  barcodeGenerationTasks: any[] = [];
  generatedBarcodes: { [key: string]: string[] } = {};
  showBarcodeModal = false;
  currentItemForBarcode: any = null;
  currentItemIndex: number = -1;
  barcodeTemplate = '';
  loadingbayAreas: any[] = [];
  inset_data: any;
  data: any;
  invoice_pdf_id: any;
  companyData: any; // Store company information
  constructor(
    private fb: FormBuilder,
    @Optional() public activeModal: NgbActiveModal,
    private api: Api,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      inwardType: ['1', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      supplier: ['', Validators.required],
      supplierId: [''],
      production: ['1'],
      poNumbers: [[]], // Array to store selected PO numbers
      poNo: [''], // Keep for display purposes
      grnNo: [''],
      receivedBy: ['', Validators.required],
      remarks: [''],
      // Global warehouse and location (for GRN type)
      warehouseId: ['1'],
      locationId: [''],
      items: this.fb.array([this.createItem()]),
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      company: [1, Validators.required],
      
      // Essential warehouse functionality fields
      placementOption: ['1', Validators.required],
      loadingBayArea: [''],
      taskAssignments: this.fb.array([]),
      workflowStatus: ['pending'],
      customs_Payable: [0],
      customs_Payable_currency: [1],
      insurance_Payable: [0],
      insurance_Payable_currency: [1],
      demurage: [0],
      demurage_currency: [1],
      freight_Payable: [0],
      freight_Payable_currency: [1],
      port_Charge_Payable: [0],
      port_Charge_Payable_currency: [1],
      carriage_Inwards: [0],
      carriage_Inwards_currency: [1],
      thc_Charges: [0],
      thc_Charges_currency: [1],
      bank_Charge_Payable: [0],
      bank_Charge_Payable_currency: [1],
      misc_Others: [0],
      misc_Others_currency: [1],
      supplierSwitch: [false],
    });
    // Font configuration will be handled in downloadPDF method
  }

  ngOnInit(): void {
    this.getinvsettings();
    this.getCompany(); // Fetch company data
    // Initialize form validation and load data
    this.updateFormValidation();
    this.loadParties();
    this.loadWarehouses();
    this.loadLocations();
    this.loadItems('');
    this.loadEmployees();
    this.loadWarehouseWorkers();
    this.initializeWorkflow();
    this.loadbay()
    // Load existing data if in edit mode, otherwise set up new record behavior
    if (this.editInwardId) {
      this.isEditMode = true;
      this.invoice_pdf_id=this.editInwardId;
      this.loadInwardData(this.editInwardId);
    } else {
      // Set up form change listeners only for new records
      this.setupFormChangeListeners();
    }
    console.log(this.form.value);
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

// Fetch company data
getCompany() {
  this.api.get('/company/get-company/' + this.api.getUserCompany() + '/').subscribe((res: any) => {
    console.log('Company API Response:', res);
    if (res.status === 200 && res.data) {
      this.companyData = res.data;
    }
  });
}
getcurrency(){
   
  return this.api.getcurrencies();
}
getcurrencysecond(){
 
  return this.api.getcurrenciesecond();
}
  // Method to setup form change listeners for new records only
  private setupFormChangeListeners(): void {
    this.form.get('placementOption').valueChanges.subscribe((option: string) => {
      this.placementOption = option as '1' | '2';
      this.updatePlacementValidation();
    });

    // Watch for inward type changes
    this.form.get('inwardType').valueChanges.subscribe((type: '1' | '2') => {
      this.inwardType = type;
      this.updateFormValidation();
      
      // Generate GRN number when type is GRN (only for new records)
      if (type === '1' && !this.editInwardId) {
        this.generateGrnNumber();
      } else if (type === '2') {
        // Clear GRN number for IWT
        this.form.patchValue({ grnNo: '' });
      }
    });

    // Watch for location changes to regenerate GRN number (only for new records)
    this.form.get('locationId').valueChanges.subscribe((locationId: any) => {
      if (this.inwardType === '1' && locationId && !this.editInwardId) {
        this.generateGrnNumber();
      }
    });
  }

  onUnitChange(event: any): void {
    const item = this.items.at(event.target.formControlName) as FormGroup;
    const unit = item.get('unit')?.value;
    const units = item.get('units')?.value;
    const unitType = units.find((u: any) => u.id === unit)?.type;
    this.items.at(event.target.formControlName).get('unitType')?.setValue(unitType);
  }

  updateFormValidation(): void {
    if (this.inwardType === '1') {
      this.form.get('grnNo').setValidators([Validators.required]);
    } else {
      this.form.get('grnNo').clearValidators();
    }
    
    // Use placement option to determine warehouse/location validation
    if (this.placementOption === '1') {
      // Loading bay: use global warehouse/location
      // this.form.get('warehouseId').setValidators([Validators.required]);
      // this.form.get('locationId').setValidators([Validators.required]);
      
      // Clear item-level warehouse/location validation
      this.items.controls.forEach((control: AbstractControl) => {
        const item = control as FormGroup;
        item.get('warehouseId')?.clearValidators();
        item.get('locationId')?.clearValidators();
        item.get('warehouseId')?.updateValueAndValidity();
        item.get('locationId')?.updateValueAndValidity();
      });
    } else {
      // Direct rack: use item-level warehouse/location
      this.form.get('warehouseId').clearValidators();
      this.form.get('locationId').clearValidators();
      
      // Add item-level warehouse/location validation
      this.items.controls.forEach((control: AbstractControl) => {
        const item = control as FormGroup;
        // item.get('warehouseId')?.setValidators([Validators.required]);
        // item.get('locationId')?.setValidators([Validators.required]);
        item.get('warehouseId')?.updateValueAndValidity();
        item.get('locationId')?.updateValueAndValidity();
      });
    }
    
    this.form.get('grnNo').updateValueAndValidity();
    // this.form.get('warehouseId').updateValueAndValidity();
    // this.form.get('locationId').updateValueAndValidity();
  }

  get items(): FormArray {
    return this.form?.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      units: [[]],
      unit: [0, Validators.required],
      unitType: [''], 
      rate: [0, [Validators.required, Validators.min(0)]],
      vat: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.required, Validators.min(0)]],
      amount: [0, [Validators.required, Validators.min(0)]],
      warehouseId: [1],
      locationId: [null],
      barcode: [''],
      barcodeGenerated: [false],
      barcodeCount: [0]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
    this.updateFormValidation();
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

  onItemInput(i: number, event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.itemSearchTerms[i] = searchTerm;
    this.filteredItems[i] = this.availableItems.filter((item: any) =>
      item.name.toLowerCase().includes(searchTerm) ||
      (item.code && item.code.toLowerCase().includes(searchTerm))
    );
    this.showItemDropdown[i] = true;
    this.loadItems(searchTerm);
  }

  onItemFocus(i: number): void {
    this.showItemDropdown[i] = true;
    this.filteredItems[i] = [...this.availableItems];
  }

  onItemBlur(i: number): void {
    setTimeout(() => {
      this.showItemDropdown[i] = false;
    }, 200);
  }

  selectItem(i: number, item: any): void {
    const currentItem = this.items.at(i) as FormGroup;
    const currentQuantity = currentItem.get('quantity')?.value || 1;
    const currentDiscount = currentItem.get('discount')?.value || 0;
    const currentBarcodeGenerated = currentItem.get('barcodeGenerated')?.value || false;
    const currentBarcodeCount = currentItem.get('barcodeCount')?.value || 0;
    
    this.items.at(i).patchValue({
      itemId: item.id,
      rate: item.purchase_price || 0,
      vat: item.vat_per || 0,
      units: item.units,
      unit: item.units && item.units.length > 0 ? item.units[0].id : 0,
      unitName: item.units && item.units.length > 0 ? item.units[0].unit : '',
      // unitType: item.units && item.units.length > 0 ? item.units[0].type,
      amount: 0, // Will be calculated by updateItemAmount
      quantity: this.isEditMode ? currentQuantity : 1, // Preserve quantity in edit mode
      discount: this.isEditMode ? currentDiscount : 0, // Preserve discount in edit mode
      barcode: item.barcode1 || item.item_code || item.code || '', // Use existing barcode from item data
      barcodeGenerated: this.isEditMode ? currentBarcodeGenerated : false, // Preserve barcode status in edit mode
      barcodeCount: this.isEditMode ? currentBarcodeCount : 0 // Preserve barcode count in edit mode
    });
    
    // Update the amount after patching values
    this.updateItemAmount(i);
    
    this.itemSearchTerms[i] = item.name;
    this.showItemDropdown[i] = false;
  }

  // Method to update item amount based on quantity, rate, and VAT
  updateItemAmount(index: number): void {
    const item = this.items.at(index) as FormGroup;
    const quantity = item.get('quantity')?.value || 0;
    const rate = item.get('rate')?.value || 0;
    const vat = item.get('vat')?.value || 0;
    const discount = item.get('discount')?.value || 0;
    
    const baseAmount = quantity * rate;
    const discountAmount = (baseAmount * discount) / 100;
    const amountAfterDiscount = baseAmount - discountAmount;
    const vatAmount = (amountAfterDiscount * vat) / 100;
    const totalAmount = amountAfterDiscount + vatAmount;
    
    item.patchValue({ amount: totalAmount });
  }

  onpartyChange(partyId: any): void {
    console.log(partyId);
    // Fetch multiple invoices for the selected party
    this.api.get(`/invoice/party-wise-purchase/${partyId}/`).subscribe({
      next: (res: any) => {
        if (res.status == 200) {
          // Store all invoices for this party
          this.partyInvoices = res.data;
          
          // Only clear form fields if NOT in edit mode
          if (!this.isEditMode) {
            // Clear selected PO numbers
            this.selectedPoNumbers = [];
            
            // Clear items and reset to one empty item
            this.clearItems();
          }
        } else {
          this.toast.show('Error', 'Failed to load invoices', 'danger');
          this.partyInvoices = [];
        }
      }
    });
    
    const selectedParty = this.parties.find((party: any) => party.id == partyId);
    this.form.patchValue({
      supplier: selectedParty.partyName,
      supplierId: selectedParty.id
    });
  }

  // Method to clear all items and reset to one empty item
  clearItems(): void {
    // Clear the items array
    while (this.items.length > 0) {
      this.items.removeAt(0);
    }
    
    // Clear the dropdown arrays
    this.showItemDropdown = [];
    this.filteredItems = [];
    this.itemSearchTerms = [];
    
    // Don't add a default empty item - let PO selection add items
  }

  // Method to handle multiple PO Number selections
  togglePoSelection(invoiceId: number): void {
    const index = this.selectedPoNumbers.findIndex((po: any) => po.id === invoiceId);
    if (index > -1) {
      // Remove if already selected
      this.selectedPoNumbers.splice(index, 1);
      // Remove items from this PO
      this.removeItemsFromPo(invoiceId);
    } else {
      // Add if not selected
      const selectedInvoice = this.partyInvoices.find((invoice: any) => invoice.id === invoiceId);
      if (selectedInvoice) {
        this.selectedPoNumbers.push({ id: invoiceId, invoice_no: selectedInvoice.invoice_no });
        // Add items from this PO
        this.addItemsFromPo(invoiceId);
      }
    }
    
    // Update the form with array of PO objects and display string
    this.form.patchValue({
      poNumbers: [...this.selectedPoNumbers], // Array for backend
      poNo: this.getSelectedPoDisplayString() // String for display
    });
  }

  // Method to get display string for selected PO numbers
  getSelectedPoDisplayString(): string {
    return this.selectedPoNumbers.map((po: any) => po.invoice_no).filter(name => name).join(', ');
  }

  // Method to add items from a specific PO
  addItemsFromPo(invoiceId: number): void {
    const selectedInvoice = this.partyInvoices.find((invoice: any) => invoice.id === invoiceId);
    
    if (selectedInvoice && selectedInvoice.items && selectedInvoice.items.length > 0) {
      // Remove the default empty item if it exists and has no itemId
      if (this.items.length === 1) {
        const firstItem = this.items.at(0) as FormGroup;
        if (!firstItem.get('itemId')?.value) {
          this.items.removeAt(0);
          this.showItemDropdown.splice(0, 1);
          this.filteredItems.splice(0, 1);
          this.itemSearchTerms.splice(0, 1);
        }
      }

      selectedInvoice.items.forEach((poItem: any) => {
        console.log(poItem);
        // Find if item already exists in the form
        const existingItemIndex = this.items.controls.findIndex((control: AbstractControl) => {
          const item = control as FormGroup;
          return item.get('itemId')?.value === poItem.itemName;
        });

        if (existingItemIndex === -1) {
          // Add new item if it doesn't exist
          const newItem = this.fb.group({
            itemId: [poItem.item_info.id, Validators.required],
            quantity: [poItem.qty || 1, [Validators.required, Validators.min(1)]],
            units: [poItem.item_info.units],
            unit: [poItem.unit || 0, Validators.required],
            unitType: [poItem.unit_type ? 1 : 0],
            rate: [poItem.rate || 0, [Validators.required, Validators.min(0)]],
            vat: [poItem.vat || 0, [Validators.required, Validators.min(0)]],
            discount: [poItem.disc || 0, [Validators.required, Validators.min(0)]],
            amount: [poItem.total_amt || 0, [Validators.required, Validators.min(0)]],
            warehouseId: [null],
            locationId: [null],
            barcode: [poItem.item_info?.barcode1 || poItem.item_info?.item_code || poItem.item_info?.code || poItem.barcode1 || ''],
            barcodeGenerated: [false],
            barcodeCount: [0]
          });
          this.items.push(newItem);
          console.log(this.items.controls);
          // Add to dropdown arrays
          this.showItemDropdown.push(false);
          this.filteredItems.push([...this.availableItems]);
          this.itemSearchTerms.push(poItem.itemName);
        } else {
          // Update existing item quantity
          const existingItem = this.items.at(existingItemIndex) as FormGroup;
          const currentQty = existingItem.get('quantity')?.value || 0;
          const newQty = currentQty + (poItem.quantity || 1);
          existingItem.patchValue({ quantity: newQty });
        }
      });
    }
  }

  // Method to remove items from a specific PO
  removeItemsFromPo(invoiceId: number): void {
    const index = this.selectedPoNumbers.findIndex((po: any) => po.id === invoiceId);
    if (index > -1) {
      this.selectedPoNumbers.splice(index, 1);
      // Remove items from this PO
      this.removeItemsFromPoByInvoiceId(invoiceId);
    }
    
    // Add an empty item row if no items remain
    if (this.items.length === 0) {
      this.addItem();
    }
  }

  // Method to remove items from a specific PO by invoice ID
  removeItemsFromPoByInvoiceId(invoiceId: number): void {
    const selectedInvoice = this.partyInvoices.find((invoice: any) => invoice.id === invoiceId);
    
    if (selectedInvoice && selectedInvoice.items && selectedInvoice.items.length > 0) {
      selectedInvoice.items.forEach((poItem: any) => {
        // Find item in the form
        const existingItemIndex = this.items.controls.findIndex((control: AbstractControl) => {
          const item = control as FormGroup;
          return item.get('itemId')?.value === poItem.itemName;
        });

        if (existingItemIndex > -1) {
          const existingItem = this.items.at(existingItemIndex) as FormGroup;
          const currentQty = existingItem.get('quantity')?.value || 0;
          const poQty = poItem.quantity || 1;
          
          if (currentQty <= poQty) {
            // Remove item if quantity will be 0 or less
            this.items.removeAt(existingItemIndex);
            this.showItemDropdown.splice(existingItemIndex, 1);
            this.filteredItems.splice(existingItemIndex, 1);
            this.itemSearchTerms.splice(existingItemIndex, 1);
          } else {
            // Reduce quantity
            existingItem.patchValue({ quantity: currentQty - poQty });
          }
        }
      });
      
      // Add an empty item row if no items remain
      if (this.items.length === 0) {
        this.addItem();
      }
    }
  }

  // Method to check if a PO number is selected
  isPoSelected(invoiceId: number): boolean {
    return this.selectedPoNumbers.some((po: any) => po.id === invoiceId);
  }

  // Method to remove a selected PO number chip
  removePoNumber(invoiceId: number): void {
    this.togglePoSelection(invoiceId);
  }

  // Method to handle PO dropdown focus/blur
  onPoDropdownFocus(): void {
    this.showPoDropdown = true;
  }

  onPoDropdownBlur(): void {
    setTimeout(() => {
      this.showPoDropdown = false;
    }, 200);
  }

  // Party search and select functionality
  onSupplierFocus(): void {
    this.showSupplierDropdown = true;
    this.loadParties();
  }

  onSupplierInput(event: any): void {
    const searchTerm = event.target.value;
    this.filterParties(searchTerm);
  }

  loadParties(): void {
    this.api.post('/party/list-party/s=/', { company: 1, partyType: 2 }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.parties = res.data || [];
          this.filteredParties = [...this.parties];
          
          // Only set default party and trigger onpartyChange if NOT in edit mode
          if (!this.isEditMode && this.parties.length > 0) {
            this.form.patchValue({
              supplier: this.parties[0].partyName,
              supplierId: this.parties[0].id
            });
            this.onpartyChange(this.parties[0].id);
          }
        }
      },
      error: (error) => {
        console.error('Error loading parties:', error);
        this.toast.show('Error', 'Failed to load parties', 'danger');
      }
    });
  }

  loadWarehouses(): void {
    this.api.get('/warehouses/list-warehouse/', { company: 1 }).subscribe({
      next: (res: any) => {
        if (res.status == 200) {
          this.warehouses = res.data || [];
        }
      }
    });
  }

  loadLocations(): void {
    this.api.post('/warehouses/list-location/', { warehouse:null, company: 1 }).subscribe({
      next: (res: any) => {
        if (res.status == 200) {
          this.locations = res.data || [];
          this.filteredLocations = [...this.locations]; // Initialize filtered locations
        }
      }
    });
  }

  loadItems(b:any): void {
    let a=b
    this.api.post('/items/list-item/s='+b+'/', { company: 1 }).subscribe({
      next: (res: any) => {
        if (res.status == 200) {
          this.availableItems = res.data || [];
        }
      }
    });
  }

  // Load employees for "Received By" field
  loadEmployees(): void {
    // Try to load from payroll/employee module first
    this.api.get('/payroll/employees/', { company: 1 }).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data && res.data.length > 0) {
          this.employees = res.data.map((emp: any) => ({
            id: emp.id,
            name: emp.name || emp.employee_name || emp.full_name,
            designation: emp.designation || emp.role || 'Employee',
            department: emp.department || 'General'
          }));
        } else {
          // Fallback to default employees if no data
          this.setDefaultEmployees();
        }
        this.filteredEmployees = [...this.employees];
        
        // Set current user as default receiver if available (only for new records)
        if (!this.isEditMode) {
          this.setCurrentUserAsDefault();
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        // Fallback to default employees
        this.setDefaultEmployees();
        if (!this.isEditMode) {
          this.setCurrentUserAsDefault();
        }
      }
    });
  }

  // Method to load existing inward data for editing
  loadInwardData(inwardId: number): void {
    this.api.get(`/invoice/get-inward/${inwardId}/`).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.originalData = res.data;
          this.populateFormWithData(res.data);
          
          // Ensure proper data synchronization after all data is loaded
          setTimeout(() => {
            this.synchronizeEditModeData();
          }, 500);
        } else {
          this.toast.show('Error', 'Failed to load inward receipt data', 'danger');
          this.isEditMode = false;
        }
      },
      error: (error) => {
        console.error('Error loading inward data:', error);
        this.toast.show('Error', 'Failed to load inward receipt data', 'danger');
        this.isEditMode = false;
      }
    });
  }

  // Method to synchronize data after all components are loaded in edit mode
  private synchronizeEditModeData(): void {
    if (!this.isEditMode) return;

    // Ensure item names are properly set
    this.items.controls.forEach((item: AbstractControl, index: number) => {
      const formGroup = item as FormGroup;
      const itemId = formGroup.get('itemId')?.value;
      
      if (itemId && !this.itemSearchTerms[index]) {
        const itemName = this.getItemNameById(itemId);
        this.itemSearchTerms[index] = itemName;
      }
    });

    // Ensure supplier name is properly set
    const supplierId = this.form.get('supplierId')?.value;
    if (supplierId && !this.form.get('supplier')?.value) {
      const supplierName = this.getSupplierNameById(supplierId);
      this.form.patchValue({ supplier: supplierName });
    }

    // Recalculate total amount
    const totalAmount = this.calculateTotalAmount();
    this.form.patchValue({ totalAmount: totalAmount });

    console.log('Edit mode data synchronized:', {
      itemsCount: this.items.length,
      itemSearchTerms: this.itemSearchTerms,
      supplier: this.form.get('supplier')?.value,
      totalAmount: totalAmount
    });
  }

  // Method to populate form with existing data
  populateFormWithData(data: any): void {
    this.isEditMode = true;
    this.inwardId = data.id;
    
    // Store original GRN number to prevent overwriting
    this.originalGrnNo = data.grnNo || data.grn_no || data.document_no || '';
    
    // Set form values
    // Convert numeric values to strings for form controls
    const inwardTypeValue = String(data.inwardType || data.type || '1');
    const placementOptionValue = String(data.placementOption || data.placement_option || '1');
    
    this.form.patchValue({
      inwardType: inwardTypeValue,
      date: data.date ? new Date(data.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
      supplier: data.supplierName || data.supplier_name || this.getSupplierNameById(data.supplierId) || '',
      supplierId: data.supplierId || data.supplier_id || data.supplier || '',
      grnNo: this.originalGrnNo,
      receivedBy: data.receivedBy || data.received_by || data.recieved_by || '',
      remarks: data.remarks || '',
      warehouseId: data.warehouseId || data.warehouse_id || '',
      locationId: data.locationId || data.location_id || '',
      placementOption: placementOptionValue,
      loadingBayArea: data.loadingBayArea || data.loading_bay_area || '',
      totalAmount: data.totalAmount || data.total_amount || 0,
      customs_Payable: data.customs_Payable || 0,
      customs_Payable_currency: data.customs_Payable_currency || 1,
      insurance_Payable: data.insurance_Payable || 0,
      insurance_Payable_currency: data.insurance_Payable_currency || 1,
      demurage: data.demurage || 0,
      demurage_currency: data.demurage_currency || 1,
      freight_Payable: data.freight_Payable || 0,
      freight_Payable_currency: data.freight_Payable_currency || 1,
      port_Charge_Payable: data.port_Charge_Payable || 0,
      port_Charge_Payable_currency: data.port_Charge_Payable_currency || 1,
      carriage_Inwards: data.carriage_Inwards || 0,
      carriage_Inwards_currency: data.carriage_Inwards_currency || 1,
      thc_Charges: data.thc_Charges || 0,
      thc_Charges_currency: data.thc_Charges_currency || 1,
      bank_Charge_Payable: data.bank_Charge_Payable || 0,
      bank_Charge_Payable_currency: data.bank_Charge_Payable_currency || 1,
      misc_Others: data.misc_Others || 0,
      misc_Others_currency: data.misc_Others_currency || 1,
    });

    // Set instance variables
    this.inwardType = inwardTypeValue as '1' | '2';
    this.placementOption = placementOptionValue as '1' | '2';
    
    console.log('Patched form values:', {
      apiInwardType: data.inwardType,
      apiPlacementOption: data.placementOption,
      convertedInwardType: inwardTypeValue,
      convertedPlacementOption: placementOptionValue,
      formInwardType: this.form.get('inwardType')?.value,
      formPlacementOption: this.form.get('placementOption')?.value
    });

    // Load supplier invoices if supplier is selected (but don't clear existing data)
    if (data.supplierId || data.supplier_id || data.supplier) {
      const supplierId = data.supplierId || data.supplier_id || data.supplier;
      this.loadSupplierInvoicesForEdit(supplierId);
    }

    // Clear existing items and populate with data items
    this.clearItems();
    if (data.items && data.items.length > 0) {
      data.items.forEach((itemData: any, index: number) => {
        // Handle nested item_info structure
        const itemInfo = itemData.item_info || itemData;
        const itemId = itemData.itemId || itemInfo.id || itemData.item_id || itemData.item;
        
        const itemForm = this.fb.group({
          itemId: [itemId, Validators.required],
          quantity: [itemData.quantity || 1, [Validators.required, Validators.min(1)]],
          units: [itemInfo.units || itemData.units || []],
          unit: [itemData.unit || itemData.unit_id || 0, Validators.required],
          unitType: [itemData.unitType || itemData.unit_type || ''],
          rate: [itemData.rate || itemData.price || 0, [Validators.required, Validators.min(0)]],
          vat: [itemData.vat || itemData.vat_percent || 0, [Validators.required, Validators.min(0)]],
          discount: [itemData.discount || itemData.discount_percent || 0, [Validators.required, Validators.min(0)]],
          amount: [itemData.amount || itemData.total_amount || 0, [Validators.required, Validators.min(0)]],
          warehouseId: [itemData.warehouseId || itemData.warehouse_id || null],
          locationId: [itemData.locationId || itemData.location_id || null],
          barcode: [itemInfo.barcode1 || itemData.barcode1 || itemData.barcode || this.getItemBarcode(itemId) || ''],
          barcodeGenerated: [itemData.barcodeGenerated || false],
          barcodeCount: [itemData.barcodeCount || 0]
        });

        this.items.push(itemForm);
        this.showItemDropdown.push(false);
        this.filteredItems.push([...this.availableItems]);
        
        // Set item search term with item name
        const itemName = itemInfo.name || itemInfo.item_name || this.getItemNameById(itemId);
        this.itemSearchTerms.push(itemName);
      });
    } else {
      // Add one empty item if no items exist
      this.addItem();
    }

    // Handle PO numbers if they exist
    if (data.poNumbers || data.po_numbers || data.poNo || data.po_no) {
      let poNumbers = data.poNumbers || data.po_numbers || data.poNo;
      if (typeof poNumbers === 'string') {
        // If it's a string, try to parse or split
        try {
          poNumbers = JSON.parse(poNumbers);
        } catch {
          poNumbers = poNumbers.split(',').map((po: string) => ({ invoice_no: po.trim() }));
        }
      }
      // Handle empty array case
      if (Array.isArray(poNumbers) && poNumbers.length > 0) {
        this.selectedPoNumbers = poNumbers;
        this.form.patchValue({
          poNumbers: this.selectedPoNumbers,
          poNo: this.getSelectedPoDisplayString()
        });
      }
    }

    this.updateFormValidation();
    console.log(this.form.value);
  }

  // Method to load supplier invoices for edit mode without clearing existing data
  private loadSupplierInvoicesForEdit(supplierId: any): void {
    this.api.get(`/invoice/party-wise-purchase/${supplierId}/`).subscribe({
      next: (res: any) => {
        if (res.status == 200) {
          // Store all invoices for this party without clearing existing data
          this.partyInvoices = res.data;
        } else {
          this.toast.show('Error', 'Failed to load supplier invoices', 'danger');
          this.partyInvoices = [];
        }
      },
      error: (error) => {
        console.error('Error loading supplier invoices:', error);
        this.partyInvoices = [];
      }
    });
  }

  // Helper method to get item name by ID
  getItemNameById(itemId: any): string {
    if (!itemId) return '';
    const item = this.availableItems.find((i: { id: any; }) => i.id == itemId);
    return item?.name || item?.item_name || `Item ${itemId}`;
  }

  // Helper method to get supplier name by ID
  getSupplierNameById(supplierId: any): string {
    if (!supplierId) return '';
    const supplier = this.parties.find((p: { id: any; }) => p.id == supplierId);
    return supplier?.partyName || supplier?.name || '';
  }

  // Set default employees if API doesn't return data
  setDefaultEmployees(): void {
    this.employees = [
      { id: 1, name: 'Warehouse Manager', designation: 'Manager', department: 'Warehouse' },
      { id: 2, name: 'Store Keeper', designation: 'Store Keeper', department: 'Warehouse' },
      { id: 3, name: 'Quality Inspector', designation: 'Inspector', department: 'Quality' },
      { id: 4, name: 'Security Guard', designation: 'Security', department: 'Security' },
      { id: 5, name: 'Department Head', designation: 'Head', department: 'General' },
      { id: 6, name: 'Receiving Clerk', designation: 'Clerk', department: 'Warehouse' }
    ];
    this.filteredEmployees = [...this.employees];
  }

  // Employee search and selection methods
  onReceivedByFocus(): void {
    this.showEmployeeDropdown = true;
    this.filteredEmployees = [...this.employees];
  }

  onReceivedByInput(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.employeeSearchTerm = searchTerm;
    this.filteredEmployees = this.employees.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm) ||
      employee.designation.toLowerCase().includes(searchTerm) ||
      employee.department.toLowerCase().includes(searchTerm)
    );
    this.showEmployeeDropdown = true;
  }

  selectEmployee(employee: any): void {
    this.form.patchValue({
      receivedBy: employee.name
    });
    this.employeeSearchTerm = employee.name;
    this.showEmployeeDropdown = false;
  }

  onReceivedByBlur(): void {
    setTimeout(() => {
      this.showEmployeeDropdown = false;
    }, 200);
  }

  filterParties(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredParties = [...this.parties];
    } else {
      this.filteredParties = this.parties.filter(party => 
        party.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }

  selectParty(party: any): void {
    this.selectedParty = party;
    console.log(party);
    
    this.form.patchValue({
      supplier: party.partyName,
      supplierId: party.id
    });
    this.showSupplierDropdown = false;
    
    // Call onpartyChange to fetch invoices for the selected party
    this.onpartyChange(party.id);
  }

  onSupplierBlur(): void {
    // Delay hiding dropdown to allow for click events
    setTimeout(() => {
      this.showSupplierDropdown = false;
    }, 200);
  }

  calculateTotalAmount(): number {
    return this.items.controls.reduce((total: number, control: AbstractControl) => {
      const item = control as FormGroup;
      const quantity = item.get('quantity')?.value || 0;
      const rate = item.get('rate')?.value || 0;
      const vat = item.get('vat')?.value || 0;
      const discount = item.get('discount')?.value || 0;
      
      // Calculate base amount (quantity * rate)
      const baseAmount = quantity * rate;
      
      // Calculate discount amount
      const discountAmount = (baseAmount * discount) / 100;
      const amountAfterDiscount = baseAmount - discountAmount;
      
      // Calculate VAT amount
      const vatAmount = (amountAfterDiscount * vat) / 100;
      
      // Total amount for this item (base - discount + VAT)
      const itemTotal = amountAfterDiscount + vatAmount;
      item.patchValue({
        amount: itemTotal
      });
      return total + itemTotal;
    }, 0);
  }

  // Method to calculate individual item total
  calculateItemTotal(item: AbstractControl): number {
    const formGroup = item as FormGroup;
    const quantity = formGroup.get('quantity')?.value || 0;
    const rate = formGroup.get('rate')?.value || 0;
    const vat = formGroup.get('vat')?.value || 0;
    const discount = formGroup.get('discount')?.value || 0;
    
    const baseAmount = quantity * rate;
    const discountAmount = (baseAmount * discount) / 100;
    const amountAfterDiscount = baseAmount - discountAmount;
    const vatAmount = (amountAfterDiscount * vat) / 100;
    formGroup.patchValue({
      amount: amountAfterDiscount + vatAmount
    });
    console.log(formGroup.value);
    return amountAfterDiscount + vatAmount;
  }

  // Method to calculate total base amount (without VAT)
  calculateTotalBaseAmount(): number {
    return this.items.controls.reduce((total: number, control: AbstractControl) => {
      const item = control as FormGroup;
      const quantity = item.get('quantity')?.value || 0;
      const rate = item.get('rate')?.value || 0;
      const discount = item.get('discount')?.value || 0;
      
      const baseAmount = quantity * rate;
      const discountAmount = (baseAmount * discount) / 100;
      const amountAfterDiscount = baseAmount - discountAmount;
      
      return total + amountAfterDiscount;
    }, 0);
  }

  // Method to calculate total VAT amount
  calculateTotalVatAmount(): number {
    return this.items.controls.reduce((total: number, control: AbstractControl) => {
      const item = control as FormGroup;
      const quantity = item.get('quantity')?.value || 0;
      const rate = item.get('rate')?.value || 0;
      const vat = item.get('vat')?.value || 0;
      const discount = item.get('discount')?.value || 0;
      
      const baseAmount = quantity * rate;
      const discountAmount = (baseAmount * discount) / 100;
      const amountAfterDiscount = baseAmount - discountAmount;
      const vatAmount = (amountAfterDiscount * vat) / 100;
      
      return total + vatAmount;
    }, 0);
  }

  // Method to calculate total discount amount
  calculateTotalDiscountAmount(): number {
    return this.items.controls.reduce((total: number, control: AbstractControl) => {
      const item = control as FormGroup;
      const quantity = item.get('quantity')?.value || 0;
      const rate = item.get('rate')?.value || 0;
      const discount = item.get('discount')?.value || 0;
      
      const baseAmount = quantity * rate;
      const discountAmount = (baseAmount * discount) / 100;
      
      return total + discountAmount;
    }, 0);
  }
  getinvsettings() {
    this.api.get('/invoice/get-invoice-setting/'+this.api.getUserCompany()+'/').subscribe((res: any) => {

      console.log('Invoice settings:', res);
      if (res.status == 200) {
        this.inset_data = res.data;
      }
    });
  }
  private convertAllValuesToAED(formData: any): any {
    const conversionRate = this.inset_data.currency_conversion_rate || 1;
    // const exchangeRate = Number(this.form.get('exchange_rate')?.value) || 1;
    // const currentCurrency = Number(this.form.get('currency')?.value);

    console.log('🔄 Conversion Details:', {
      conversionRate,
      isCurrencyConversion: this.inset_data?.is_currency_conversion
    });

    // Create a deep copy of the form data
    const convertedData = JSON.parse(JSON.stringify(formData));  

    // Convert charge amounts (customs, insurance, etc.)
    const chargeFields = [
      'customs_Payable', 'insurance_Payable', 'demurage', 'freight_Payable',
      'port_Charge_Payable', 'carriage_Inwards', 'thc_Charges', 'bank_Charge_Payable', 'misc_Others'
    ];

    chargeFields.forEach(field => {
      if (convertedData[field]) {
        const currencyField = `${field}_currency`;
        const chargeCurrency = convertedData[currencyField];

        if (Number(chargeCurrency) === 2) { // If charge is in USD (handle both string "2" and number 2)
          convertedData[field] = Number((Number(convertedData[field]) * conversionRate).toFixed(2));
          console.log(`🔄 ${field}: ${convertedData[field]} USD → ${convertedData[field]} AED`);
        }
      }
    });

    // Set currency to AED (1) after conversion
    // convertedData.currency = 1;
    console.log('🔄 Currency set to AED (1)');

    return convertedData;
  }
  save(): void {
    console.log(this.form);
    
    if (this.form?.valid) {
      let data = this.form.getRawValue();
      
      // Generate putaway tasks if loading bay is selected (only for new records)
      if (this.form.get('placementOption')?.value == '1' && !this.isEditMode) {
        data.putawayTasks = this.generatePutawayTasks(); 
      } 
      console.log(data);
      
      // Add movement history tracking
      // data.movementHistory = this.generateMovementHistory();
      data.supplier = data.supplierId;
      data.poNo = this.getSelectedPoNumbers();
      data.totalAmount = this.calculateTotalAmount();
      
      // Add inward ID for update operations
      if (this.isEditMode && this.inwardId) {
        data.id = this.inwardId;
      }
      
      // Choose endpoint based on edit mode
      const endpoint = this.isEditMode ? `/invoice/inward-update/` : '/invoice/create-inward/';
      const method = this.isEditMode ? 'put' : 'post';
      data = this.convertAllValuesToAED(data);
      // Make API call
      this.api[method](endpoint, data).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.invoice_pdf_id = res.inward_id;
            const action = this.isEditMode ? 'updated' : 'created';
            this.toast.show('Success', `Inward Receipt ${action} successfully`, 'success');
            
            // Generate putaway tasks notification (only for new records)
            if (this.placementOption === '1' && !this.isEditMode) {
              this.toast.show('Info', `${this.items.length} putaway tasks generated`, 'info');
            }
            
            if (this.activeModal) {
              // this.activeModal.close(data);
            } else {
              this.router.navigate(['/warehouse/inward-list']);
            }
          } else {
            const action = this.isEditMode ? 'update' : 'create';
            this.toast.show('Error', `Failed to ${action} inward receipt`, 'danger');
          }
        },
        error: (error) => {
          console.error('Save error:', error);
          const action = this.isEditMode ? 'update' : 'create';
          this.toast.show('Error', `Failed to ${action} inward receipt`, 'danger');
        }
      });
    } else {
      this.form?.markAllAsTouched();
      this.toast.show('Validation Error', 'Please fill all required fields correctly', 'warning');
    }
  }

  // Helper method to get selected PO numbers as array
  getSelectedPoNumbers(): any[] {
    return [...this.selectedPoNumbers];
  }

  // Method to get invoice number by ID for display
  getInvoiceNumberById(invoiceId: number): string {
    const invoice = this.partyInvoices.find((inv: any) => inv.id === invoiceId);
    return invoice ? invoice.invoice_no : '';
  }

  cancel(): void {
    if (this.activeModal) {
      this.activeModal.close();
    } else {
      // Handle route navigation when used as route component
      this.router.navigate(['/warehouse/inward-list']);
    }
  }

  // Method to generate automatic GRN number
  generateGrnNumber(): void {
    // Don't regenerate GRN number in edit mode unless explicitly requested
    if (this.isEditMode && this.originalGrnNo && !confirm('Are you sure you want to generate a new GRN number? This will replace the existing one.')) {
      return;
    }
    
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    
    const grnNumber = `GRN-${year}${month}${day}-${timestamp}`;
    
    this.form.patchValue({
      grnNo: grnNumber
    });
  }

  // Set current logged-in user as default receiver
  setCurrentUserAsDefault(): void {
    // Try to get current user from localStorage or session
    const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        const userName = user.name || user.username || user.full_name;
        if (userName) {
          this.form.patchValue({
            receivedBy: userName
          });
          this.employeeSearchTerm = userName;
        }
      } catch (e) {
        console.log('Could not parse current user data');
      }
    }
  }

  // New methods for warehouse functionality
   updatePlacementValidation(): void {
    if (this.placementOption === '1') {
      this.form.get('loadingBayArea').setValidators([Validators.required]);
    } else {
      this.form.get('loadingBayArea').clearValidators();
    }
    
    this.form.get('loadingBayArea').updateValueAndValidity();
    
    // Update warehouse/location validation based on placement option
    this.updateFormValidation();
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
      { id: 1, name: 'Prajakta kamble', designation: 'Warehouse Supervisor', department: 'Warehouse', mobile: '+919823000000' },
      { id: 2, name: 'Akshay Raut', designation: 'Forklift Operator', department: 'Warehouse', mobile: '+919823000000' },
      { id: 3, name: 'Sanjay pawar', designation: 'Store Keeper', department: 'Warehouse', mobile: '+919823000000' },
      { id: 4, name: 'Ravindra singh', designation: 'Quality Inspector', department: 'Quality', mobile: '+919823000000' },
      { id: 5, name: 'Amit Verma', designation: 'Material Handler', department: 'Warehouse', mobile: '+971501234571' }
    ];

    // Initialize movement initiators and roles
    this.initializeMovementRoles();
  }

  // Initialize movement roles and permissions
  initializeMovementRoles(): void {
    // Define who can initiate and execute movements
    this.warehouseWorkers.forEach(worker => {
      const permissions = this.getWorkerPermissions(worker.designation);
      worker.canInitiate = permissions.canInitiate;
      worker.canExecute = permissions.canExecute;
      worker.equipmentCertified = permissions.equipmentCertified;
    });
  }

  // Get worker permissions based on designation
  getWorkerPermissions(designation: string): any {
    const permissionsMap: { [key: string]: any } = {
      'Warehouse Supervisor': { canInitiate: true, canExecute: true, equipmentCertified: ['Forklift', 'Pallet Jack'] },
      'Forklift Operator': { canInitiate: false, canExecute: true, equipmentCertified: ['Forklift', 'Pallet Jack'] },
      'Store Keeper': { canInitiate: true, canExecute: true, equipmentCertified: ['Pallet Jack'] },
      'Quality Inspector': { canInitiate: true, canExecute: false, equipmentCertified: [] },
      'Material Handler': { canInitiate: false, canExecute: true, equipmentCertified: ['Pallet Jack'] }
    };
    return permissionsMap[designation] || { canInitiate: false, canExecute: false, equipmentCertified: [] };
  }

  // System-generated movement trigger
  triggerSystemMovement(triggerType: string, sourceRackId: number, targetRackId: number, itemId: number, quantity: number): void {
    const systemMovement = this.fb.group({
      fromRackId: [sourceRackId, Validators.required],
      toRackId: [targetRackId, Validators.required],
      itemId: [itemId, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
      reason: [this.getReasonByTrigger(triggerType), Validators.required],
      reasonCategory: ['system_generated'],
      priority: ['high'],
      scheduledDate: [new Date().toISOString().substring(0, 16), Validators.required],
      assignedWorker: ['', Validators.required],
      initiatedBy: ['SYSTEM'],
      initiationType: ['system_generated'],
      systemTrigger: [triggerType],
      status: ['pending_assignment'],
      estimatedDuration: [this.calculateEstimatedDuration(sourceRackId, targetRackId)],
      actualDuration: [0],
      movementNotes: [`System-generated movement: ${triggerType}`],
      requiresEquipment: [this.requiresEquipmentForMovement(sourceRackId, targetRackId)],
      equipmentType: [this.getRequiredEquipment(sourceRackId, targetRackId)],
      urgencyLevel: ['high'],
      approvalRequired: [triggerType === 'Maintenance Schedule'],
      approvedBy: [''],
      createdAt: [new Date().toISOString()],
      completedAt: ['']
    });

    const movementsArray = this.form.get('rackMovements') as FormArray;
    movementsArray.push(systemMovement);

    // Auto-assign to available worker based on skills
    this.autoAssignWorker(systemMovement);

    this.toast.show('System Alert', `Movement triggered: ${triggerType}`, 'info');
  }

  // Helper methods for system movements
  getReasonByTrigger(triggerType: string): string {
    const triggerReasonMap: { [key: string]: string } = {
      'Capacity Threshold': 'Space Optimization',
      'Item Expiry Alert': 'Inventory Rotation',
      'Maintenance Schedule': 'Rack Maintenance',
      'Temperature Alert': 'Temperature Control',
      'Demand Spike': 'Better Accessibility'
    };
    return triggerReasonMap[triggerType] || 'System Generated';
  }

  calculateEstimatedDuration(fromRackId: number, toRackId: number): number {
    // Basic calculation based on rack distance and complexity
    const baseTime = 30; // minutes
    const fromRack = this.warehouses.find((r: { id: number; }) => r.id === fromRackId);
    const toRack = this.warehouses.find((r: { id: number; }) => r.id === toRackId);
    
    if (!fromRack || !toRack) return baseTime;
    
    // Add time based on rack zones (different zones take longer)
    const zoneChangeTime = fromRack.zone !== toRack.zone ? 15 : 0;
    
    // Add time for special handling
    const specialHandlingTime = (fromRack.isColdStorage || toRack.isColdStorage) ? 10 : 0;
    
    return baseTime + zoneChangeTime + specialHandlingTime;
  }

  requiresEquipmentForMovement(fromRackId: number, toRackId: number): boolean {
    const fromRack = this.warehouses.find((r: { id: number; }) => r.id === fromRackId);
    const toRack = this.warehouses.find((r: { id: number; }) => r.id === toRackId);
    
    if (!fromRack || !toRack) return false;
    
    // Requires equipment if moving between different zones or high racks
    return fromRack.zone !== toRack.zone || fromRack.maxHeight > 300 || toRack.maxHeight > 300;
  }

  getRequiredEquipment(fromRackId: number, toRackId: number): string {
    if (!this.requiresEquipmentForMovement(fromRackId, toRackId)) return 'Manual Handling';
    
    const fromRack = this.warehouses.find((r: { id: number; }) => r.id === fromRackId);
    const toRack = this.warehouses.find((r: { id: number; }) => r.id === toRackId);
    
    if (!fromRack || !toRack) return 'Manual Handling';
    
    if (fromRack.maxHeight > 300 || toRack.maxHeight > 300) {
      return 'Forklift';
    } else if (fromRack.zone !== toRack.zone) {
      return 'Pallet Jack';
    }
    
    return 'Manual Handling';
  }

  autoAssignWorker(movementForm: FormGroup): void {
    const requiredEquipment = movementForm.get('equipmentType')?.value;
    let availableWorkers = this.warehouseWorkers.filter(w => w.canExecute);
    
    // Filter workers based on equipment requirements
    if (requiredEquipment === 'Forklift') {
      availableWorkers = availableWorkers.filter(w => 
        w.equipmentCertified && w.equipmentCertified.includes('Forklift')
      );
    } else if (requiredEquipment === 'Pallet Jack') {
      availableWorkers = availableWorkers.filter(w => 
        w.equipmentCertified && w.equipmentCertified.includes('Pallet Jack')
      );
    }
    
    // Assign to first available worker
    if (availableWorkers.length > 0) {
      const assignedWorker = availableWorkers[0];
      movementForm.patchValue({
        assignedWorker: assignedWorker.id,
        status: 'assigned'
      });
      
      // Add to assigned tasks
      this.assignedTasks.push({
        id: Date.now(),
        type: 'rack_movement',
        workerId: assignedWorker.id,
        workerName: assignedWorker.name,
        assignedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + movementForm.get('estimatedDuration')?.value * 60000).toISOString(),
        status: 'assigned',
        movementData: movementForm.value
      });
    }
  }

  // Movement execution tracking
  startMovementExecution(movementIndex: number): void {
    const movement = (this.form.get('rackMovements') as FormArray).at(movementIndex) as FormGroup;
    movement.patchValue({
      status: 'in_progress',
      startedAt: new Date().toISOString()
    });
    
    this.toast.show('Movement Started', 'Rack movement execution has begun', 'info');
  }

  completeMovementExecution(movementIndex: number, actualDuration: number): void {
    const movement = (this.form.get('rackMovements') as FormArray).at(movementIndex) as FormGroup;
    movement.patchValue({
      status: 'completed',
      completedAt: new Date().toISOString(),
      actualDuration: actualDuration
    });
    
    // Update rack capacities
    this.updateRackCapacities(movement.value);
    
    // Remove from assigned tasks
    const taskIndex = this.assignedTasks.findIndex(t => t.type === 'rack_movement' && t.movementData.fromRackId === movement.value.fromRackId);
    if (taskIndex > -1) {
      const completedTask = this.assignedTasks.splice(taskIndex, 1)[0];
      this.mobileTaskCompletion.completedTasks.push(completedTask);
    }
    
    this.toast.show('Movement Completed', 'Rack movement has been successfully completed', 'success');
  }

  updateRackCapacities(movementData: any): void {
    const fromRack = this.warehouses.find((r: { id: any; }) => r.id === movementData.fromRackId);
    const toRack = this.warehouses.find((r: { id: any; }) => r.id === movementData.toRackId);
    
    if (fromRack && toRack) {
      fromRack.currentLoad -= movementData.quantity;
      toRack.currentLoad += movementData.quantity;
    }
  }

  // Get movement status badge class
  getMovementStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'badge bg-secondary',
      'pending_assignment': 'badge bg-warning',
      'assigned': 'badge bg-info',
      'in_progress': 'badge bg-primary',
      'completed': 'badge bg-success',
      'cancelled': 'badge bg-danger'
    };
    return statusClasses[status] || 'badge bg-secondary';
  }

  // Get priority badge class
  getPriorityBadgeClass(priority: string): string {
    const priorityClasses: { [key: string]: string } = {
      'low': 'badge bg-light text-dark',
      'medium': 'badge bg-warning',
      'high': 'badge bg-danger',
      'critical': 'badge bg-dark'
    };
    return priorityClasses[priority] || 'badge bg-secondary';
  }

  // Get initiator information
  getInitiatorInfo(initiatedBy: string): any {
    if (initiatedBy === 'SYSTEM') {
      return { name: 'System Generated', role: 'Automated Trigger', type: 'system' };
    }
    
    const initiator = this.warehouseWorkers.find(w => w.id.toString() === initiatedBy);
    return initiator ? { name: initiator.name, role: initiator.designation, type: 'manual' } : { name: 'Unknown', role: 'N/A', type: 'manual' };
  }

  // Get available executors (workers who can execute movements)
  getAvailableExecutors(): any[] {
    return this.warehouseWorkers.filter(worker => worker.canExecute);
  }

  // Get available initiators (staff who can initiate movements)
  getAvailableInitiators(): any[] {
    return this.warehouseWorkers.filter(worker => worker.canInitiate);
  }

  // Method to generate putaway tasks for loading bay items
  generatePutawayTasks(): any[] {
    const putawayTasks: any[] = [];
    
    if (this.form.get('placementOption')?.value === '1') {
      this.items.controls.forEach((control: AbstractControl, index: number) => {
        const item = control as FormGroup;
        const putawayTask = {
          id: Date.now() + index,
          date: this.form.get('date')?.value,
          grnRef: this.form.get('grnNo')?.value,
          itemId: item.get('itemId')?.value,
          itemName: this.itemSearchTerms[index],
          quantity: item.get('quantity')?.value,
          fromLocation: 'Loading Bay',
          fromLocationId: this.form.get('loadingBayArea')?.value, 
          toLocation: '',
          toLocationId: null, // To be assigned by warehouse manager
          status: '1',
          priority: this.form.get('itemProperties.isFragile')?.value ? '1' : '3',
          priorityName: this.form.get('itemProperties.isFragile')?.value ? 'Normal' : 'High',
          createdAt: new Date().toISOString(),
          assignedWorker: null,
          estimatedTime: 30, // minutes
          barcodeGenerated: item.get('barcodeGenerated')?.value || false,
          barcodeCount: item.get('barcodeCount')?.value || 0,
          barcode: item.get('barcode')?.value || ''
          };
        
        // Add to putaway tasks array
        putawayTasks.push(putawayTask);
        
        // Add to workflow steps
        this.workflowSteps.push({
          id: Date.now() + index + 1000,
          name: `Putaway Task - ${this.itemSearchTerms[index]}`,
          status: 'pending',
          assignee: null,
          estimatedTime: 30,
          description: `Move ${item.get('quantity')?.value} units from ${this.form.get('loadingBayArea')?.value} to designated rack`,
          taskType: 'putaway',
          taskData: putawayTask
        });
      });
    }
    
    return putawayTasks;
  }

  // Generate movement history for traceability
  generateMovementHistory(): any[] {
    const history: any[] = [];
    
    this.items.controls.forEach((control: AbstractControl, index: number) => {
      const item = control as FormGroup;
      
      const movementRecord = {
        itemId: item.get('itemId')?.value,
        itemName: this.itemSearchTerms[index],
        quantity: item.get('quantity')?.value,
        movementType: 'inward',
        fromLocation: 'External Supplier',
        toLocation: this.placementOption === '1' ? 'Loading Bay' : 'Direct Rack',
        locationDetails: {
          warehouseId: this.placementOption === '1' ? 
            this.form.get('warehouseId')?.value : 
            item.get('warehouseId')?.value,
          locationId: this.placementOption === '1' ? 
            this.form.get('locationId')?.value : 
            item.get('locationId')?.value,
        },
        timestamp: new Date().toISOString(),
        performedBy: this.form.get('receivedBy')?.value,
        grnReference: this.form.get('grnNo')?.value,
        poReference: this.getSelectedPoDisplayString(),
        status: 'completed'
      };
      
      history.push(movementRecord);
    });
    
    return history;
  }

  // Enhanced rack validation with system lock
  validateAndLockRack(rackId: number, itemId: number, quantity: number): boolean {
    const rack = this.warehouses.find((r: { id: number; }) => r.id === rackId);
    if (!rack) return false;
    
    // Check if rack is already locked by another process
    if (rack.isLocked) {
      this.toast.show('Warning', `Rack ${rack.code} is currently locked by another process`, 'warning');
      return false;
    }
    
    // Validate capacity and dimensions
    const itemProperties = this.form.get('itemProperties')?.value;
    const itemDimensions = itemProperties.dimensions;
    
    const isValid = this.validateRackCapacity(rackId, itemDimensions, quantity) &&
                   this.validateRackDimensions(rackId, itemDimensions) &&
                   this.validateRackProperties(rackId, itemProperties);
    
    if (isValid) {
      // Lock the rack temporarily
      rack.isLocked = true;
      rack.lockedBy = this.form.get('receivedBy')?.value;
      rack.lockedAt = new Date().toISOString();
      
      this.toast.show('Success', `Rack ${rack.code} validated and locked`, 'success');
    } else {
      this.toast.show('Error', `Rack ${rack.code} validation failed`, 'danger');
    }
    
    return isValid;
  }

  // Enhanced rack movement methods
  addRackMovement(): void {
    const movement = this.fb.group({
      fromRackId: ['', Validators.required],
      toRackId: ['', Validators.required],
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      reasonCategory: ['operational'],
      priority: ['medium'],
      scheduledDate: [new Date().toISOString().substring(0, 16), Validators.required],
      assignedWorker: ['', Validators.required],
      initiatedBy: ['', Validators.required],
      initiationType: ['manual'],
      systemTrigger: [''],
      status: ['pending'],
      estimatedDuration: [30],
      actualDuration: [0],
      movementNotes: [''],
      requiresEquipment: [false],
      equipmentType: ['Manual Handling'],
      urgencyLevel: ['normal'],
      approvalRequired: [false],
      approvedBy: [''],
      createdAt: [new Date().toISOString()],
      completedAt: ['']
    });
    
    const movementsArray = this.form.get('rackMovements') as FormArray;
    movementsArray.push(movement);
  }

  removeRackMovement(index: number): void {
    const movementsArray = this.form.get('rackMovements') as FormArray;
    if (movementsArray.length > 0) {
      movementsArray.removeAt(index);
    }
  }

  validateRackCapacity(rackId: number, itemDimensions: any, quantity: number): boolean {
    const rack = this.warehouses.find((r: { id: number; }) => r.id === rackId);
    return rack ? (rack.capacity - rack.currentLoad) >= quantity : false;
  }

  validateRackDimensions(rackId: number, itemDimensions: any): boolean {
    const rack = this.warehouses.find((r: { id: number; }) => r.id === rackId);
    if (!rack || !itemDimensions) return true;
    
    return itemDimensions.length <= rack.maxLength &&
           itemDimensions.breadth <= rack.maxBreadth &&
           itemDimensions.height <= rack.maxHeight;
  }

  validateRackProperties(rackId: number, itemProperties: any): boolean {
    const rack = this.warehouses.find((r: { id: number; }) => r.id === rackId);
    if (!rack || !itemProperties) return true;
    
    if (itemProperties.isFragile && !rack.isFragileSupported) return false;
    if (itemProperties.requiresColdStorage && !rack.isColdStorage) return false;
    
    return true;
  }

  // Missing methods referenced in template
  initializeWorkflow(): void {
    this.workflowSteps = [];
  }

  assignTask(stepId: number, workerId: any): void {
    const step = this.workflowSteps.find(s => s.id === stepId);
    const worker = this.warehouseWorkers.find(w => w.id == workerId);
    
    if (step && worker) {
      step.assignee = worker.name;
      step.status = 'assigned';
    }
  }

  completeTask(stepId: number): void {
    const step = this.workflowSteps.find(s => s.id === stepId);
    if (step) {
      step.status = 'completed';
    }
  }

  hasPutawayTasks(): boolean {
    return this.workflowSteps.some(step => step.taskType === 'putaway');
  }

  getWorkflowStepName(stepId: number): string {
    const step = this.workflowSteps.find(s => s.id === stepId);
    return step ? step.name : 'Unknown Step';
  }

  // Print functionality
  printReceipt(): void {
    if (!this.form?.get('grnNo')?.value) {
      this.toast.show('Error', 'Please save the receipt first before printing', 'warning');
      return;
    }

    // Show print template
    const printContent = document.getElementById('printTemplate');
    if (printContent) {
      printContent.style.display = 'block';
      
      // Trigger print
      setTimeout(() => {
        window.print();
        printContent.style.display = 'none';
      }, 100);
    }
  }

  // Helper methods for print template
  getCompanyName(): string {
    return this.companyData?.business_name;
  }

  getCompanyAddress(): string {
    return this.companyData?.business_name_arabic ;
  }

  getCompanyDetails(): any {
    return {
      name: this.companyData?.business_name,
      fullName: this.companyData?.business_name_arabic ,
      address: this.companyData?.address1,
      phone: `TEL :${this.companyData?.phone_no} FAX :${this.companyData?.alternate_business_no}`,
      email: `Email : ${this.companyData?.email}`,
      trn: `TRN : ${this.companyData?.tax_registration_number}`
    };
  }

  getInwardTypeName(type: string): string {
    return type === '1' ? 'Goods Receipt Note (GRN)' : 'Inter-Warehouse Transfer (IWT)';
  }

  getUnitName(units: any[], unitId: any): string {
    if (!units || !unitId) return 'N/A';
    const unit = units.find(u => u.id == unitId);
    return unit ? (unit.unit || unit.name) : 'N/A';
  }

  getWarehouseName(): string {
    const warehouseId = this.form?.get('warehouseId')?.value;
    if (!warehouseId) return 'N/A';
    const warehouse = this.warehouses.find((w: { id: any; }) => w.id == warehouseId);
    return warehouse ? warehouse.name : 'N/A';
  }

  getLocationName(): string {
    const locationId = this.form?.get('locationId')?.value;
    if (!locationId) return 'N/A';
    const location = this.locations.find((l: { id: any; }) => l.id == locationId);
    return location ? location.name : 'N/A';
  }

  getCurrentDate(): Date {
    return new Date();
  }

  // Enhanced save method with print option
  saveAndPrint(): void {
    if (this.form?.valid) {
      this.save();
      // Print after successful save
      setTimeout(() => {
        if (this.form?.get('grnNo')?.value) {
          this.printReceipt();
        }
      }, 1000);
    } else {
      this.form?.markAllAsTouched();
      this.toast.show('Error', 'Please fill all required fields', 'warning');
    }
  }

  // Auto-calculate amount on field changes
  onQuantityChange(index: number): void {
    this.updateItemAmount(index);
    
    // Check if barcodes need to be regenerated due to quantity change
    const item = this.items.at(index) as FormGroup;
    const itemId = item.get('itemId')?.value;
    const newQuantity = item.get('quantity')?.value || 1;
    const itemKey = `${itemId}_${index}`;
    
    if (this.generatedBarcodes[itemKey]) {
      const currentBarcodeCount = this.generatedBarcodes[itemKey].length;
      if (currentBarcodeCount !== newQuantity) {
        // Show notification about barcode count mismatch
        this.toast.show('Info', 
          `Quantity changed. Current barcodes: ${currentBarcodeCount}, New quantity: ${newQuantity}. Click barcode button to regenerate.`, 
          'info'
        );
      }
    }
  }

  onRateChange(index: number): void {
    this.updateItemAmount(index);
  }

  onDiscountChange(index: number): void {
    this.updateItemAmount(index);
  }

  onVatChange(index: number): void {
    this.updateItemAmount(index);
  }

  // Method to filter locations based on selected warehouse
  onWarehouseChange(event: any): void {
    const warehouseId = event.target.value;
    console.log(warehouseId);
    if (warehouseId) {
      this.api.get('/warehouses/warehouse-wise-location/'+ warehouseId+"/" ).subscribe({
        next: (res: any) => {
          this.filteredLocations = res.data;
        }
      });
   
    } else {
      // Show all locations if no warehouse is selected
      this.filteredLocations = [...this.locations];
    }
    
    // Only clear location selection when warehouse changes if NOT in edit mode
    // In edit mode, we want to preserve the existing location if it's valid
    if (!this.isEditMode) {
      this.form.patchValue({ locationId: '' });
    } else {
      // In edit mode, check if current location is still valid for the new warehouse
      const currentLocationId = this.form.get('locationId')?.value;
      if (currentLocationId) {
        const locationStillValid = this.filteredLocations.some((loc: any) => loc.id == currentLocationId);
        if (!locationStillValid) {
          this.form.patchValue({ locationId: '' });
        }
      }
    }
  }

  // Preview Modal Methods
  openPreviewModal(): void {
    console.log('Opening preview modal...');
    console.log('Current form state:', this.form?.value);
    console.log('GRN No:', this.form?.get('grnNo')?.value);
    console.log('showPreviewModal before:', this.showPreviewModal);
    
    // Generate GRN number if not present for preview
    if (!this.form?.get('grnNo')?.value) {
      this.generateGrnNumber();
      console.log('Generated GRN for preview:', this.form?.get('grnNo')?.value);
    }
    
    this.showPreviewModal = true;
    console.log('showPreviewModal after:', this.showPreviewModal);
    
    // Force change detection
    setTimeout(() => {
      console.log('Modal should be visible now');
    }, 100);
  }

  closePreviewModal(): void {
    this.showPreviewModal = false
  }

  printFromPreview(): void {
    // Hide the modal temporarily and print
    this.showPreviewModal = false;
    setTimeout(() => {
      this.printReceipt();
      // Show modal again after print
      setTimeout(() => {
        this.showPreviewModal = true;
      }, 1000);
    }, 100);
  }
  getInvoiceDocDefinition() {
    // Details for left and right columns
    const leftDetails = [
      [{ text: 'Vendor', bold: true }, ':', 'CASH SALES - JOHNSON ACCOUNT'],
      [{ text: 'Address', bold: true }, ':', ''],
      [{ text: 'Tel No', bold: true }, ':', ''],
      [{ text: 'Fax No', bold: true }, ':', ''],
      [{ text: 'TRN', bold: true }, ':', '']
    ];
    const rightDetails = [
      [{ text: 'Doc No', bold: true }, ':', 'INV-202404937'],
      [{ text: 'Doc Date', bold: true }, ':', '25/09/2024'],
      [{ text: 'Customer Code', bold: true }, ':', '540.Z128'],
      [{ text: 'LPO No', bold: true }, ':', ''],
      [{ text: 'Payment Terms', bold: true }, ':', 'CASH'],
      [{ text: 'Branch', bold: true }, ':', 'Head Office'],
      [{ text: 'Salesman', bold: true }, ':', 'JOHNSON']
    ];

    // Items table header and data
    const itemsHeader = [
      { text: 'S.No', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Item Code', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Description', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Un.Na', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Qty', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Rate', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Gross', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'VAT 5%', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'VAT Value', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Net', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true }
    ];
    const itemsRows = [
      ['1', 'BR 1395 67', { text: 'IRONTABLE 110X30 SIR MORNING BREEZE', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '135.00', alignment: 'right' }, { text: '135.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '6.75', alignment: 'right' }, { text: '141.75', alignment: 'right' }],
      ['2', 'PMR0021055', { text: 'PREMIER SUPER G MIXER GRINDER - 230 V - KM501 C2 (CE) (COC)(UK PLUG)', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '7.45', alignment: 'right' }, { text: '156.45', alignment: 'right' }],
      ['3', 'ANI-BR 4791 68', { text: 'MC RETROBIN-20L ALMOND SLIMLINE', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '60.00', alignment: 'right' }, { text: '60.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '3.00', alignment: 'right' }, { text: '63.00', alignment: 'right' }],
      ['4', 'BR 1499 00', { text: 'NEWICON PEDALBIN-5L Soft Beige', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '2', alignment: 'right' }, { text: '85.00', alignment: 'right' }, { text: '170.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '8.50', alignment: 'right' }, { text: '178.50', alignment: 'right' }],
      ['5', 'BR 3501 84', { text: 'DRYINGRACK-20M T-MODEL GREY', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '7.45', alignment: 'right' }, { text: '156.45', alignment: 'right' }],
      ['6', '130-95STGBG', { text: '95PC D/SET F.C STINGRAY BEIGEFINE CHINA', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '300.00', alignment: 'right' }, { text: '300.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '15.00', alignment: 'right' }, { text: '315.00', alignment: 'right' }],
      ['7', 'PMR00546', { text: 'S.S. PRESSURE COOKER - COMFORT - 3 LTRS.', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '79.00', alignment: 'right' }, { text: '79.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '3.95', alignment: 'right' }, { text: '82.95', alignment: 'right' }],
      ['8', 'ANI-BR 1131 47', { text: 'NEWICON PEDALBIN-3L BRILLIANT STEEL', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '2', alignment: 'right' }, { text: '30.00', alignment: 'right' }, { text: '60.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '3.00', alignment: 'right' }, { text: '63.00', alignment: 'right' }]
    ];

    // Details row using the same 10 columns as the items table
    const detailsRow = [
      // Left details (spanning columns 0-4)
      {
        colSpan: 5,
        stack: [
          { text: 'Vendor', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Address', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Tel No', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Fax No', bold: true, margin: [0, 1, 0, 1] },
          { text: 'TRN', bold: true, margin: [0, 1, 0, 1] }
        ]
      }, {}, {}, {}, {},
      // Right details (spanning columns 5-9)
      {
        colSpan: 5,
        stack: [
          { text: 'Doc No : INV-202404937', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Doc Date : 25/09/2024', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Customer Code : 540.Z128', bold: true, margin: [0, 1, 0, 1] },
          { text: 'LPO No :', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Payment Terms : CASH', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Branch : Head Office', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Salesman : JOHNSON', bold: true, margin: [0, 1, 0, 1] }
        ]
      }, {}, {}, {}, {}
    ];

    // Combine all into a single table
    const combinedTable = {
      table: {
        widths: [22, 60, '*', 32, 22, 38, 44, 28, 44, 48],
        body: [
          // TAX INVOICE title row
          [
            { text: 'TAX INVOICE', style: 'taxInvoiceTitle', alignment: 'center', colSpan: 10, margin: [0, 6, 0, 6], fontSize: 14, bold: true }, {}, {}, {}, {}, {}, {}, {}, {}, {}
          ],
          // Details row (spanning columns)
          [
            {
              colSpan: 5, stack: [
                { text: 'Vendor', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Address', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Tel No', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Fax No', bold: true, margin: [0, 1, 0, 1] },
                { text: 'TRN', bold: true, margin: [0, 1, 0, 1] }
              ]
            }, {}, {}, {}, {},
            {
              colSpan: 5, stack: [
                { text: 'Doc No : INV-202404937', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Doc Date : 25/09/2024', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Customer Code : 540.Z128', bold: true, margin: [0, 1, 0, 1] },
                { text: 'LPO No :', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Payment Terms : CASH', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Branch : Head Office', bold: true, margin: [0, 1, 0, 1] },
                { text: 'Salesman : JOHNSON', bold: true, margin: [0, 1, 0, 1] }
              ]
            }, {}, {}, {}, {}
          ],
          // Items table header
          itemsHeader,
          // Items table rows
          ...itemsRows
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 2 ? '#f0f0f0' : null),
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 2,
        paddingBottom: () => 2
      },
      fontSize: 10,
      margin: [0, 10, 0, 0]
    };

    // Amount in words and totals table side by side
    const amountAndTotals = {
      columns: [
        {
          width: '*',
          text: [
            { text: 'AMOUNT IN WORDS : ', bold: true },
            { text: 'AED One Thousand One Hundred Fifty Seven And Ten Fils Only' }
          ],
          fontSize: 11,
          margin: [0, 2, 0, 0],
          alignment: 'left',
        },
        {
          width: 150,
          table: {
            widths: [80, 70],
            body: [
              [
                { text: 'Gross :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '1,102.00', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'Discount Amt :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '0.00', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'Taxable Amt :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '1,102.00', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'VAT :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '55.10', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'TOTAL :', alignment: 'right', bold: true, fontSize: 12, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '1,157.10', alignment: 'right', bold: true, fontSize: 12, margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ]
            ]
          },
          layout: 'noBorders',
          alignment: 'right',
          fontSize: 11,
          margin: [0, 2, 0, 0],
        }
      ],
      columnGap: 10
    };

    // Remarks table
    const remarksTable = {
      table: {
        widths: [70, 10, '*'],
        body: [
          [
            { text: 'Remarks', bold: true, alignment: 'left', margin: [4, 2, 0, 2] },
            { text: ':', alignment: 'center', margin: [0, 2, 0, 2] },
            { text: 'LULU GIFT', alignment: 'left', margin: [0, 2, 4, 2] }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000',
        vLineColor: () => '#000'
      },
      margin: [0, 18, 0, 0],
      fontSize: 11
    };

    // Footer section (For company, received, signatures)
    const footerSection = [
      {
        columns: [
          {
            width: '*', text: [
              'For ',
              { text: 'AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)', bold: true }
            ], margin: [0, 18, 0, 0], fontSize: 12
          },
          { width: '*', text: 'Received the above goods in good conditions', alignment: 'right', margin: [0, 18, 0, 0], fontSize: 12 }
        ]
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }] },
              { text: 'Approved By', alignment: 'center', bold: true, margin: [0, 4, 0, 0] },
              { text: 'Print Date & Time :    6/25/2025    2:59 PM', alignment: 'left', fontSize: 9, margin: [0, 8, 0, 0] }
            ]
          },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }] },
              { text: 'Checked By', alignment: 'center', bold: true, margin: [0, 4, 0, 0] },
              { text: 'User :    Pitchai', alignment: 'left', fontSize: 9, margin: [0, 8, 0, 0] }
            ]
          },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }] },
              { text: 'Received By', alignment: 'center', bold: true, margin: [0, 4, 0, 0] },
              { text: 'Page No :    1', alignment: 'left', fontSize: 9, margin: [0, 8, 0, 0] }
            ]
          }
        ],
        margin: [0, 28, 0, 0]
      }
    ];

    return {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 30],
      content: [
        // Logo
        {
          image: 'data:image/png;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCADIAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxAAPwD+/iiiigD/2Q==',
          width: 80,
          alignment: 'center',
          margin: [0, 0, 0, 8]
        },
        // Company Name
        {
          text: 'AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)',
          style: 'companyName',
          alignment: 'center',
          margin: [0, 0, 0, 4]
        },
        // Address and Contact
        {
          text: 'POST BOX NO. 4713, DUBAI, U.A.E.\nTEL :04-3536699 FAX :04-3536611 Email : raisem@eim.ae',
          style: 'companyInfo',
          alignment: 'center',
          margin: [0, 0, 0, 2]
        },
        // TRN
        {
          text: 'TRN : 100033732700003',
          style: 'trn',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        // Combined Table (TAX INVOICE, details, items)
        combinedTable,
        // Amount in Words and Totals Table (side by side)
        amountAndTotals,
        // Remarks Table
        remarksTable,
        // Footer Section
        ...footerSection
      ],
      styles: {
        companyName: { fontSize: 16, bold: true },
        companyInfo: { fontSize: 11 },
        trn: { fontSize: 12, bold: true },
        taxInvoiceTitle: { fontSize: 14, bold: true },
        itemsTableHeader: { bold: true, fontSize: 12, fillColor: '#f0f0f0', alignment: 'center' }
      }
    };
  }
  close() {
    if (this.activeModal) {
      this.activeModal.close();
    }
  }
  previewPDF() {
      this.purchasepdf()
  }
  purchasepdf() {
    this.api.get('/invoice/outward_pdf/' + this.invoice_pdf_id + '/'+'INW'+'/').subscribe((res: any) => {
      console.log(res);
      this.data = res.data
      // this.downloadPDFpur()
      const docDefinition: any = this.downloadPDFpur();
      pdfMake.createPdf(docDefinition).open();
    })
  }

  downloadPDF() {
      this.api.get('/invoice/outward_pdf/' + this.invoice_pdf_id + '/').subscribe((res: any) => {
        console.log(res);
        this.data = res.data
        // this.downloadPDFpur()
        const docDefinition: any = this.downloadPDFpur();
        pdfMake.createPdf(docDefinition).download('Material_Receipt_Note_Header.pdf');

      })
  }
  
  downloadPDFpur() {
    if (!this.data) {
      alert('Data not loaded yet!');
      return;
    }
    
    if (!this.companyData) {
      // Try to load company data if not available
      this.getCompany();
      alert('Company data not loaded yet! Please wait for company information to load and try again.');
      return;
    }
// Dynamic filler only when items are few; avoid forcing extra blank pages
    const approxRowHeight = 12; // px per row approximation
    const minVisibleRows = 25; // target rows to fill the page area
    const missingRowCount = Math.max(0, minVisibleRows - this.data.items.length);
    const extraTotalTopMargin = missingRowCount * approxRowHeight;
    console.log(missingRowCount,extraTotalTopMargin);
    // @ts-ignore
    const pdfMake = window['pdfMake'];
    const d = this.data;
    // Build item rows from API data
    const itemRows = d.items.map((item: any, idx: number) => [
      { text: (idx + 1).toString(), alignment: 'center', fontSize: 9 },
      { text: item.item_info.item_code, alignment: 'center', fontSize: 9 },
      { text: item.item_info.name, fontSize: 9 },
      { text: item.item_info.units[0]?.name.split(' - ')[0] || '', alignment: 'center', fontSize: 9 },
      { text: item.quantity.toFixed(2), alignment: 'right', fontSize: 9 },
      { text: item.rate.toFixed(2), alignment: 'right', fontSize: 9 },
      { text: item.amount.toFixed(2), alignment: 'right', fontSize: 9 }
    ]);

    // Calculate totals
    const totalQty = d.items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0).toFixed(2);
    const totalGross = d.items.reduce((sum: number, item: any) => sum + Number(item.amount), 0).toFixed(2);
    // Charges section rows
    const chargesRows = [
      [
        { text: 'Customs Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.customs_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Insurance Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.insurance_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Demurage (AED)', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.demurage?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Total Net :', bold: true, alignment: 'right', rowSpan: 3, valign: 'middle', fontSize: 9, noWrap: true, margin: [0, 0, 0, 0] },
        { text: d.final_total_amount?.toFixed(2) || '0.00', bold: true, alignment: 'right', rowSpan: 3, valign: 'middle', fontSize: 9, noWrap: true, margin: [0, 0, 0, 0] }
      ],
      [
        { text: 'Freight Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.freight_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Port Charge Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.port_Charge_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Carriage Inwards', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.carriage_Inwards?.toFixed(2) || '0.00',alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        {},
        {}
      ],
      [
        { text: 'THC & DO Charges', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.thc_Charges?.toFixed(2) || '0.00',alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Bank Charge Payable', bold: true, fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.bank_Charge_Payable?.toFixed(2) || '0.00', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: 'Misc. & Others', bold: true, color: '#2222ee', fontSize: 9, margin: [0, 0, 0, 0] },
        { text: d.misc_Others?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0, 0, 0, 0] },
        {},
        {}
      ]
    ];
    // @ts-ignore
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [10, 10, 10, 260],
      footer: (currentPage: number, pageCount: number) => {
        return {
                  stack: [
        {
          table: {
            widths: ['*', 120, 60],
            body: [
              // [
              //   { text: 'Page Total', italics: true, alignment: 'center', margin: [0, 0, 0, 0]},
              //   { text: totalQty, bold: true, italics: true, alignment: 'right',},
              //   { text: totalGross, bold: true, italics: true, alignment: 'right' }
              // ],
              [
                { text: '' },
                { text: 'Total Discount :', alignment: 'right', bold: true },
                { text: d.total_discount?.toFixed(2) || '0.00', alignment: 'right' }
              ],
              [
                { text: '' },
                { text: 'Total Gross :', alignment: 'right', bold: true },
                { text: d.final_total_amount?.toFixed(2) || '0.00', alignment: 'right' }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) { return i === node.table.body.length ? 0 : 1; },
            vLineWidth: function (i: number, node: any) {
              // Only leftmost and rightmost vertical lines
              if (i === 0 || i === node.table.widths.length) return 1;
              return 0;
            },
            hLineColor: function (i: any, node: any) { return 'black'; },
            vLineColor: function (i: any, node: any) { return 'black'; }
          },
          margin: [10, 0, 10, 0]
        },
        {
          table: {
            widths: [70, 60, 70, 60, 60, 60, 60, 62],
            body: chargesRows
          },
          layout: {
            hLineWidth: function(i: number, node: any) { return i === node.table.body.length ? 0 : 1; },
            vLineWidth: function (i: number) { return 1; },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [10, 0, 0, 0]
        },
        // Amount in words row
        {
          table: {
            widths: [120, '*'],
            body: [
              [
                { text: 'Amount in words :', bold: true, fontSize: 10, margin: [0, 0, 0, 0] },
                { text: 'USD Two Hundred Twelve Thousand Eight Hundred Twenty Four and Fifty One Pounds Only', fontSize: 10, margin: [0, 0, 0, 0] }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) { return i === node.table.body.length ? 0 : 1; },
            vLineWidth: function (i: number) { return 1; },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [10, 0, 10, 0]
        },
        // Remarks row
        {
          table: {
            widths: [80, '*'],
            body: [
              [
                { text: 'Remarks', bold: true, fontSize: 11, margin: [0, 0, 0, 0] },
                { text: d.notes || ':', fontSize: 11, margin: [0, 0, 0, 0] }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i: number, node: any) { return i === node.table.body.length ? 0 : 1; },
            vLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.widths.length) ? 1 : 0;
            },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [10, 0, 10, 0]
        },
        // Signature section with outer border
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: `For ${this.companyData?.business_name }`, bold: true, fontSize: 12, margin: [0, 8, 0, 8] },
                    {
                      table: {
                        widths: ['33%', '33%', '34%'],
                        body: [
                          [
                            { text: 'Prepared By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] },
                            { text: 'Checked By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] },
                            { text: 'Approved By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] }
                          ]
                        ]
                      },
                      layout: 'noBorders',
                      margin: [0, 4, 0, 4]
                    }
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i: number) { return 1; },
            vLineWidth: function (i: number) { return 1; },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [10, 0, 10, 0]
        }
        ]  ,
      }
    },
      // footer: function (currentPage: number, pageCount: number) {
      //   return {
      //     columns: [
      //       { text: 'Print Date & Time :      6/25/2025    2:56 PM', alignment: 'left', fontSize: 9 },
      //       { text: 'User :   Pitchai', alignment: 'center', fontSize: 9 },
      //       { text: 'Page No :    ' + currentPage, alignment: 'right', fontSize: 9 }
      //     ],
      //     margin: [40, 0]
      //   };
      // },
      content: [
        {
          table: {
            headerRows: 4,
            widths: [25, 55, '*', 30, 35, 35, 45],
            body: [
              // Company info row (spans all columns)
              [
                {
                  colSpan: 7,
                  stack: [
                    // Company logo if available
                    
                    { text: this.companyData?.business_name, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
                    { text: this.companyData?.address1, fontSize: 10, alignment: 'center', margin: [0, 0, 0, 0] },
                    { text: `TEL :${this.companyData?.phone_no} FAX :${this.companyData?.alternate_business_no} Email : ${this.companyData?.email}`, fontSize: 10, alignment: 'center', margin: [0, 0, 0, 0] },
                    { text: `TRN : ${this.companyData?.tax_registration_number}`, fontSize: 11, bold: true, alignment: 'center', color: '#000', margin: [0, 0, 0, 6] },
                    // Additional company information
                    ...(this.companyData?.license_number ? [{ text: `License: ${this.companyData.license_number}`, fontSize: 9, alignment: 'center', margin: [0, 0, 0, 2] }] : []),
                    ...(this.companyData?.vat_registered ? [{ text: 'VAT Registered Company', fontSize: 9, alignment: 'center', color: '#0066cc', margin: [0, 0, 0, 2] }] : [])
                  ],
                  alignment: 'center',
                  margin: [0, 4, 0, 4]
                }, {}, {}, {}, {}, {}, {}
              ],
              // Section header row (spans all columns)
              [
                {
                  colSpan: 7,
                  text: 'MATERIAL RECEIPT NOTE IMPORT',
                  bold: true,
                  fontSize: 14,
                  alignment: 'center',
                  margin: [0, 2, 0, 2]
                }, {}, {}, {}, {}, {}, {}
              ],
              // Details row (as before, using colSpan for left/right blocks)
              [
                {
                  colSpan: 3, stack: [
                    { text: [{ text: 'Vendor     : ' + (this.form.get('production')?.value ? (this.form.get('production')?.value === '1' ? 'Factory Lagos' : this.form.get('production')?.value === '2' ? 'Factory Benin' : '') : 'Vendor'), bold: true, fontSize: 9 }, { text: d.party_name, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Address    : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 }], margin: [0, 0, 0, 0] },
                    { text: '', fontSize: 9, margin: [65, 0, 0, 1] },
                    { text: [{ text: 'Tel No     : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Fax No     : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'TRN        : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 }], margin: [0, 0, 0, 1] }
                  ]
                }, {}, {},
                {
                  colSpan: 4, stack: [
                    { text: [{ text: 'Doc No         : ', bold: true, fontSize: 9 }, { text: d.grnNo, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Doc Date       : ', bold: true, fontSize: 9 }, { text: d.date, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Currency       : ', bold: true, fontSize: 9 }, { text: this.getcurrency(), fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Expt Dly Date  : ', bold: true, fontSize: 9 }, { text: d.dueDate, fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Payment Terms  : ', bold: true, fontSize: 9 }, { text: d.terms?.toString() || '', fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Outlet         : ', bold: true, fontSize: 9 }, { text: 'Main Store Warehouse', fontSize: 9 }], margin: [0, 0, 0, 1] },
                    { text: [{ text: 'Branch         : ', bold: true, fontSize: 9 }, { text: 'Head Office', fontSize: 9 }], margin: [0, 0, 0, 1] }
                  ]
                }, {}, {}, {}
              ],
              // Items table header
              [
                { text: 'S.No', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Item Code', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Description', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Unit', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Qty', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Rate', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Gross', bold: true, alignment: 'center', fontSize: 9 }
              ],
              ...itemRows,
              // ...(missingRowCount > 0 ? [[
              //   {
              //     colSpan: 7,
              //     table: {
              //       widths: ['*'],
              //       body: [[{ text: ' ', margin: [0, extraTotalTopMargin, 0, 0],border: [true, false, true, false] }]]
              //     },
              //     layout: {
              //       hLineWidth: function (i: number, node: any) { return 1; },
              //       vLineWidth: function (i: number, node: any) {
              //         return (i === 0 || i === node.table.widths.length) ? 1 : 0;
              //       },
              //       hLineColor: function () { return 'black'; },
              //       vLineColor: function () { return 'black'; }
              //     },
              //   }, {}, {}, {}, {}, {}, {}
              // ]] : []),
              // Row for totals (Qty and Gross)
              [
                { text: 'Page Total',colSpan: 4, italics: true, alignment: 'center', margin: [0,0, 0, extraTotalTopMargin]},{},{},{},
                { text: totalQty, bold: true, italics: true, alignment: 'right',},
                {text: ''},
                { text: totalGross, bold: true, italics: true, alignment: 'right'}
              ],
            ],
            layout: {
              hLineWidth: function(i: number, node: any) { return i === node.table.body.length ? 0 : 1; },
              vLineWidth: function(i: number) { return 1; },
              hLineColor: function() { return 'black'; },
              vLineColor: function() { return 'black'; }
            },
            styles: {
              logoText: { fontSize: 28, bold: true, color: '#222' },
              companyName: { fontSize: 16, bold: true },
              trnBold: { fontSize: 12, bold: true },
              sectionTitle: { fontSize: 14, bold: true }
            },
            fontSize: 9,
          margin: [0, 0, 0, 0]
        }
        },
      ]
    };
    // @ts-ignore
    // pdfMake.createPdf(docDefinition).download('Material_Receipt_Note_Header.pdf');
    return docDefinition;
  }


  // Helper method to format date for PDF
  private formatDate(dateValue: any): string {
    if (!dateValue) return new Date().toLocaleDateString('en-GB');
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-GB');
  }

  // Helper method to generate item rows for PDF
  private generateItemRows(): any[] {
    const rows: any[] = [];
    
    this.items.controls.forEach((item: AbstractControl, index: number) => {
      const formGroup = item as FormGroup;
      rows.push([
        { text: (index + 15).toString(), style: 'tableCell', alignment: 'center' },
        { text: this.getItemCode(formGroup.get('itemId')?.value), style: 'tableCellBold', alignment: 'left' },
        { text: this.getItemDescription(formGroup.get('itemId')?.value), style: 'tableCell', alignment: 'left' },
        { text: this.getUnitName(formGroup.get('units')?.value, formGroup.get('unit')?.value), style: 'tableCell', alignment: 'center' },
        { text: (formGroup.get('quantity')?.value || 0).toFixed(2), style: 'tableCell', alignment: 'center' },
        { text: (formGroup.get('rate')?.value || 0).toFixed(2), style: 'tableCell', alignment: 'center' },
        { text: (formGroup.get('amount')?.value || 0).toFixed(2), style: 'tableCell', alignment: 'center' }
      ]);
    });

    return rows;
  }

  // Helper method to generate empty rows for PDF (minimum 8 total rows)
  private generateEmptyRowsForPDF(): any[] {
    const currentItems = this.items.length;
    const minRows = 8;
    const emptyRowsNeeded = Math.max(0, minRows - currentItems);
    const emptyRows: any[] = [];

    for (let i = 0; i < emptyRowsNeeded; i++) {
      emptyRows.push([
        { text: '', style: 'tableCell', alignment: 'center' },
        { text: '', style: 'tableCell', alignment: 'center' },
        { text: '', style: 'tableCell', alignment: 'center' },
        { text: '', style: 'tableCell', alignment: 'center' },
        { text: '', style: 'tableCell', alignment: 'center' },
        { text: '', style: 'tableCell', alignment: 'center' },
        { text: '', style: 'tableCell', alignment: 'center' }
      ]);
    }

    return emptyRows;
  }

  // Supplier detail methods
  getSupplierAddress(): string {
    const supplierId = this.form?.get('supplierId')?.value;
    const supplier = this.parties.find(p => p.id == supplierId);
    return supplier?.address || 'Address not available';
  }

  getSupplierPhone(): string {
    const supplierId = this.form?.get('supplierId')?.value;
    const supplier = this.parties.find(p => p.id == supplierId);
    return supplier?.contact || supplier?.phone || 'N/A';
  }

  getSupplierFax(): string {
    const supplierId = this.form?.get('supplierId')?.value;
    const supplier = this.parties.find(p => p.id == supplierId);
    return supplier?.fax || 'N/A';
  }

  getSupplierTRN(): string {
    const supplierId = this.form?.get('supplierId')?.value;
    const supplier = this.parties.find(p => p.id == supplierId);
    return supplier?.trn || supplier?.tax_number || 'N/A';
  }

  // Item detail methods
  getItemCode(itemId: any): string {
    if (!itemId) return 'N/A';
    const item = this.availableItems.find((i: { id: any; }) => i.id == itemId);
    return item?.item_code || item?.code || 'N/A';
  }

  getItemDescription(itemId: any): string {
    if (!itemId) return 'N/A';
    const item = this.availableItems.find((i: { id: any; }) => i.id == itemId);
    return item?.name || item?.description || 'N/A';
  }

  // Generate empty rows to match the format (minimum 8 rows total)
  getEmptyRows(): any[] {
    const currentItems = this.items.length;
    const minRows = 8;
    const emptyRowsNeeded = Math.max(0, minRows - currentItems);
    return Array(emptyRowsNeeded).fill({});
  }

  // ====================================
  // BARCODE FUNCTIONALITY
  // ====================================

  // Generate barcodes for an item based on quantity
  generateBarcodesForItem(itemIndex: number): void {
    const item = this.items.at(itemIndex) as FormGroup;
    const itemId = item.get('itemId')?.value;
    const quantity = item.get('quantity')?.value || 1;
    const itemName = this.itemSearchTerms[itemIndex] || `Item ${itemIndex + 1}`;
    const existingBarcode = item.get('barcode')?.value;
    
    if (!itemId) {
      this.toast.show('Error', 'Please select an item first', 'warning');
      return;
    }

    // Check if item has existing barcode code from database
    if (!existingBarcode) {
      this.toast.show('Warning', 'No barcode found for this item. Please add barcode to item master data.', 'warning');
      return;
    }

    // Check if barcodes already exist for this item
    const itemKey = `${itemId}_${itemIndex}`;
    const existingTask = this.barcodeGenerationTasks.find(t => 
      t.itemId === itemId && t.itemIndex === itemIndex
    );
    
    if (existingTask || this.generatedBarcodes[itemKey]) {
      // If barcodes already exist, just show the modal
      this.currentItemForBarcode = {
        itemId: itemId,
        itemName: itemName,
        quantity: quantity,
        barcodes: this.generatedBarcodes[itemKey] || [],
        itemIndex: itemIndex,
        baseBarcode: existingBarcode
      };
      this.currentItemIndex = itemIndex;
      this.showBarcodeModal = true;

      // Generate actual barcodes in the preview after modal opens
      setTimeout(() => {
        this.generatePreviewBarcodes();
      }, 100);

      this.toast.show('Info', `Viewing existing barcodes for ${itemName}`, 'info');
      return;
    }
 
    console.log(existingBarcode,"kcdkcdcmdk");
    // Generate unique barcodes for each quantity using existing barcode as base
    const barcodes: string[] = [];
    const baseBarcode = existingBarcode;
    
    for (let i = 1; i <= quantity; i++) {
      // Use existing barcode with sequential suffix for each unit
      const sequentialBarcode = `${baseBarcode}`;
      barcodes.push(sequentialBarcode);
    }

    // Store generated barcodes
    this.generatedBarcodes[itemKey] = barcodes;

    // Update item FormGroup with barcode info
    const itemForm = this.items.at(itemIndex) as FormGroup;
    itemForm.patchValue({
      barcodeGenerated: true,
      barcodeCount: barcodes.length
    });

    // Create barcode generation task (only if not exists)
    this.createBarcodeGenerationTask(itemIndex, itemId, itemName, quantity, barcodes);

    // Show barcode print modal
    this.currentItemForBarcode = {
      itemId: itemId,
      itemName: itemName,
      quantity: quantity,
      barcodes: barcodes,
      itemIndex: itemIndex,
      baseBarcode: baseBarcode
    };
    this.currentItemIndex = itemIndex;
    this.showBarcodeModal = true;

    // Generate actual barcodes in the preview after modal opens
    setTimeout(() => {
      this.generatePreviewBarcodes();
    }, 100);

    this.toast.show('Success', `${quantity} barcodes generated for ${itemName} using code: ${baseBarcode}`, 'success');
  }

  // Get existing barcode from item data
  getItemBarcode(itemId: any): string {
    const item = this.availableItems.find((i: { id: any; }) => i.id == itemId);
    return item?.barcode1 || item?.item_code || item?.code || '';
  }

  // Create barcode generation task
  createBarcodeGenerationTask(itemIndex: number, itemId: any, itemName: string, quantity: number, barcodes: string[]): void {
    // Check if task already exists to prevent duplicates
    const existingTask = this.barcodeGenerationTasks.find(t => 
      t.itemId === itemId && t.itemIndex === itemIndex
    );
    
    if (existingTask) {
      console.log('Task already exists for this item, skipping creation');
      return;
    }

    const task = {
      id: Date.now() + itemIndex + Math.random() * 1000, // More unique ID
      type: 'barcode_generation',
      itemId: itemId,
      itemName: itemName,
      itemIndex: itemIndex,
      quantity: quantity,
      barcodes: barcodes,
      status: 'pending',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      assignedWorker: null,
      estimatedTime: Math.ceil(quantity / 10) * 5, // 5 minutes per 10 barcodes
      description: `Generate and print ${quantity} barcodes for ${itemName}`,
      taskType: 'barcode_printing',
      grnReference: this.form.get('grnNo')?.value,
      warehouseLocation: this.getWarehouseName()
    };

    this.barcodeGenerationTasks.push(task);
    
    // Check if workflow step already exists
    const existingWorkflowStep = this.workflowSteps.find(s => 
      s.taskType === 'barcode_generation' && 
      s.taskData?.itemId === itemId && 
      s.taskData?.itemIndex === itemIndex
    );
    
    if (!existingWorkflowStep) {
      // Add to main workflow steps
      this.workflowSteps.push({
        id: task.id,
        name: `Barcode Generation - ${itemName}`,
        status: 'pending',
        assignee: null,
        estimatedTime: task.estimatedTime,
        description: task.description,
        taskType: 'barcode_generation',
        taskData: task
      });
    }

    // Auto-assign to available warehouse worker
    this.autoAssignBarcodeTask(task);
  }

  // Auto-assign barcode task to available worker
  autoAssignBarcodeTask(task: any): void {
    // Find workers who can handle barcode tasks (typically store keepers or material handlers)
    const availableWorkers = this.warehouseWorkers.filter(w => 
      w.designation === 'Store Keeper' || 
      w.designation === 'Material Handler' || 
      w.designation === 'Warehouse Supervisor'
    );

    if (availableWorkers.length > 0) {
      const assignedWorker = availableWorkers[0];
      task.assignedWorker = assignedWorker.id;
      task.assignedWorkerName = assignedWorker.name;
      task.status = 'assigned';

      // Add to assigned tasks
      this.assignedTasks.push({
        id: task.id,
        type: 'barcode_generation',
        workerId: assignedWorker.id,
        workerName: assignedWorker.name,
        assignedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + task.estimatedTime * 60000).toISOString(),
        status: 'assigned',
        taskData: task
      });

      // Update workflow step
      const workflowStep = this.workflowSteps.find(s => s.id === task.id);
      if (workflowStep) {
        workflowStep.assignee = assignedWorker.name;
        workflowStep.status = 'assigned';
      }
    }
  }

  // Print barcodes for the current item
  printBarcodes(): void {
    if (!this.currentItemForBarcode) {
      this.toast.show('Error', 'No item selected for barcode printing', 'warning');
      return;
    }

    // Check if JsBarcode is available
    if (!(window as any).JsBarcode) {
      this.toast.show('Error', 'Barcode library not loaded. Please refresh the page and try again.', 'danger');
      return;
    }

    this.toast.show('Info', 'Preparing barcodes for printing...', 'info');

    try {
      // Generate barcode HTML template
      this.generateBarcodeTemplate();

      // Try multiple approaches for printing
      this.attemptPrint();
      
    } catch (error) {
      console.error('Print preparation error:', error);
      this.toast.show('Error', 'Failed to prepare barcodes for printing', 'danger');
    }
  }

  // Attempt different print methods
  private attemptPrint(): void {
    // Method 1: Try opening a new window
    try {
      const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
      
      if (printWindow && !printWindow.closed) {
        console.log('Print window opened successfully');
        
        printWindow.document.open();
        printWindow.document.write(this.barcodeTemplate);
        printWindow.document.close();
        
        // Focus the window
        printWindow.focus();
        
        // Mark task as completed
        this.completeBarcodeTask();
        
        this.toast.show('Success', 'Print window opened successfully!', 'success');
        return;
      }
    } catch (error) {
      console.error('Method 1 failed:', error);
    }

    // Method 2: Try with different window parameters
    try {
      const printWindow = window.open('about:blank', 'printWindow', 'width=800,height=600');
      
      if (printWindow && !printWindow.closed) {
        console.log('Print window opened with method 2');
        
        printWindow.document.write(this.barcodeTemplate);
        printWindow.document.close();
        printWindow.focus();
        
        this.completeBarcodeTask();
        this.toast.show('Success', 'Print window opened!', 'success');
        return;
      }
    } catch (error) {
      console.error('Method 2 failed:', error);
    }

    // Method 3: Create a blob and download
    try {
      const blob = new Blob([this.barcodeTemplate], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `barcodes-${this.currentItemForBarcode?.itemName || 'items'}.html`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      this.completeBarcodeTask();
      this.toast.show('Info', 'Barcode file downloaded. Open it in browser and print.', 'info');
      return;
      
    } catch (error) {
      console.error('Method 3 failed:', error);
    }

    // Method 4: Show in current window
    this.showPrintInCurrentWindow();
  }

  // Show print content in current window as fallback
  private showPrintInCurrentWindow(): void {
    // Create a temporary div
    const printDiv = document.createElement('div');
    printDiv.innerHTML = this.barcodeTemplate;
    printDiv.style.display = 'none';
    document.body.appendChild(printDiv);

    // Print the specific content
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = this.barcodeTemplate;
    
    try {
      window.print();
      this.completeBarcodeTask();
      this.toast.show('Success', 'Print dialog opened!', 'success');
    } catch (error) {
      console.error('Current window print failed:', error);
      this.toast.show('Error', 'Unable to open print dialog. Please check browser settings.', 'danger');
    } finally {
      // Restore original content
      document.body.innerHTML = originalContent;
      // Re-initialize the component
      window.location.reload();
    }
  }

  // Download barcodes as HTML file
  downloadBarcodes(): void {
    if (!this.currentItemForBarcode) {
      this.toast.show('Error', 'No item selected for barcode download', 'warning');
      return;
    }

    try {
      // Generate barcode HTML template
      this.generateBarcodeTemplate();

      // Create blob and download
      const blob = new Blob([this.barcodeTemplate], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `barcodes-${this.currentItemForBarcode.itemName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().getTime()}.html`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      this.completeBarcodeTask();
      this.toast.show('Success', 'Barcode file downloaded! Open it in browser and use Ctrl+P to print.', 'success');
      
    } catch (error) {
      console.error('Download error:', error);
      this.toast.show('Error', 'Failed to download barcode file', 'danger');
    }
  }

  // Generate barcode template for printing
  generateBarcodeTemplate(): void {
    const item = this.currentItemForBarcode;
    if (!item) return;

    // Pre-generate barcodes as base64 images
    const barcodeImages: string[] = [];
    
    item.barcodes.forEach((barcode: string, index: number) => {
      try {
        // Create a temporary canvas to generate barcode
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        
        if ((window as any).JsBarcode) {
          (window as any).JsBarcode(canvas, barcode, {
            format: "CODE128",
            width: 2,
            height: 60,
            fontSize: 0,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000",
            displayValue: false
          });
          
          // Convert canvas to base64 image
          const imageData = canvas.toDataURL('image/png');
          barcodeImages.push(imageData);
        } else {
          // Fallback - empty image
          barcodeImages.push('');
        }
      } catch (error) {
        console.error(`Error pre-generating barcode ${index}:`, error);
        barcodeImages.push('');
      }
    });

    this.barcodeTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode Print</title>
        <style>
          @page {
            margin: 5mm;
            size: A4;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .barcode-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 5mm;
            padding: 10mm;
          }
          .barcode-item {
            text-align: center;
            page-break-inside: avoid;
            padding: 8px;
            border: 1px solid #ddd;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60mm;
          }
          .barcode-image {
            max-width: 100%;
            height: auto;
            margin-bottom: 8px;
          }
          .barcode-text {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 4px;
            color: #000;
          }
          @media print {
            .barcode-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
        </style>
      </head>
      <body>
        <div class="barcode-grid">
          ${item.barcodes.map((barcode: string, index: number) => `
            <div class="barcode-item">
              ${barcodeImages[index] ? 
                `<img class="barcode-image" src="${barcodeImages[index]}" alt="Barcode ${barcode}"/>` : 
                `<div style="width:200px;height:60px;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;color:#999;">Barcode Error</div>`
              }
              <div class="barcode-text">${barcode}</div>
            </div>
          `).join('')}
        </div>
        
        <script>
          window.onload = function() {
            console.log('Print window loaded, auto-printing...');
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
  }

  // Complete barcode generation task
  completeBarcodeTask(): void {
    if (!this.currentItemForBarcode) return;

    // Update task status
    const task = this.barcodeGenerationTasks.find(t => 
      t.itemId === this.currentItemForBarcode.itemId && 
      t.itemIndex === this.currentItemForBarcode.itemIndex
    );

    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.actualTime = Math.ceil(Math.random() * task.estimatedTime); // Simulate actual time

      // Update item FormGroup with completed barcode info
      const itemForm = this.items.at(this.currentItemForBarcode.itemIndex) as FormGroup;
      itemForm.patchValue({
        barcodeGenerated: true,
        barcodeCount: this.currentItemForBarcode.barcodes.length
      });

      // Update workflow step
      const workflowStep = this.workflowSteps.find(s => s.id === task.id);
      if (workflowStep) {
        workflowStep.status = 'completed';
      }

      // Move from assigned to completed tasks
      const assignedTaskIndex = this.assignedTasks.findIndex(t => t.id === task.id);
      if (assignedTaskIndex > -1) {
        const completedTask = this.assignedTasks.splice(assignedTaskIndex, 1)[0];
        completedTask.status = 'completed';
        completedTask.completedAt = new Date().toISOString();
        this.mobileTaskCompletion.completedTasks.push(completedTask);
      }
    }

    this.closeBarcodeModal();
  }

  // Close barcode modal
  closeBarcodeModal(): void {
    this.showBarcodeModal = false;
    this.currentItemForBarcode = null;
    this.currentItemIndex = -1;
    this.barcodeTemplate = '';
  }

  // Check if item has generated barcodes
  hasGeneratedBarcodes(itemIndex: number): boolean {
    const item = this.items.at(itemIndex) as FormGroup;
    // Check form field first, then fallback to generated barcodes storage
    const formBarcodeGenerated = item.get('barcodeGenerated')?.value;
    if (formBarcodeGenerated !== undefined) {
      return formBarcodeGenerated;
    }
    
    // Fallback to checking the generated barcodes storage
    const itemId = item.get('itemId')?.value;
    const itemKey = `${itemId}_${itemIndex}`;
    return this.generatedBarcodes[itemKey] && this.generatedBarcodes[itemKey].length > 0;
  }

  // Get barcode count for an item
  getBarcodeCount(itemIndex: number): number {
    const item = this.items.at(itemIndex) as FormGroup;
    // Check form field first, then fallback to generated barcodes storage
    const formBarcodeCount = item.get('barcodeCount')?.value;
    if (formBarcodeCount !== undefined && formBarcodeCount !== null) {
      return formBarcodeCount;
    }
    
    // Fallback to checking the generated barcodes storage
    const itemId = item.get('itemId')?.value;
    const itemKey = `${itemId}_${itemIndex}`;
    return this.generatedBarcodes[itemKey] ? this.generatedBarcodes[itemKey].length : 0;
  }

  // Preview generated barcodes
  previewBarcodes(itemIndex: number): void {
    const item = this.items.at(itemIndex) as FormGroup;
    const itemId = item.get('itemId')?.value;
    const itemKey = `${itemId}_${itemIndex}`;
    const barcodes = this.generatedBarcodes[itemKey];

    if (!barcodes || barcodes.length === 0) {
      this.toast.show('Info', 'No barcodes generated for this item', 'info');
      return;
    }

    this.currentItemForBarcode = {
      itemId: itemId,
      itemName: this.itemSearchTerms[itemIndex],
      quantity: barcodes.length,
      barcodes: barcodes,
      itemIndex: itemIndex
    };
    this.currentItemIndex = itemIndex;
    this.showBarcodeModal = true;

    // Generate actual barcodes in the preview after modal opens
    setTimeout(() => {
      this.generatePreviewBarcodes();
    }, 100);
  }

  // Generate actual barcodes for preview modal
  generatePreviewBarcodes(): void {
    if (!this.currentItemForBarcode) return;

    const previewBarcodes = this.currentItemForBarcode.barcodes.slice(0, 6);
    
    previewBarcodes.forEach((barcode: string, index: number) => {
      const elementId = `preview-barcode-${index}`;
      const element = document.getElementById(elementId);
      
      if (element && (window as any).JsBarcode) {
        try {
          (window as any).JsBarcode(element, barcode, {
            format: "CODE128",
            width: 1.5,
            height: 25,
            fontSize: 0,
            margin: 1,
            background: "#ffffff",
            lineColor: "#000000"
          });
        } catch (error) {
          console.error(`Error generating preview barcode ${index}:`, error);
          element.innerHTML = '<text y="15" font-size="8" fill="red">Barcode Error</text>';
        }
      }
    });
  }

  // Get barcode task status for item
  getBarcodeTaskStatus(itemIndex: number): string {
    const item = this.items.at(itemIndex) as FormGroup;
    const itemId = item.get('itemId')?.value;
    
    const task = this.barcodeGenerationTasks.find(t => 
      t.itemId === itemId && t.itemIndex === itemIndex
    );

    return task ? task.status : 'not_generated';
  }

  // Get barcode task status badge class
  getBarcodeTaskStatusBadgeClass(itemIndex: number): string {
    const status = this.getBarcodeTaskStatus(itemIndex);
    const statusClasses: { [key: string]: string } = {
      'not_generated': 'badge bg-secondary',
      'pending': 'badge bg-warning',
      'assigned': 'badge bg-info',
      'completed': 'badge bg-success'
    };
    return statusClasses[status] || 'badge bg-secondary';
  }

  // Regenerate barcodes for an item
  regenerateBarcodes(itemIndex: number): void {
    const item = this.items.at(itemIndex) as FormGroup;
    const itemId = item.get('itemId')?.value;
    const itemKey = `${itemId}_${itemIndex}`;
    const existingBarcode = item.get('barcode')?.value;
    
    if (!existingBarcode) {
      this.toast.show('Warning', 'No barcode found for this item. Please add barcode to item master data.', 'warning');
      return;
    }
    
    // Remove existing barcodes and tasks
    delete this.generatedBarcodes[itemKey];
    
    // Reset item FormGroup barcode fields
    const itemForm = this.items.at(itemIndex) as FormGroup;
    itemForm.patchValue({
      barcodeGenerated: false,
      barcodeCount: 0
    });
    
    // Remove existing task
    const taskIndex = this.barcodeGenerationTasks.findIndex(t => 
      t.itemId === itemId && t.itemIndex === itemIndex
    );
    if (taskIndex > -1) {
      this.barcodeGenerationTasks.splice(taskIndex, 1);
    }

    // Remove from workflow steps
    const workflowIndex = this.workflowSteps.findIndex(s => 
      s.taskType === 'barcode_generation' && 
      s.taskData?.itemId === itemId && 
      s.taskData?.itemIndex === itemIndex
    );
    if (workflowIndex > -1) {
      this.workflowSteps.splice(workflowIndex, 1);
    }

    // Generate new barcodes using existing barcode
    this.generateBarcodesForItem(itemIndex);
    
    this.toast.show('Info', `Barcodes regenerated using existing code: ${existingBarcode}`, 'info');
  }

  // Bulk barcode generation for all items
  generateAllBarcodes(): void {
    let generatedCount = 0;
    let skippedCount = 0;
    let noBarcodeCount = 0;
    
    this.items.controls.forEach((item: AbstractControl, index: number) => {
      const formGroup = item as FormGroup;
      const itemId = formGroup.get('itemId')?.value;
      const existingBarcode = formGroup.get('barcode')?.value;
      
      if (!itemId) return;
      
      // Check if barcodes already exist for this item
      const itemKey = `${itemId}_${index}`;
      const existingTask = this.barcodeGenerationTasks.find(t => 
        t.itemId === itemId && t.itemIndex === index
      );
      
      if (existingTask || this.generatedBarcodes[itemKey]) {
        skippedCount++;
        return;
      }
      
      if (!existingBarcode) {
        noBarcodeCount++;
        return;
      }
      
      // Generate barcodes for this item
      const quantity = formGroup.get('quantity')?.value || 1;
      const itemName = this.itemSearchTerms[index] || `Item ${index + 1}`;
      const barcodes: string[] = [];
      
      for (let i = 1; i <= quantity; i++) {
        const sequentialBarcode = `${existingBarcode}`;
        barcodes.push(sequentialBarcode);
      }
      
      // Store generated barcodes
      this.generatedBarcodes[itemKey] = barcodes;
      
      // Update item FormGroup with barcode info
      const itemForm = this.items.at(index) as FormGroup;
      itemForm.patchValue({
        barcodeGenerated: true,
        barcodeCount: barcodes.length
      });
      
      // Create barcode generation task (with duplicate check)
      this.createBarcodeGenerationTask(index, itemId, itemName, quantity, barcodes);
      
      generatedCount++;
    });

    // Show summary message
    let message = '';
    if (generatedCount > 0) {
      message += `Barcodes generated for ${generatedCount} items. `;
    }
    if (skippedCount > 0) {
      message += `${skippedCount} items already have barcodes. `;
    }
    if (noBarcodeCount > 0) {
      message += `${noBarcodeCount} items skipped (no barcode in master data).`;
    }
    
    if (generatedCount > 0) {
      this.toast.show('Success', message, 'success');
    } else if (noBarcodeCount > 0) {
      this.toast.show('Warning', message, 'warning');
    } else {
      this.toast.show('Info', message || 'All items already have barcodes generated', 'info');
    }
  }

  // Check if any barcode tasks are pending
  hasPendingBarcodeTasks(): boolean {
    return this.barcodeGenerationTasks.some(task => task.status !== 'completed');
  }

  // Get total barcode tasks count
  getTotalBarcodeTasksCount(): number {
    return this.barcodeGenerationTasks.length;
  }

  // Get completed barcode tasks count
  getCompletedBarcodeTasksCount(): number {
    return this.barcodeGenerationTasks.filter(task => task.status === 'completed').length;
  }

  // Calculate the total net amount (sum of all custom charges and totalAmount)
  calculateTotalNet(): number {
    const f = this.form;
    return (
      Number(f.get('customs_Payable')?.value || 0) +
      Number(f.get('insurance_Payable')?.value || 0) +
      Number(f.get('demurage')?.value || 0) +
      Number(f.get('freight_Payable')?.value || 0) +
      Number(f.get('port_Charge_Payable')?.value || 0) +
      Number(f.get('carriage_Inwards')?.value || 0) +
      Number(f.get('thc_Charges')?.value || 0) +
      Number(f.get('bank_Charge_Payable')?.value || 0) +
      Number(f.get('misc_Others')?.value || 0) +
      Number(f.get('totalAmount')?.value || 0)
    );
  }

  // Placeholder for amount in words (implement conversion as needed)
  amountInWords: string = 'USD Two Hundred Twelve Thousand Eight Hundred Twenty Four and Fifty One Pounds Only';

  // Placeholder for current user name (replace with actual user logic)
  currentUserName: string = 'Pitchai';
}