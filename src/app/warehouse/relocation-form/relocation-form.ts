import { Component, OnInit, Optional, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-relocation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './relocation-form.html',
  styleUrl: './relocation-form.scss'
})
export class RelocationForm implements OnInit {
  @Input() relocationData?: any;
  form: FormGroup;
  locations: any;
  warehouses: any;
  items: any;

  itemSearchTerms: string[] = [];
  filteredItems: any[][] = [];
  showItemDropdown: boolean[] = [];
  availableItems: any[] = [];
  itemLocations: any[][] = [];
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    public svc: Api,
    @Optional() public activeModal: NgbActiveModal,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      date: ['', Validators.required],
      reason: [''],
      items: this.fb.array([]),
      company:[this.svc.getCompanyId()],
      created_by_user:[]
    });
  }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '[]');
    if (user[0]?.username) {
      this.form.patchValue({ created_by_user: user[0].username });
    }
    
    this.form.patchValue({ date: new Date().toISOString().split('T')[0] });
    this.laoditems();
    this.getlocation();
    this.getwarehouse();
    if (this.relocationData) {
      this.isEditMode = true;
    }
    if (!this.relocationData) {
      this.addItem(); // Only add if not editing
    }
  }

  loadRelocation(relocation: any) {
    if (relocation.date) {
      const dateStr = String(relocation.date).split('T')[0];
      this.form.patchValue({
        date: dateStr,
        reason: relocation.reason || ''
      });
    }

    const itemsArray = this.form.get('items') as FormArray;
    while (itemsArray.length) {
      itemsArray.removeAt(0);
    }

    const itemId = Number(relocation.item_id ?? relocation.id);
    const fromLocationId = Number(
      relocation.from_location_id ??
      relocation.locations?.[0]?.location_id ??
      this.resolveLocationIdFromDisplay(relocation.location, 0) ??
      ''
    );
    const toLocationId = Number(
      relocation.to_location_id ??
      relocation.toLocationId ??
      this.resolveLocationIdFromDisplay(relocation.location, 1) ??
      ''
    );
    const quantity = relocation.quantity || 1;

    const matchedItem = this.items?.find((itm: any) => Number(itm.id) === itemId);

    const itemForm = this.createItemForm();
    itemForm.patchValue({
      itemId,
      fromLocationId,
      toLocationId,
      quantity
    });
    itemsArray.push(itemForm);

    this.itemSearchTerms = [matchedItem ? matchedItem.name : (relocation.items || '')];
    this.filteredItems = [[]];
    this.showItemDropdown = [false];
    this.itemLocations = [matchedItem ? matchedItem.locations : []];
  }

  private resolveLocationIdFromDisplay(locationStr: string | undefined, index: 0 | 1): number | null {
    if (!locationStr?.includes('->')) {
      return null;
    }
    const name = locationStr.split('->').map(part => part.trim())[index];
    if (!name || !this.locations?.length) {
      return null;
    }
    const loc = this.locations.find((l: any) =>
      (l.name || l.location_name || '').trim() === name
    );
    return loc ? Number(loc.id ?? loc.location_id) : null;
  }
    getwarehouse(){
      this.svc.listWarehouses().subscribe((res: any) => {
        if(res.status == 200){
          this.warehouses = res.data;
        }
      });
    }    // this.processItemLocationData();
getlocation(){
  this.svc.get('/warehouses/warehouse-wise-location/1/').subscribe((res: any) => {
    if(res.status == 200){
      this.locations = res.data;
      this.tryLoadRelocationForEdit();
    }
  });
}
  laoditems(){
    this.svc.listItems('', { warehouse: 1 }).subscribe((res: any) => {
      if (res.status == 200) {
        this.items = res.data;
        this.tryLoadRelocationForEdit();
      }
    });
  }

  initializeEditMode(relocation: any) {
    this.relocationData = relocation;
    this.isEditMode = true;

    const itemsArray = this.form.get('items') as FormArray;
    while (itemsArray.length) {
      itemsArray.removeAt(0);
    }

    this.tryLoadRelocationForEdit();
  }

  private tryLoadRelocationForEdit() {
    if (this.relocationData && this.items?.length && this.locations?.length) {
      this.loadRelocation(this.relocationData);
    }
  }

  processItemLocationData() {
    // Process location data for items similar to stock-list component
    this.items.forEach((item: any) => {
      if (item.location_data) {
        const locationInfo = item.location_data;
        if (Array.isArray(locationInfo)) {
          item.locations = locationInfo.map((loc: any) => ({
            location_id: loc.location_id,
            location_name: loc.location_name,
            warehouse_id: loc.warehouse_id,
            warehouse_name: loc.warehouse_name,
            qty: loc.qty
          }));
        } else if (typeof locationInfo === 'object') {
          item.locations = [{
            location_id: locationInfo.location_id,
            location_name: locationInfo.location_name,
            warehouse_id: locationInfo.warehouse_id,
            warehouse_name: locationInfo.warehouse_name,
            qty: locationInfo.qty
          }];
        }
      }
    });
  }

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItemForm(): FormGroup {
    return this.fb.group({
      itemId: ['', Validators.required],
      fromLocationId: ['2', Validators.required],
      toLocationId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  addItem() {
    const newItemForm = this.createItemForm();
    
    // Set default from location if locations are available
    // if (this.locations && this.locations.length > 0) {
    //   // Set the first location as default
    //   newItemForm.patchValue({
    //     fromLocationId: this.locations[0].id
    //   });
    // }
    
    this.itemsArray.push(newItemForm);
    this.itemSearchTerms.push('');
    this.filteredItems.push([]);
    this.showItemDropdown.push(false);
    this.itemLocations.push([]); // Add empty locations for new row
    // Optionally, load items for the new row
    this.loadItems();
  }

  removeItem(index: number) {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
      this.itemSearchTerms.splice(index, 1);
      this.filteredItems.splice(index, 1);
      this.showItemDropdown.splice(index, 1);
      this.itemLocations.splice(index, 1); // Remove locations for this row
    }
  }

  onItemChange(itemIndex: number) {
    const itemForm = this.itemsArray.at(itemIndex) as FormGroup;
    const selectedItemId = itemForm.get('itemId')?.value;
    
    if (selectedItemId) {
      const selectedItem = this.items.find((item: any) => item.id === selectedItemId);
      if (selectedItem && selectedItem.locations && selectedItem.locations.length > 0) {
        // Auto-populate from location with the first available location
        console.log(selectedItem.locations,'ty');
        
        const firstLocation = selectedItem.locations[0];
        itemForm.patchValue({
          fromLocationId: firstLocation.location_id,
          quantity: Math.min(firstLocation.qty, itemForm.get('quantity')?.value || 1)
        });
      }
    }
  }

  getItemLocations(itemId: number): any[] {
    const item = this.items.find((item: any) => item.id === itemId);
    return item?.locations || [];
  }

  /** Custom validator for quantity */
  validateQuantity(itemForm: FormGroup, availableQty: number): string | null {
    const qty = itemForm.get('quantity')?.value;
    if (qty === 0 || qty === null || qty === undefined) {
      return 'Quantity must be greater than zero.';
    }
    if (qty > availableQty) {
      return `Quantity cannot be greater than available stock (${availableQty}).`;
    }
    return null;
  }

  save() {
    let hasError = false;
    this.itemsArray.controls.forEach((itemForm, i) => {
      // Find available qty for fromLocation
      const itemId = itemForm.get('itemId')?.value;
      const fromLocationId = itemForm.get('fromLocationId')?.value;
      let availableQty = 0;
      const matchedItem = this.items?.find((itm: any) => itm.id == itemId);
      if (matchedItem && matchedItem.locations) {
        const loc = matchedItem.locations.find((l: any) => l.location_id == fromLocationId);
        if (loc) availableQty = loc.qty;
      }
      const errorMsg = this.validateQuantity(itemForm as FormGroup, availableQty);
      if (errorMsg) {
        hasError = true;
        itemForm.get('quantity')?.setErrors({ custom: errorMsg });
      } else {
        itemForm.get('quantity')?.setErrors(null);
      }
    });
    if (hasError) {
      this.toast.show('Error', 'Please fix quantity errors before saving.', 'danger');
      return;
    }
    console.log(this.form.value);
    
    this.form.markAllAsTouched();
    if (this.form.valid) {
     
        this.svc.post('/items/create-reloaction/', this.form.value).subscribe((res: any) => {
          if(res.status == 200){
    this.toast.show('Relocation Saved', ` item(s) have been relocated successfully.`, 'success');

            if (this.activeModal) {
              this.activeModal.close('saved');
            }
            }
          
        });
      
    }
  }

  cancel() {
    if (this.activeModal) {
      this.activeModal.dismiss('cancel');
    } else {
      // Handle route navigation when used as route component
      this.router.navigate(['/warehouse/relocation-list']);
    }
  }

  // Called when input is focused
  onItemFocus(i: number) {
    this.showItemDropdown[i] = true;
    this.filteredItems[i] = [...this.availableItems];
  }

  // Called on input change
  onItemInput(i: number, event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.itemSearchTerms[i] = searchTerm;
    this.filteredItems[i] = this.availableItems.filter((item: any) =>
      (item.name || '').toLowerCase().includes(searchTerm) ||
      (item.item_code && item.item_code.toLowerCase().includes(searchTerm))
    );
    this.showItemDropdown[i] = true;
    this.loadItems(searchTerm);
  }

  // Called when input loses focus
  onItemBlur(i: number) {
    setTimeout(() => {
      this.showItemDropdown[i] = false;
    }, 200);
  }

  // Load items from API
  loadItems(searchTerm: string = ''): void {
    this.svc.listItems(searchTerm, { warehouse: 1 }).subscribe({
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

  // When an item is selected from dropdown
  selectItem(i: number, itemOption: any) {
    this.itemsArray.at(i).patchValue({
      itemId: itemOption.id,
      // Patch more fields if needed
    });
    this.itemSearchTerms[i] = itemOption.name || '';
    this.filteredItems[i] = [];
    this.showItemDropdown[i] = false;
    this.itemLocations[i] = itemOption.locations || [];
    if (this.itemLocations[i].length > 0) {
      this.itemsArray.at(i).patchValue({
        fromLocationId: this.itemLocations[i][0].location_id
      });
    }
    this.onItemChange(i);
  }
}
