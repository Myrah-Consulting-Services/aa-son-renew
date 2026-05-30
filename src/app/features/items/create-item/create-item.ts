import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../../core/services/api';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-create-item',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    NgbTooltipModule,
    FormsModule
  ],
  templateUrl: './create-item.html',
  styleUrl: './create-item.scss'
})
export class CreateItem implements OnInit {
  @Input() modalRef: any;
  @Input() itemId: number | null = null; // Add itemId input for edit mode
  @Output() addItem = new EventEmitter<any>();
  itemForm!: FormGroup;
  

  categoryForm!: FormGroup;
  brandForm!: FormGroup;
  batchForm!: FormGroup;
  batchCategoryForm!: FormGroup;
  catModal: any;
  brandModal: any;
  batchModal: any;
  batchCategoryModal: any;
  activeTab: 'item' | 'batch' = 'item';
  itemModal: any; // Add modal reference for the main item form
  
  // Batch related properties
  batchArray!: FormArray;
  batchCategories: any[] = [
    { id: 1, name: 'Default Category', has_custom_column: false, custom_column: [] },
    { id: 2, name: 'Pharmaceutical', has_custom_column: true, custom_column: [
      { title: 'Strength', inputs: '10mg,20mg,50mg' },
      { title: 'Form', inputs: 'Tablet,Capsule,Syrup' }
    ]},
    { id: 3, name: 'Electronics', has_custom_column: true, custom_column: [
      { title: 'Model', inputs: 'A1,B2,C3' },
      { title: 'Color', inputs: 'Black,White,Red' }
    ]}
  ];
  customColumns: any[] = [];
  selectedValues: any[] = [];
  isEditBatch: boolean = false;
  editingBatchIndex: number = -1;
  
  // Dropdown options
  itemTypes = [
    { id: 1, name: 'Product' },
    { id: 2, name: 'Service' }
  ];

  itemCategories: any[] = [];

  itemBrands: any[] = [];

  units: any[] = [];

  showOtherUnit = false;

  // Dimension unit options
  dimensionUnits = [
    {id: 1, value: 'cm', label: 'Centimeters (cm)' },
    {id: 2, value: 'mm', label: 'Millimeters (mm)' },
    {id: 3, value: 'm', label: 'Meters (m)' },
    {id: 4, value: 'inch', label: 'Inches (inch)' },
    {id: 5, value: 'ft', label: 'Feet (ft)' }
  ];

  // Weight unit options
  weightUnits = [
    { id: 1, value: 'kg', label: 'Kilograms (kg)' },
    { id: 2, value: 'g', label: 'Grams (g)' },
    { id: 3, value: 'lb', label: 'Pounds (lb)' },
    { id: 4, value: 'oz', label: 'Ounces (oz)' }
  ];

  saleTypes = [
    { id: 1, name: 'Without Tax' },
    { id: 2, name: 'With Tax' }
  ];

  purchaseTypes = [
    { id: 1, name: 'Without Tax' },
    { id: 2, name: 'With Tax' }
  ];

  vatCategories = [
    { id: 1, name: 'Standard Rate' },
    { id: 2, name: 'Zero Rate' },
    { id: 3, name: 'Exempt' }
  ];

  // Collapsible sections state
  sections = {
    unitDimensions: false,
    alternateUnitDimensions: false,
    inventoryValuation: false,
    identificationBarcode: false,
    perishableVolume: false
  };

  imagePreview: string | ArrayBuffer | null = null;
  imageFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private api: Api,
    private toast: ToastService
  ) {}

  // Toggle section visibility
  toggleSection(sectionName: keyof typeof this.sections) {
    this.sections[sectionName] = !this.sections[sectionName];
  }

  ngOnInit() {
    let a=this.api.getUserCompany()
    console.log(a);
    

    
    this.initForm();
    this.initCategoryForm();
    this.initBrandForm();
    this.initBatchForm();
    this.initBatchCategoryForm();
    this.loadCategories(); // Load categories from API
    this.loadBrands(); // Load brands from API
    this.loadUnits(); // Load units from API
    console.log('itemId', this.itemId);
    // Check if we're in edit mode and load item data
    if (this.itemId) {
      this.loadItemData();
    }
  }

  // Load categories from API
  loadCategories() {
    this.api.get('/items/list-item-category/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Categories loaded successfully:', response);
        if (response.data && Array.isArray(response.data)) {
          this.itemCategories = response.data;
          this.itemForm.patchValue({
            item_category:this.itemCategories[0].id
          })
          // this.toast.show('Success', 'Categories loaded successfully', 'success');
        } else if (Array.isArray(response)) {
          this.itemCategories = response;
          // this.toast.show('Success', 'Categories loaded successfully', 'success');
        } else {
          console.warn('Unexpected response format for categories:', response);
          this.itemCategories = []; // Fallback to empty array
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toast.show('Error', 'Failed to load categories', 'danger');
      }
    });
  }

  // Load brands from API
  loadBrands() {
    this.api.get('/items/list-brand/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Brands loaded successfully:', response);
        if (response.data && Array.isArray(response.data)) {
          this.itemBrands = response.data;
          this.itemForm.patchValue({
            item_brand:this.itemBrands[0].id
          })
          // this.toast.show('Success', 'Brands loaded successfully', 'success');
        } else if (Array.isArray(response)) {
          this.itemBrands = response;
          // this.toast.show('Success', 'Brands loaded successfully', 'success');
        } else {
          console.warn('Unexpected response format for brands:', response);
          this.itemBrands = []; // Fallback to empty array
        }
      },
      error: (error) => {
        console.error('Error loading brands:', error);
        this.toast.show('Error', 'Failed to load brands', 'danger');
      }
    });
  }

  // Load units from API
  loadUnits() {
    this.api.get('/items/list-units/').subscribe({
      next: (response: any) => {
        console.log('Units loaded successfully:', response);
        if (response.data && Array.isArray(response.data)) {
          this.units = response.data;
          this.itemForm.patchValue({
            unit:this.units[47].id
          })
          // this.toast.show('Success', 'Units loaded successfully', 'success');
        } else if (Array.isArray(response)) {
          this.units = response;
          // this.toast.show('Success', 'Units loaded successfully', 'success');
        } else {
          console.warn('Unexpected response format for units:', response);
          this.units = []; // Fallback to empty array
        }
      },
      error: (error) => {
        console.error('Error loading units:', error);
        this.toast.show('Error', 'Failed to load units', 'danger');
        // Keep the default units as fallback
      }
    });
  }

  // Load item data for editing
  loadItemData() {
    if (!this.itemId) return;
    
    this.api.get(`/items/get-item/${this.itemId}/`).subscribe({
      next: (response: any) => {
        console.log('Item data loaded successfully:', response);
        
        if (response.data) {
          const itemData = response.data;
          
          // Patch the form with the loaded data
          this.itemForm.patchValue({
            name: itemData.name || '',
            item_type: itemData.item_type || 1,
            item_category: itemData.item_category || null,
            item_brand: itemData.item_brand || null,
            item_code: itemData.item_code || '',
            item_description: itemData.item_description || '',
            unit: itemData.unit || null,
            has_alter_unit: itemData.has_alter_unit || false,
            alternate_unit: itemData.alternate_unit || null,
            conversion_value: itemData.conversion_value || 0,
            other_unit: itemData.other_unit || '',
            is_item_name:itemData.is_item_name || false,
            is_restuarnt_item:itemData.is_restuarnt_item || false,
            // Main unit dimensions
            unit_length: itemData.unit_length,
            unit_width: itemData.unit_width,
            unit_height: itemData.unit_height,
            unit_weight: itemData.unit_weight,
            unit_dimension_unit: itemData.unit_dimension_unit,
            unit_weight_unit: itemData.unit_weight_unit,
            
            // Alternate unit dimensions
            alt_unit_length: itemData.alt_unit_length,
            alt_unit_width: itemData.alt_unit_width,
            alt_unit_height: itemData.alt_unit_height,
            alt_unit_weight: itemData.alt_unit_weight,
            alt_unit_dimension_unit: itemData.alt_unit_dimension_unit,
            alt_unit_weight_unit: itemData.alt_unit_weight_unit,
            
            sales_price: itemData.sales_price || 0,
            sale_type: itemData.sale_type,
            purchase_price: itemData.purchase_price,
            purchase_type: itemData.purchase_type,
            hsn_code: itemData.hsn_code || '',
            vat_category: itemData.vat_category || 1,
            vat_per: itemData.vat_per,
            imported: itemData.imported || false,
            country: itemData.country || null,
            imported_value: itemData.imported_value || 0,
            has_batches: itemData.has_batches || false,
            has_batch_category: itemData.has_batch_category || false,
            batch_category: itemData.batch_category || null,
            has_custom_column: itemData.has_custom_column || false,
            company: itemData.company || 1,
            id: itemData.id || null,
            reorder_level: itemData.reorder_level || null,
            valuation_method: itemData.valuation_method || '',
            group: itemData.group || false,
            parent_code: itemData.parent_code || '',
            alternate_category: itemData.alternate_category || null,
            alternate_code: itemData.alternate_code || '',
            barcode1: itemData.barcode1 || '',
            item_make: itemData.item_make || '',
            printer: itemData.printer || '',
            is_perishable: itemData.is_perishable || false,
            volume: itemData.volume || null,
            image: itemData.image || null,
          });

          // Set image preview for edit mode
          if (itemData.image) {
            // TODO: Change the base URL to your actual image server path if needed
            this.imagePreview = itemData.image.startsWith('http')
              ? itemData.image
              : 'https://your-server.com/path/to/images/' + itemData.image;
          }

          // Handle batch data if exists
          if (itemData.batch_detail && Array.isArray(itemData.batch_detail)) {
            this.batchArray.clear();
            itemData.batch_detail.forEach((batch: any) => {
              this.batchArray.push(this.fb.group(batch));
            });
          }

          // Handle custom columns if exists
          if (itemData.custom_column && Array.isArray(itemData.custom_column)) {
            const customColumnArray = this.itemForm.get('custom_column') as FormArray;
            customColumnArray.clear();
            itemData.custom_column.forEach((col: any) => {
              customColumnArray.push(this.fb.group(col));
            });
          }

          // Handle unit selection
          if (itemData.unit) {
            this.handleUnitSelection(itemData.unit);
          }



          // Handle batch category change if exists
          if (itemData.batch_category) {
            this.handleBatchCategoryChange(itemData.batch_category);
          }

          console.log('Form populated with item data');
          // this.toast.show('Success', 'Item data loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading item data:', error);
        this.toast.show('Error', 'Failed to load item data', 'danger');
      }
    });
  }

  private initForm() {
    this.itemForm = this.fb.group({
      name: ['', [Validators.required]],
      item_type: [1, [Validators.required]],
      item_category: [null],
      item_brand: [null],
      item_code: ['', [Validators.required]],
      item_description: [''],
      unit: [null, [Validators.required]],
      has_alter_unit: [false],
      alternate_unit: [],
      conversion_value: [0],
      other_unit: [''],
      
      // Main unit dimensions
      unit_length: [0, [Validators.min(0)]],
      unit_width: [0, [Validators.min(0)]],
      unit_height: [0, [Validators.min(0)]],
      unit_weight: [0, [Validators.min(0)]],
      unit_dimension_unit: ['1'], // cm, mm, m, inch, ft
      unit_weight_unit: ['1'], // kg, g, lb, oz
      
      // Alternate unit dimensions
      alt_unit_length: [0, [Validators.min(0)]],
      alt_unit_width: [0, [Validators.min(0)]],
      alt_unit_height: [0, [Validators.min(0)]],
      alt_unit_weight: [0, [Validators.min(0)]],
      alt_unit_dimension_unit: ['1'],
      alt_unit_weight_unit: ['1'],
      
      sales_price: [0, [Validators.required, Validators.min(0)]],
      sale_type: [1, [Validators.required]],
      purchase_price: [0, [Validators.required, Validators.min(0)]],
      purchase_type: [1, [Validators.required]],
      hsn_code: [''],
      vat_category: [1, [Validators.required]],
      vat_per: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
      imported: [false],
      country: [{ value: null, disabled: true }],
      imported_value: [0],
      has_batches: [false],
      batch_detail: this.fb.array([]),
      has_batch_category: [false],
      batch_category: [null],
      has_custom_column: [false],
      custom_column: this.fb.array([]),
      opening_stock: [0],
      company:[this.api.getUserCompany()],
      image: [null],
      id: [null],
      reorder_level: [null],
      valuation_method: [''],
      group: [false],
      parent_code: [''],
      alternate_category: [null],
      alternate_code: [''],
      barcode1: [''],
      item_make: [''],
      printer: [''],
      is_perishable: [false],
      volume: [null],
      

    });

    // Initialize batchArray
    this.batchArray = this.itemForm.get('batch_detail') as FormArray;

    // Watch has_alter_unit changes to enable/disable related fields
    this.itemForm.get('has_alter_unit')?.valueChanges.subscribe(hasAlterUnit => {
      const alterUnitControl = this.itemForm.get('alter_unit');
      const conversionValueControl = this.itemForm.get('conversion_value');
      
      // Enable/disable alternate unit dimension fields
      const altDimensionFields = [
        'alt_unit_length', 'alt_unit_width', 'alt_unit_height', 'alt_unit_weight',
        'alt_unit_dimension_unit', 'alt_unit_weight_unit'
      ];
      
      altDimensionFields.forEach(field => {
        const control = this.itemForm.get(field);
        if (hasAlterUnit) {
          control?.enable();
        } else {
          control?.disable();
          control?.setValue(null);
        }
      });
      
      if (hasAlterUnit) {
        alterUnitControl?.enable();
        conversionValueControl?.enable();
      } else {
        alterUnitControl?.disable();
        conversionValueControl?.disable();
        alterUnitControl?.setValue(null);
        conversionValueControl?.setValue(0);
      }
    });

    // Watch purchase_type changes to enable/disable import related fields
    this.itemForm.get('purchase_type')?.valueChanges.subscribe(type => {
      const countryControl = this.itemForm.get('country');
      const importValueControl = this.itemForm.get('imported_value');
      const importedControl = this.itemForm.get('imported');
      
      if (type === 2) { // Import
        countryControl?.enable();
        importValueControl?.enable();
        importedControl?.setValue(true);
      } else {
        countryControl?.disable();
        importValueControl?.disable();
        importedControl?.setValue(false);
        countryControl?.setValue(null);
        importValueControl?.setValue(0);
      }
    });

    // Watch item_type changes to handle service/product specific fields
    this.itemForm.get('item_type')?.valueChanges.subscribe(type => {
      if (type === 2) { // Service
        // Clear and disable product-specific fields
        this.itemForm.get('item_brand')?.setValue(null);
        this.itemForm.get('item_category')?.setValue(null);
        this.itemForm.get('unit')?.setValue(null);
        this.itemForm.get('has_alter_unit')?.setValue(false);
        this.itemForm.get('other_unit')?.setValue('');
        this.itemForm.get('purchase_price')?.setValue(0);
        this.itemForm.get('purchase_type')?.setValue(1);
        this.itemForm.get('has_batches')?.setValue(false);
        
        // Disable dimension fields for services
        const dimensionFields = [
          'unit_length', 'unit_width', 'unit_height', 'unit_weight',
          'unit_dimension_unit', 'unit_weight_unit',
          'alt_unit_length', 'alt_unit_width', 'alt_unit_height', 'alt_unit_weight',
          'alt_unit_dimension_unit', 'alt_unit_weight_unit'
        ];
        
        dimensionFields.forEach(field => {
          this.itemForm.get(field)?.disable();
          this.itemForm.get(field)?.setValue(null);
        });
        
        // Remove validators for product-specific fields
        this.itemForm.get('item_brand')?.clearValidators();
        this.itemForm.get('item_category')?.clearValidators();
        this.itemForm.get('unit')?.clearValidators();
        this.itemForm.get('purchase_price')?.clearValidators();
        this.itemForm.get('purchase_type')?.clearValidators();
        
        // Update validators
        this.itemForm.get('hsn_code')?.setValidators([]);  // SAC code is optional
      } else { // Product
        // Enable dimension fields for products
        const dimensionFields = [
          'unit_length', 'unit_width', 'unit_height', 'unit_weight',
          'unit_dimension_unit', 'unit_weight_unit'
        ];
        
        dimensionFields.forEach(field => {
          this.itemForm.get(field)?.enable();
        });
        
        // Restore product-specific validations
        this.itemForm.get('item_category')?.setValidators([]);
        this.itemForm.get('unit')?.setValidators([Validators.required]);
        this.itemForm.get('purchase_price')?.setValidators([Validators.required, Validators.min(0)]);
        this.itemForm.get('purchase_type')?.setValidators([Validators.required]);
        
        // Update validators
        this.itemForm.get('hsn_code')?.setValidators([]);  // HSN code is optional
      }
      
      // Update validation status
      this.itemForm.get('item_brand')?.updateValueAndValidity();
      this.itemForm.get('item_category')?.updateValueAndValidity();
      this.itemForm.get('unit')?.updateValueAndValidity();
      this.itemForm.get('purchase_price')?.updateValueAndValidity();
      this.itemForm.get('purchase_type')?.updateValueAndValidity();
      this.itemForm.get('hsn_code')?.updateValueAndValidity();
    });

    // Watch unit changes to handle OTH - OTHERS logic
    this.itemForm.get('unit')?.valueChanges.subscribe(unitId => {
      this.handleUnitSelection(Number(unitId));
    });

    // Watch has_batches changes to handle batch tab
    this.itemForm.get('has_batches')?.valueChanges.subscribe(hasBatches => {
      if (hasBatches) {
        // Add a sample batch if none exists
        if (this.batchArray.length === 0) {
          this.addSampleBatch();
        }
      } else {
        // Clear all batches
        this.batchArray.clear();
      }
    });

    // Watch batch_category changes to handle custom columns
    this.itemForm.get('batch_category')?.valueChanges.subscribe(categoryId => {
      this.handleBatchCategoryChange(categoryId);
    });
  }

  // Method to handle unit selection logic
  private handleUnitSelection(unitId: number) {
    if (unitId === 30) { // OTH - OTHERS selected
      // Show other unit input
      this.showOtherUnit = true;
      
      // Disable and uncheck alternative unit checkbox
      this.itemForm.get('has_alter_unit')?.disable();
      this.itemForm.get('has_alter_unit')?.setValue(false);
      
      // Clear alternative unit selections
      this.itemForm.get('alter_unit')?.setValue(null);
      this.itemForm.get('conversion_value')?.setValue(0);
      
    } else { // Any other unit selected
      // Hide other unit input
      this.showOtherUnit = false;
      
      // Enable alternative unit checkbox
      this.itemForm.get('has_alter_unit')?.enable();
      
      // Clear other unit input
      this.itemForm.get('other_unit')?.setValue('');
    }
  }

  // Method to handle batch category change
  private handleBatchCategoryChange(categoryId: number) {
    if (categoryId) {
      const category = this.batchCategories.find(cat => cat.id === categoryId);
      if (category) {
        this.itemForm.get('has_custom_column')?.setValue(category.has_custom_column);
        this.customColumns = category.custom_column || [];
        
        // Update custom column form array
        const customColumnArray = this.itemForm.get('custom_column') as FormArray;
        customColumnArray.clear();
        
        if (category.has_custom_column && category.custom_column) {
          category.custom_column.forEach((col: any) => {
            customColumnArray.push(this.fb.group({
              title: [col.title],
              inputs: [col.inputs]
            }));
          });
        }
        
        // Update existing batches with new selectedValues structure
        this.batchArray.controls.forEach(batchControl => {
          const currentValues = batchControl.get('selectedValues')?.value || [];
          const newValues = this.customColumns.map(() => null);
          
          // Preserve existing values if they exist and are still valid
          this.customColumns.forEach((col, index) => {
            if (currentValues[index]) {
              // Check if the value is still valid for the new column
              const validOptions = col.inputs.split(',').map((opt: string) => opt.trim());
              if (validOptions.includes(currentValues[index])) {
                newValues[index] = currentValues[index];
              }
            }
          });
          
          batchControl.get('selectedValues')?.setValue(newValues);
        });
        
        console.log('Batch category changed to:', category.name);
        console.log('Custom columns updated:', this.customColumns);
        
        // Refresh the batch table to show updated custom columns
        this.refreshBatchTable();
      }
    } else {
      this.itemForm.get('has_custom_column')?.setValue(false);
      this.customColumns = [];
      const customColumnArray = this.itemForm.get('custom_column') as FormArray;
      customColumnArray.clear();
      
      // Clear selectedValues for all batches
      this.batchArray.controls.forEach(batchControl => {
        batchControl.get('selectedValues')?.setValue([]);
      });
    }
  }

  // Add sample batch for demonstration
  private addSampleBatch() {
    const sampleBatch = this.fb.group({
      batch_no: ['B001'],
      batch_code: ['C001'],
      manufacturing_date: ['2024-01-01'],
      expiry_date: ['2025-01-01'],
      sales_price: [100],
      purchase_price: [80],
      discount: [5],
      quantity: [100],
      selectedValues: [this.customColumns.map(() => null)] // Initialize with null values for each custom column
    });
    this.batchArray.push(sampleBatch);
  }

  // Public method that can be called from template if needed
  onUnitChange(event: any) {
    const unitId = event.target.value;
    this.handleUnitSelection(Number(unitId));
  }

  private initCategoryForm() {
    this.categoryForm = this.fb.group({
      CategoryName: ['', [Validators.required]]
    });
  }

  private initBrandForm() {
    this.brandForm = this.fb.group({
      BrandName: ['', [Validators.required]]
    });
  }

  private initBatchForm() {
    this.batchForm = this.fb.group({
      batch_no: ['', [Validators.required]],
      batch_code: [''],
      manufacturing_date: [''],
      expiry_date: [''],
      sales_price: [0, [Validators.required, Validators.min(0)]],
      purchase_price: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      selectedValues: [[]]
    });
  }

  private initBatchCategoryForm() {
    this.batchCategoryForm = this.fb.group({
      category_name: ['', [Validators.required]],
      has_custom_column: [false],
      custom_column: this.fb.array([])
    });

    // Watch has_custom_column changes
    this.batchCategoryForm.get('has_custom_column')?.valueChanges.subscribe(hasCustomColumn => {
      if (hasCustomColumn) {
        this.addCustomColumn();
      } else {
        const customColumnArray = this.batchCategoryForm.get('custom_column') as FormArray;
        customColumnArray.clear();
      }
    });
  }

  get customColumnArray() {
    return this.batchCategoryForm.get('custom_column') as FormArray;
  }

  addCustomColumn() {
    const customColumnArray = this.batchCategoryForm.get('custom_column') as FormArray;
    customColumnArray.push(this.fb.group({
      title: ['', [Validators.required]],
      inputs: ['', [Validators.required]],
      chips: [[]] // Array to store individual chips
    }));
  }

  removeCustomColumn(index: number) {
    const customColumnArray = this.batchCategoryForm.get('custom_column') as FormArray;
    customColumnArray.removeAt(index);
  }

  // Chip functionality methods
  addBatchCol() {
    // This method is called when the checkbox changes
    // The logic is already handled in the valueChanges subscription
  }

  getChipsForColumn(columnIndex: number): string[] {
    const column = this.customColumnArray.at(columnIndex);
    if (column) {
      const chips = column.get('chips')?.value || [];
      return chips;
    }
    return [];
  }

  removeChip(columnIndex: number, chipIndex: number) {
    const column = this.customColumnArray.at(columnIndex);
    if (column) {
      const chips = column.get('chips')?.value || [];
      chips.splice(chipIndex, 1);
      column.get('chips')?.setValue(chips);
      
      // Update the inputs field with comma-separated values
      column.get('inputs')?.setValue(chips.join(','));
    }
  }

  addChip(event: any, columnIndex: number) {
    const value = event.target.value.trim();
    if (value) {
      this.addChipValue(value, columnIndex);
      event.target.value = '';
    }
  }

  addChipOnBlur(event: any, columnIndex: number) {
    const value = event.target.value.trim();
    if (value) {
      this.addChipValue(value, columnIndex);
      event.target.value = '';
    }
  }

  addChipFromButton(columnIndex: number) {
    // This would typically get the value from an input field
    // For now, we'll add a placeholder value
    const value = prompt('Enter a value for the chip:');
    if (value && value.trim()) {
      this.addChipValue(value.trim(), columnIndex);
    }
  }

  private addChipValue(value: string, columnIndex: number) {
    const column = this.customColumnArray.at(columnIndex);
    if (column) {
      const chips = column.get('chips')?.value || [];
      
      // Check if chip already exists
      if (!chips.includes(value)) {
        chips.push(value);
        column.get('chips')?.setValue(chips);
        
        // Update the inputs field with comma-separated values
        column.get('inputs')?.setValue(chips.join(','));
      }
    }
  }

  // Category creation methods
  createCategory(createCategory: any): void {
    this.catModal = this.modalService.open(createCategory, { 
      size: "lg", 
      centered: true, 
      keyboard: false, 
      backdrop: 'static' 
    });
    this.categoryForm.reset();
  }

  createBrand(createBrand: any): void {
    this.brandModal = this.modalService.open(createBrand, { 
      size: "lg", 
      centered: true, 
      keyboard: false, 
      backdrop: 'static' 
    });
    this.brandForm.reset();
  }

  closeModal(type: 'category' | 'brand' = 'category') {
    if (type === 'category' && this.catModal) {
      this.catModal.close();
    } else if (type === 'brand' && this.brandModal) {
      this.brandModal.close();
    }
  }

  createCat() {
    if (this.categoryForm.valid) {
      const payload = {
        company:  this.api.getUserCompany(),
        name: this.categoryForm.value.CategoryName
      };

      this.api.post('/items/create-item-category/', payload).subscribe({
        next: (response: any) => {
          console.log('Category created successfully:', response);
          
          // Close modal and reset form
          this.catModal.close();
          this.categoryForm.reset();
          
          // Refresh the categories list from API
          this.loadCategories();
          
          // Show success message
          this.toast.show('Success', 'Category created successfully', 'success');
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.toast.show('Error', 'Failed to create category', 'danger');
        }
      });
    }
  }

  createBrandSubmit() {
    if (this.brandForm.valid) {
      const payload = {
        company: this.api.getUserCompany(),
        name: this.brandForm.value.BrandName
      };

      this.api.post('/items/create-brand/', payload).subscribe({
        next: (response: any) => {
          console.log('Brand created successfully:', response);
          
          // Close modal and reset form
          this.brandModal.close();
          this.brandForm.reset();
          
          // Refresh the brands list from API
          this.loadBrands();
          
          // Show success message
          this.toast.show('Success', 'Brand created successfully', 'success');
        },
        error: (error) => {
          console.error('Error creating brand:', error);
          this.toast.show('Error', 'Failed to create brand', 'danger');
        }
      });
    }
  }

  // Batch creation methods
  createBatch(batchModal: any) {
    this.isEditBatch = false;
    this.editingBatchIndex = -1;
    this.batchForm.reset();
    
    // Initialize selectedValues based on current custom columns
    const initialSelectedValues = this.customColumns.map(() => null);
    
    this.batchForm.patchValue({
      sales_price: 0,
      purchase_price: 0,
      discount: 0,
      quantity: 0,
      selectedValues: initialSelectedValues
    });
    
    this.batchModal = this.modalService.open(batchModal, { 
      size: "lg", 
      centered: true, 
      keyboard: false, 
      backdrop: 'static' 
    });
  }

  editBatch(batchModal: any, batch: any, index: number) {
    this.isEditBatch = true;
    this.editingBatchIndex = index;
    
    // Ensure selectedValues is properly initialized based on current custom columns
    const currentValues = batch.selectedValues || [];
    const newValues = this.customColumns.map(() => null);
    
    // Map existing values to new structure
    this.customColumns.forEach((col, index) => {
      if (currentValues[index]) {
        newValues[index] = currentValues[index];
      }
    });
    
    this.batchForm.patchValue({
      ...batch,
      selectedValues: newValues
    });
    
    this.batchModal = this.modalService.open(batchModal, { 
      size: "lg", 
      centered: true, 
      keyboard: false, 
      backdrop: 'static' 
    });
  }

  submitBatch() {
    if (this.batchForm.valid) {
      const batchData = this.batchForm.value;
      
      if (this.isEditBatch && this.editingBatchIndex >= 0) {
        // Update existing batch
        this.batchArray.at(this.editingBatchIndex).patchValue(batchData);
        console.log('Batch updated:', batchData);
      } else {
        // Add new batch
        const newBatch = this.fb.group(batchData);
        this.batchArray.push(newBatch);
        console.log('Batch created:', batchData);
      }
      
      this.batchModal.close();
      this.batchForm.reset();
      this.isEditBatch = false;
      this.editingBatchIndex = -1;
    }
  }

  deleteBatch(index: number) {
    if (confirm('Are you sure you want to delete this batch?')) {
      this.batchArray.removeAt(index);
      console.log('Batch deleted at index:', index);
    }
  }

  closeBatchModal() {
    this.batchModal.close();
    this.batchForm.reset();
    this.isEditBatch = false;
    this.editingBatchIndex = -1;
  }

  // Batch category methods
  createBatchCategory(batchCatModal: any) {
    this.batchCategoryModal = this.modalService.open(batchCatModal, { 
      size: "lg", 
      centered: true, 
      keyboard: false, 
      backdrop: 'static' 
    });
    this.batchCategoryForm.reset();
  }

  submitBatchCategory() {
    if (this.batchCategoryForm.valid) {
      const categoryData = this.batchCategoryForm.value;
      
      // Process custom columns to convert chips to comma-separated strings
      const processedCustomColumns = categoryData.custom_column.map((col: any) => ({
        title: col.title,
        inputs: col.chips ? col.chips.join(',') : col.inputs
      }));
      
      const newCategory = {
        id: this.batchCategories.length + 1,
        name: categoryData.category_name,
        has_custom_column: categoryData.has_custom_column,
        custom_column: processedCustomColumns
      };
      
      this.batchCategories.push(newCategory);
      
      // Set the newly created category as selected
      this.itemForm.get('batch_category')?.setValue(newCategory.id);
      
      // Trigger the batch category change handler to update custom columns
      this.handleBatchCategoryChange(newCategory.id);
      
      console.log('Batch category created:', newCategory);
      this.batchCategoryModal.close();
      this.batchCategoryForm.reset();
    }
  }

  closeBatchCategoryModal() {
    this.batchCategoryModal.close();
    this.batchCategoryForm.reset();
  }

  public openBatchCategoryModal(modal: any) {
    this.createBatchCategory(modal);
  }

  // Handle custom column value changes
  onCustomColumnChange(event: any, columnIndex: number) {
    const selectedValue = event.target.value;
    const currentValues = this.batchForm.get('selectedValues')?.value || [];
    
    // Update the selected values array
    currentValues[columnIndex] = selectedValue;
    this.batchForm.get('selectedValues')?.setValue(currentValues);
  }

  // Method to refresh batch table display
  private refreshBatchTable() {
    // Force change detection by updating the batch array
    const currentBatches = this.batchArray.value;
    this.batchArray.clear();
    currentBatches.forEach((batch: any) => {
      this.batchArray.push(this.fb.group(batch));
    });
  }

  onSubmit() {
    if (this.itemForm.valid) {
      const formData = new FormData();
      const formValue = this.itemForm.getRawValue(); // get all values, including disabled
      console.log(formValue,'formValue',this.itemForm.getRawValue());
      // Append all primitive fields
      Object.keys(formValue).forEach(key => {
        // Handle file/image field
        if (key === 'image' && this.imageFile) {
          formData.append('image', this.imageFile);
        }
        // Handle arrays/objects (serialize as JSON)
        else if (Array.isArray(formValue[key]) || (typeof formValue[key] === 'object' && formValue[key] !== null)) {
          formData.append(key, JSON.stringify(formValue[key]));
        }
        // Handle normal fields
        else if (formValue[key] !== null && formValue[key] !== undefined) {
          formData.append(key, formValue[key]);
        }
      });
      console.log(formValue,'formValue1',this.itemForm.getRawValue());

      if (this.itemId) {
        this.api.put2('/items/update-item/', formData).subscribe({
          next: (response: any) => {
            console.log('Item updated successfully:', response);
            if (response.status === 200) {
              this.addItem.emit(response.data);
              this.toast.show('Success', 'Item updated successfully', 'success');
              if (this.itemModal) {
                this.itemModal.close(); 
              }
            } else {
              this.toast.show('Error', 'Failed to update item', 'danger');
            }
          },
          error: (error) => {
            console.error('Error updating item:', error);
            this.toast.show('Error', 'Failed to update item', 'danger');
          }
        });
      } else {
        this.api.post2('/items/create-item/', formData).subscribe({
          next: (response: any) => {
            console.log('Item created successfully:', response);
            if (response.status === 200) {
              this.addItem.emit(response.data);
              this.toast.show('Success', 'Item created successfully', 'success');
              if (this.itemModal) {
                this.itemModal.close();
              }
            } else {
              this.toast.show('Error', 'Failed to create item', 'danger');
            }
          },
          error: (error) => {
            console.error('Error creating item:', error);
            this.toast.show('Error', 'Failed to create item', 'danger');
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.itemForm);
      this.toast.show('Error', 'Please fill all required fields correctly', 'danger');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Method to set modal reference when component is opened in modal
  setModalReference(modal: any) {
    this.itemModal = modal;
  }

  onImageSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.imageFile = file;
      console.log(file,'i');
      this.itemForm.patchValue({ image: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = reader.result;
        // Save the base64 string in the form control 'image'
        // this.itemForm.patchValue({ image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }

  // ====================================
  // DIMENSION HELPER METHODS
  // ====================================

  // Calculate volume for main unit
  calculateMainUnitVolume(): number {
    const length = this.itemForm.get('unit_length')?.value || 0;
    const width = this.itemForm.get('unit_width')?.value || 0;
    const height = this.itemForm.get('unit_height')?.value || 0;
    
    if (length > 0 && width > 0 && height > 0) {
      return length * width * height;
    }
    return 0;
  }

  // Calculate volume for alternate unit
  calculateAltUnitVolume(): number {
    const length = this.itemForm.get('alt_unit_length')?.value || 0;
    const width = this.itemForm.get('alt_unit_width')?.value || 0;
    const height = this.itemForm.get('alt_unit_height')?.value || 0;
    
    if (length > 0 && width > 0 && height > 0) {
      return length * width * height;
    }
    return 0;
  }

  // Get volume with unit for main unit
  getMainUnitVolumeWithUnit(): string {
    const volume = this.calculateMainUnitVolume();
    const dimensionUnit = this.itemForm.get('unit_dimension_unit')?.value || 'cm';
    
    if (volume > 0) {
      const unitLabel = this.getDimensionUnitLabel(dimensionUnit);
      return `${volume.toFixed(2)} ${unitLabel}³`;
    }
    return 'Not specified';
  }

  // Get volume with unit for alternate unit
  getAltUnitVolumeWithUnit(): string {
    const volume = this.calculateAltUnitVolume();
    const dimensionUnit = this.itemForm.get('alt_unit_dimension_unit')?.value || 'cm';
    
    if (volume > 0) {
      const unitLabel = this.getDimensionUnitLabel(dimensionUnit);
      return `${volume.toFixed(2)} ${unitLabel}³`;
    }
    return 'Not specified';
  }

  // Get dimension unit label
  getDimensionUnitLabel(unit: string): string {
    const unitObj = this.dimensionUnits.find(u => u.value === unit);
    return unitObj ? unitObj.value.toUpperCase() : unit.toUpperCase();
  }

  // Get weight unit label
  getWeightUnitLabel(unit: string): string {
    const unitObj = this.weightUnits.find(u => u.value === unit);
    return unitObj ? unitObj.value.toUpperCase() : unit.toUpperCase();
  }

  // Auto-calculate volume when dimensions change
  onMainUnitDimensionChange(): void {
    const volume = this.calculateMainUnitVolume();
    if (volume > 0) {
      this.itemForm.patchValue({ volume: volume });
    }
  }

  // Convert dimensions between units
  convertDimension(value: number, fromUnit: string, toUnit: string): number {
    if (!value || fromUnit === toUnit) return value;

    // Conversion factors to cm
    const toCmFactors: { [key: string]: number } = {
      'mm': 0.1,
      'cm': 1,
      'm': 100,
      'inch': 2.54,
      'ft': 30.48
    };

    // Convert to cm first
    const cmValue = value * (toCmFactors[fromUnit] || 1);
    
    // Convert from cm to target unit
    const toCmFactor = toCmFactors[toUnit] || 1;
    return cmValue / toCmFactor;
  }

  // Convert weight between units
  convertWeight(value: number, fromUnit: string, toUnit: string): number {
    if (!value || fromUnit === toUnit) return value;

    // Conversion factors to kg
    const toKgFactors: { [key: string]: number } = {
      'g': 0.001,
      'kg': 1,
      'lb': 0.453592,
      'oz': 0.0283495
    };

    // Convert to kg first
    const kgValue = value * (toKgFactors[fromUnit] || 1);
    
    // Convert from kg to target unit
    const toKgFactor = toKgFactors[toUnit] || 1;
    return kgValue / toKgFactor;
  }

  // Auto-convert dimensions when unit changes
  onMainUnitDimensionUnitChange(): void {
    const currentUnit = this.itemForm.get('unit_dimension_unit')?.value;
    const newUnit = this.itemForm.get('unit_dimension_unit')?.value;
    
    if (currentUnit && newUnit && currentUnit !== newUnit) {
      const length = this.itemForm.get('unit_length')?.value;
      const width = this.itemForm.get('unit_width')?.value;
      const height = this.itemForm.get('unit_height')?.value;
      
      if (length) {
        const convertedLength = this.convertDimension(length, currentUnit, newUnit);
        this.itemForm.patchValue({ unit_length: convertedLength });
      }
      
      if (width) {
        const convertedWidth = this.convertDimension(width, currentUnit, newUnit);
        this.itemForm.patchValue({ unit_width: convertedWidth });
      }
      
      if (height) {
        const convertedHeight = this.convertDimension(height, currentUnit, newUnit);
        this.itemForm.patchValue({ unit_height: convertedHeight });
      }
    }
  }

  // Auto-convert weight when unit changes
  onMainUnitWeightUnitChange(): void {
    const currentUnit = this.itemForm.get('unit_weight_unit')?.value;
    const newUnit = this.itemForm.get('unit_weight_unit')?.value;
    
    if (currentUnit && newUnit && currentUnit !== newUnit) {
      const weight = this.itemForm.get('unit_weight')?.value;
      
      if (weight) {
        const convertedWeight = this.convertWeight(weight, currentUnit, newUnit);
        this.itemForm.patchValue({ unit_weight: convertedWeight });
      }
    }
  }

  // Check if all main unit dimensions are filled
  isMainUnitDimensionsComplete(): boolean {
    const length = this.itemForm.get('unit_length')?.value;
    const width = this.itemForm.get('unit_width')?.value;
    const height = this.itemForm.get('unit_height')?.value;
    
    return length > 0 && width > 0 && height > 0;
  }

  // Check if all alternate unit dimensions are filled
  isAltUnitDimensionsComplete(): boolean {
    const length = this.itemForm.get('alt_unit_length')?.value;
    const width = this.itemForm.get('alt_unit_width')?.value;
    const height = this.itemForm.get('alt_unit_height')?.value;
    
    return length > 0 && width > 0 && height > 0;
  }

  // Get formatted dimensions string for main unit
  getMainUnitDimensionsString(): string {
    const length = this.itemForm.get('unit_length')?.value;
    const width = this.itemForm.get('unit_width')?.value;
    const height = this.itemForm.get('unit_height')?.value;
    const dimensionUnit = this.itemForm.get('unit_dimension_unit')?.value || 'cm';
    
    if (length && width && height) {
      return `${length} × ${width} × ${height} ${dimensionUnit}`;
    }
    return 'Not specified';
  }

  // Get formatted dimensions string for alternate unit
  getAltUnitDimensionsString(): string {
    const length = this.itemForm.get('alt_unit_length')?.value;
    const width = this.itemForm.get('alt_unit_width')?.value;
    const height = this.itemForm.get('alt_unit_height')?.value;
    const dimensionUnit = this.itemForm.get('alt_unit_dimension_unit')?.value || 'cm';
    
    if (length && width && height) {
      return `${length} × ${width} × ${height} ${dimensionUnit}`;
    }
    return 'Not specified';
  }
  

}
