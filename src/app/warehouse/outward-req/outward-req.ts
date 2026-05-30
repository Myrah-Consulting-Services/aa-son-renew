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



  constructor(private api: Api, private fb: FormBuilder, public activeModal: NgbActiveModal
    , private toast: ToastService
  ) {
    this.outwardForm = this.fb.group({
      // approved_by: [null],
      // assignedWorker: [null],
      company: [1],
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
      warehouseIdName: ['']
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
    const allowed = ['date', 'invoiceNo', 'loadingBayArea', 'vehicleNo', 'remarks'];
    Object.keys(this.outwardForm.controls).forEach(key => {
      if (!allowed.includes(key)) {
        this.outwardForm.get(key)?.disable();
      }
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
            itemsArray.push(this.fb.group({
              itemId: [item.itemId || '', Validators.required],
              itemName: [item.item_name || '', Validators.required],
              item_code: [item.item_code || item.item_info?.item_code || ''],
              barcode: [item.barcode || item.item_info?.barcode1 || ''],
              quantity: [item.quantity || 1],
              unit: [item.unit || (item.units && item.units[0]?.id) || 1]
            }));
            this.itemUnits[idx] = item.units || item.item_info?.units || [];
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
  // Items FormArray getter
  get items(): FormArray {
    return this.outwardForm.get('items') as FormArray;
  }

  // Add a new item to the items FormArray
  addItem(): void {
    const itemGroup = this.fb.group({
      itemId: ['', Validators.required],
      itemName: ['', Validators.required],
      item_code: [],
      barcode: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['', Validators.required],
    });
    this.items.push(itemGroup);
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
    console.log(this.outwardForm.value);
    if (this.outwardForm.valid) {
      if(this.outwardType=='REQ'){
      if (confirm('Are you sure to dispatch?')) {
        this.api.post('/invoice/update-outward/', this.outwardForm.getRawValue()).subscribe((res: any) => {
          console.log(res);
          if (res.status == 200) {
            this.activeModal.close();

          }
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
