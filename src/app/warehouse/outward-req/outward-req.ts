import { Component, Input, input, OnInit } from '@angular/core';
import { Api } from '../../core/services/api';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../core/services/toast.service';

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
  fromLocations: any[] = [];
  toLocations: any[] = [];



  constructor(private api: Api, private fb: FormBuilder, public activeModal: NgbActiveModal
    , private toast: ToastService
  ) {
    this.outwardForm = this.fb.group({
      // approved_by: [null],
      // assignedWorker: [null],
      company: [this.api.getCompanyId()],
      date: [''],
      id: [],
      invoiceNo: [null,Validators.required],
      inwardType: [],
      items: this.fb.array([]), // You can populate this separately using a loop
      loadingBayArea: ['1'],
      // locationId: [null],
      // pick_completed_time: [null],
      // pick_start_time: [null],
      placementOption: [1],
      poNo: [null],
      // receipt_date: [null],
      // receivedBy: [null],
      // recieved_by: [null],
      reference_no: [''],
      remarks: [''],
      // requisition_id: [11],
      status: [8],
      // statusName: ['Completed'],
      // supplierId: [null],
      // to_location: [null],
      to_warehouse: [],
      to_warehouseName: [''],
      // totalAmount: [0],
      // total_items: [1],
      // total_quantity: [1],
      // transaction_type: [null],
      // transporter: [null],
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

  loadStockLocations(warehouseId: number | null, target: 'from' | 'to'): void {
    if (!warehouseId) {
      if (target === 'from') {
        this.fromLocations = [];
      } else {
        this.toLocations = [];
      }
      return;
    }
    this.api.post('/warehouses/list-location/', {
      warehouse: warehouseId,
      company: this.outwardForm.get('company')?.value || this.api.getUserCompany(),
    }).subscribe((res: any) => {
      const list = res?.data || [];
      if (target === 'from') {
        this.fromLocations = list;
      } else {
        this.toLocations = list;
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
      itemName: [item.item_name || item.itemName || '', Validators.required],
      item_code: [item.item_code || item.item_info?.item_code || ''],
      barcode: [item.barcode || item.item_info?.barcode1 || ''],
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
      console.log(res, 'p');
      if (res.status == 200) {
        const data = res.data;
        this.hide = res.data.trans_status
        // Patch the main form fields
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
          status: 8, // Set to outward status
          loadingBayArea: '1',
          placementOption: 1
        });

        // Handle items array
        const itemsArray = this.outwardForm.get('items') as FormArray;
        itemsArray.clear();
        this.itemUnits = {};

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

            // Store units for this item
            this.itemUnits[idx] = item.item_info?.units || [];
          });
        }

        // Disable item controls (as per existing pattern)
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
      console.log(res, 'p');

      if (res.status = 200) {
        // Patch all fields except items
        const { items, ...rest } = res.data;
        this.hide = res.data.status
        this.outwardForm.patchValue(rest);
        this.outwardForm.patchValue({
          loadingBayArea: '1',
          placementOption: '1',
          status: '8'
        })
        // Patch items array
        const itemsArray = this.outwardForm.get('items') as FormArray;
        itemsArray.clear();
        this.itemUnits = [];
        console.log(items, 'i');

        if (Array.isArray(items)) {
          items.forEach((item: any, idx: number) => {
            itemsArray.push(this.buildItemGroup(item));
            this.itemUnits[idx] = item.units || item.item_info?.units || [];
          });
        }
        itemsArray.controls.forEach((itemGroup) => {
          const group = itemGroup as FormGroup;
          Object.keys(group.controls).forEach(controlName => {
            group.get(controlName)?.disable();
          });
        });
        this.loadStockLocations(rest.warehouseId, 'from');
        this.loadStockLocations(rest.to_warehouse, 'to');
        if (rest.to_location) {
          this.outwardForm.patchValue({ to_location: rest.to_location });
        }
        this.enableItemLocationFields();
      }
    })
  }
  // Items FormArray getter
  get items(): FormArray {
    return this.outwardForm.get('items') as FormArray;
  }

  // Add a new item to the items FormArray
  addItem(): void {
    this.items.push(this.buildItemGroup());
    this.enableItemLocationFields();
  }

  // Remove an item by index
  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  generateInvoiceNo() {
    // Example: Use current timestamp for uniqueness
    const newInvoiceNo = 'INV-' + Date.now();
    this.outwardForm.patchValue({ invoiceNo: newInvoiceNo });
  }

  closeModal() {
    this.activeModal.close();
    console.log('Modal closed');
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
    }

    if (this.outwardForm.valid) {
      if(this.outwardType=='REQ'){
      if (confirm('Are you sure to dispatch?')) {
        this.api.post('/invoice/update-outward/', payload).subscribe((res: any) => {
          console.log(res);
          if (res.status == 200) {
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
        console.log(res);
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
