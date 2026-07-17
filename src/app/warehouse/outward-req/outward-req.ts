import { Component, Input, OnInit } from '@angular/core';
import { Api } from '../../core/services/api';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../core/services/toast.service';

export interface StockedLocation {
  id: number;
  name: string;
  qty: number;
  warehouse_id?: number | null;
  warehouse_name?: string;
}

@Component({
  selector: 'app-outward-req',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './outward-req.html',
  styleUrl: './outward-req.scss'
})
export class OutwardReq implements OnInit {
  @Input() editOutwardId: any
  outwardForm: FormGroup;
  @Input() outwardType: any
  itemUnits: { [index: number]: any[] } = {};
  units: any[] = [];
  loadingbayAreas: any;
  hide: any;
  /** Per-row stocked from-locations (item-wise) */
  itemFromLocations: StockedLocation[][] = [];
  toLocations: any[] = [];
  /** Company locations cache for warehouse labels */
  private companyLocations: any[] = [];

  constructor(private api: Api, private fb: FormBuilder, public activeModal: NgbActiveModal
    , private toast: ToastService
  ) {
    this.outwardForm = this.fb.group({
      company: [this.api.getCompanyId()],
      date: [''],
      id: [],
      invoiceNo: [null,Validators.required],
      inwardType: [],
      items: this.fb.array([]),
      loadingBayArea: ['1'],
      placementOption: [1],
      poNo: [null],
      reference_no: [''],
      remarks: [''],
      status: [8],
      to_warehouse: [],
      to_warehouseName: [''],
      updated_at: [null],
      vehicleNo: [null],
      warehouseId: [],
      warehouseIdName: [''],
      to_location: [null],
    });

  }

  ngOnInit() {
    if (this.editOutwardId) {
      if (this.outwardType == 'REQ') {
        this.getreq();
      } else {
        this.getsalesorder();
      }
    }
    this.loadbay();

    // Disable all except the allowed fields
    const allowed = ['date', 'invoiceNo', 'loadingBayArea', 'vehicleNo', 'remarks', 'to_location'];
    Object.keys(this.outwardForm.controls).forEach(key => {
      if (!allowed.includes(key)) {
        this.outwardForm.get(key)?.disable();
      }
    });
  }

  get isInternalTransfer(): boolean {
    const fromWh = this.outwardForm.get('warehouseId')?.value;
    const toWh = this.outwardForm.get('to_warehouse')?.value;
    return !!fromWh && !!toWh && Number(fromWh) !== Number(toWh);
  }

  loadToLocations(warehouseId: number | null): void {
    if (!warehouseId) {
      this.toLocations = [];
      return;
    }
    this.api.post('/warehouses/list-location/', {
      warehouse: warehouseId,
      company: this.outwardForm.get('company')?.value || this.api.getUserCompany(),
    }).subscribe((res: any) => {
      this.toLocations = res?.data || [];
    });
  }

  private loadCompanyLocationsCache(then?: () => void): void {
    const company = this.outwardForm.get('company')?.value || this.api.getCompanyId();
    this.api.get(`/warehouses/company-locations/?company=${company}`).subscribe({
      next: (res: any) => {
        this.companyLocations = res?.data || [];
        then?.();
      },
      error: () => {
        this.companyLocations = [];
        then?.();
      }
    });
  }

  private enrichWithWarehouse(loc: StockedLocation): StockedLocation {
    const meta = this.companyLocations.find((c: any) => c.id == loc.id);
    if (meta) {
      return {
        ...loc,
        warehouse_id: meta.warehouse ?? meta.warehouse_id ?? loc.warehouse_id,
        warehouse_name: meta.warehouseName ?? meta.warehouse_name ?? loc.warehouse_name,
      };
    }
    return loc;
  }

  /** Load locations that actually have stock for this item */
  loadItemFromLocations(rowIndex: number, itemId: number, preferredLocationId?: number | null): void {
    if (!itemId) {
      this.itemFromLocations[rowIndex] = [];
      return;
    }
    const company = this.outwardForm.get('company')?.value || this.api.getCompanyId();
    this.api.get(`/items/item-wise-locations/${itemId}/?company=${company}`).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        const mapped: StockedLocation[] = rows
          .map((r: any) => this.enrichWithWarehouse({
            id: Number(r.location ?? r.location_id),
            name: r.location_name || r.name || `Location ${r.location}`,
            qty: Number(r.qty) || 0,
            warehouse_id: r.location_warehouse_id ?? r.warehouse_id ?? null,
            warehouse_name: r.warehouse_name || '',
          }))
          .filter((l: StockedLocation) => l.id && l.qty > 0);

        this.itemFromLocations[rowIndex] = mapped;

        const itemGroup = this.items.at(rowIndex) as FormGroup;
        if (!itemGroup) return;

        const current = itemGroup.get('from_location')?.value;
        const preferred = preferredLocationId ?? current;
        const match = mapped.find((l) => l.id == preferred);
        if (match) {
          itemGroup.patchValue({ from_location: match.id }, { emitEvent: false });
        } else {
          // Stale/invalid from_location (e.g. 27 with no stock) — force reselect
          itemGroup.patchValue({ from_location: null }, { emitEvent: false });
        }
        this.enableItemLocationFields();
      },
      error: () => {
        this.itemFromLocations[rowIndex] = [];
        const itemGroup = this.items.at(rowIndex) as FormGroup;
        itemGroup?.patchValue({ from_location: null }, { emitEvent: false });
      }
    });
  }

  private enableItemLocationFields(): void {
    if (this.outwardType !== 'REQ') {
      return;
    }
    const itemsArray = this.outwardForm.get('items') as FormArray;
    itemsArray.controls.forEach((itemGroup) => {
      const group = itemGroup as FormGroup;
      group.get('from_location')?.enable({ emitEvent: false });
      if (this.isInternalTransfer) {
        group.get('to_location')?.enable({ emitEvent: false });
      }
    });
  }

  private buildItemGroup(item: any = {}): FormGroup {
    return this.fb.group({
      itemId: [item.itemId || '', Validators.required],
      itemName: [item.item_name || item.itemName || item.item_info?.name || '', Validators.required],
      item_code: [item.item_code || item.item_info?.item_code || ''],
      barcode: [item.barcode || item.item_info?.barcode1 || item.item_code || ''],
      quantity: [item.quantity || item.qty || 1],
      unit: [item.unit || (item.units && item.units[0]?.id) || 1],
      from_location: [item.from_location || item.locationId || null, Validators.required],
      to_location: [item.to_location || item.toLocationId || null],
    });
  }

  loadbay() {
    this.api.get('/invoice/list-placement-category/').subscribe((res: any) => {
      if (res.status == 200) {
        this.loadingbayAreas = res.data
      } else {
        this.loadingbayAreas = []
      }
    })
  }

  getsalesorder() {
    this.api.get('/invoice/invoice-detail/' + this.editOutwardId + '/').subscribe((res: any) => {
      if (res.status == 200) {
        const data = res.data;
        this.hide = res.data.trans_status
        this.outwardForm.patchValue({
          id: data.id,
          invoiceNo: data.invoiceNo,
          date: data.date,
          reference_no: data.invoice_no,
          remarks: data.notes || '',
          to_warehouseName: data.party_name,
          to_warehouse: data.party,
          warehouseId: data.warehouse,
          warehouseIdName: data.warehouseIdName,
          company: data.company,
          status: 8,
          loadingBayArea: '1',
          placementOption: 1
        });

        const itemsArray = this.outwardForm.get('items') as FormArray;
        itemsArray.clear();
        this.itemUnits = {};
        this.itemFromLocations = [];

        if (Array.isArray(data.items)) {
          data.items.forEach((item: any, idx: number) => {
            itemsArray.push(this.fb.group({
              itemId: [item.item || item.item_info?.id || '', Validators.required],
              itemName: [item.itemName || item.item_info?.name || '', Validators.required],
              item_code: [item.item_info?.item_code || ''],
              barcode: [item.item_info?.barcode1 || ''],
              quantity: [item.qty || 1],
              unit: [item.unit || item.item_info?.unit || 1]
            }));
            this.itemUnits[idx] = item.item_info?.units || [];
          });
        }

        itemsArray.controls.forEach((itemGroup) => {
          const group = itemGroup as FormGroup;
          Object.keys(group.controls).forEach(controlName => {
            group.get(controlName)?.disable();
          });
        });
      }
    })
  }

  getreq() {
    this.api.get('/invoice/get-outward/' + this.editOutwardId + '/').subscribe((res: any) => {
      if (res.status == 200) {
        const { items, ...rest } = res.data;
        this.hide = res.data.status
        this.outwardForm.patchValue(rest);
        this.outwardForm.patchValue({
          loadingBayArea: '1',
          placementOption: '1',
          status: '8'
        })
        const itemsArray = this.outwardForm.get('items') as FormArray;
        itemsArray.clear();
        this.itemUnits = {};
        this.itemFromLocations = [];

        if (Array.isArray(items)) {
          items.forEach((item: any, idx: number) => {
            itemsArray.push(this.buildItemGroup(item));
            this.itemUnits[idx] = item.units || item.item_info?.units || [];
          });
        }
        itemsArray.controls.forEach((itemGroup) => {
          const group = itemGroup as FormGroup;
          Object.keys(group.controls).forEach(controlName => {
            if (controlName !== 'from_location' && controlName !== 'to_location') {
              group.get(controlName)?.disable();
            }
          });
        });
        this.loadToLocations(rest.to_warehouse);
        if (rest.to_location) {
          this.outwardForm.patchValue({ to_location: rest.to_location });
        }
        this.enableItemLocationFields();
        // After company locations cache, load stocked from-locations per item
        this.loadCompanyLocationsCache(() => {
          if (Array.isArray(items)) {
            items.forEach((item: any, idx: number) => {
              const itemId = item.itemId || item.item_info?.id;
              const preferred = item.from_location || item.locationId || null;
              this.loadItemFromLocations(idx, itemId, preferred);
            });
          }
        });
      }
    })
  }

  get items(): FormArray {
    return this.outwardForm.get('items') as FormArray;
  }

  addItem(): void {
    this.items.push(this.buildItemGroup());
    this.itemFromLocations.push([]);
    this.enableItemLocationFields();
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.itemFromLocations.splice(index, 1);
    }
  }

  generateInvoiceNo() {
    const newInvoiceNo = 'INV-' + Date.now();
    this.outwardForm.patchValue({ invoiceNo: newInvoiceNo });
  }

  closeModal() {
    this.activeModal.close();
  }

  private validateDispatchStock(payload: any): string | null {
    if (this.outwardType !== 'REQ' || !Array.isArray(payload.items)) {
      return null;
    }
    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];
      const fromLoc = item.from_location;
      if (fromLoc == null || fromLoc === '') {
        return `Select From Location for item ${item.item_code || item.itemName || i + 1}`;
      }
      const stocked = this.itemFromLocations[i] || [];
      const match = stocked.find((l) => l.id == fromLoc);
      if (!match) {
        return `Item ${item.item_code || item.itemName || ''} is not stocked at the selected From Location. Pick a location with stock.`;
      }
      const qty = Number(item.quantity) || 0;
      if (qty > match.qty) {
        return `Quantity (${qty}) exceeds stock (${match.qty}) at ${match.name} for ${item.item_code || item.itemName || 'item'}.`;
      }
    }
    return null;
  }

  submit() {
    const payload = this.outwardForm.getRawValue();
    const headerToLocation = payload.to_location;
    if (this.outwardType === 'REQ' && Array.isArray(payload.items)) {
      payload.items = payload.items.map((item: any) => ({
        ...item,
        to_location: item.to_location || headerToLocation || null,
      }));
      if (this.isInternalTransfer) {
        const missingDest = payload.items.some((item: any) => !item.to_location);
        if (missingDest) {
          this.toast.show('Warning', 'Select destination location for showroom transfer', 'warning');
          return;
        }
      }

      const stockErr = this.validateDispatchStock(payload);
      if (stockErr) {
        this.toast.show('Error', stockErr, 'danger');
        return;
      }

      // Align header warehouse with selected from-location warehouse when known
      const firstFrom = payload.items[0]?.from_location;
      const firstStock = (this.itemFromLocations[0] || []).find((l) => l.id == firstFrom);
      if (firstStock?.warehouse_id) {
        payload.warehouseId = firstStock.warehouse_id;
        if (firstStock.warehouse_name) {
          payload.warehouseIdName = firstStock.warehouse_name;
        }
      }
    }

    // Re-enable check: from_location may be enabled while parent form has other disabled controls
    const itemsValid = this.outwardType !== 'REQ' || this.items.controls.every((c) => {
      const g = c as FormGroup;
      return g.get('from_location')?.value != null && g.get('from_location')?.value !== '';
    });

    if (this.outwardForm.valid || (this.outwardType === 'REQ' && itemsValid && payload.invoiceNo)) {
      if(this.outwardType=='REQ'){
      if (confirm('Are you sure to dispatch?')) {
        this.api.post('/invoice/update-outward/', payload).subscribe((res: any) => {
          if (res.status == 200) {
            this.toast.show('Success', 'Outward dispatched successfully', 'success');
            this.activeModal.close();
          } else {
            this.toast.show('Error', res.error || 'Dispatch failed', 'danger');
          }
        }, () => {
          this.toast.show('Error', 'Dispatch failed', 'danger');
        })
      } else {
        this.activeModal.close();

      }
    }else{
      if (confirm('Are you sure to dispatch?')) {
      this.api.put('/invoice/invoice-outward-update/'+this.outwardForm.get('id')?.value+'/',this.outwardForm.getRawValue()).subscribe((res:any)=>{
        if(res.status==200){
          this.activeModal.close();
        }
      }) } else {
        this.activeModal.close();

      }
    }
    } else {
      this.toast.show('warning', 'Outward form is not valid', 'warning')
    }
  }

}
