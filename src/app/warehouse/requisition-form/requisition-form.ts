import { Component, OnInit, Optional, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';


export interface RequisitionItem {
  itemId: number;
  item_code: string;
  item_name: string;
  barcode: string;
  quantity: number;
  unit: number;
}

export interface RequisitionForm {
  invoiceNo: string;
  date: string;
  inwardType: number;
  warehouseId: number;
  to_warehouse: number;
  remarks: string;
  created_by_user: string;
  pick_start_time: string;
  pick_completed_time: string;
  transaction_type: number;
  items: RequisitionItem[];
}

export interface RequisitionResponse {
  id: number;
  pick_start_time: string;
  pick_completed_time: string | null;
  date: string;
  poNo: string | null;
  invoiceNo: string;
  grnNo: string | null;
  vehicleNo: string | null;
  transporter: string | null;
  lrNo: string | null;
  deliveryNoteNo: string | null;
  receivedBy: string | null;
  remarks: string;
  totalAmount: number;
  deleted: boolean;
  created_at: string;
  updated_at: string | null;
  requisition_id: string | null;
  receipt_no: string | null;
  receipt_date: string | null;
  created_by_user: string;
  mark_as_read: boolean;
  recieved_by: string | null;
  checked_by: string | null;
  approved_by: string | null;
  company: number | null;
  inwardType: number;
  supplierId: number | null;
  warehouseId: number;
  to_warehouse: number;
  locationId: number | null;
  to_location: number | null;
  created_by: number | null;
  transaction_type: number;
  status: number;
  placementOption: string | null;
  loadingBayArea: string | null;
}

export interface Warehouse {
  id: number;
  name: string;
}
@Component({
  selector: 'app-requisition-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './requisition-form.html',
  styleUrl: './requisition-form.scss'
})
export class RequisitionForm implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();
  @Output() requisitionCreated = new EventEmitter<RequisitionResponse>();
  @Input() emitdata:any
  @Input() modalRef:any
  @Input() mode: 'create' | 'approve' | 'view' = 'approve';
  requisitionForm: FormGroup;
  currentUser: any | null = null;
  loading = false;
  searchingItems = false;
  searchResults: any[] = [];
  showSearchResults = false;
  activeSearchIndex: number | null = null;
  createdRequisition: RequisitionResponse | null = null;
  showSuccessActions = false;
  errorMessage: string | null = null;
  showSuccessToast = false;
  itemUnits: { [index: number]: any[] } = {};
  itemSearchTerms: string[] = [];

  warehouses: Warehouse[] = [];

  // Search properties
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  workers: any;
  @Output() emitreponse = new EventEmitter<any>();

  constructor(
    private fb: FormBuilder,
    private api:Api,
    private toast: ToastService
    // private authService: AuthService,
    // private requisitionService: RequisitionService,
    // private inventoryService: InventoryService
  ) {
    this.requisitionForm = this.fb.group({
      company: [1, Validators.required],
      invoiceNo: ['', Validators.required],
      date: ['', Validators.required],
      inwardType: [4, Validators.required],
      warehouseId: [2, Validators.required], // Default to Showroom (id: 2)
      to_warehouse: [1, Validators.required], // Default to Main Warehouse (id: 1)
      remarks: [''],
      created_by_user: ['', Validators.required],
      pick_start_time: ['', Validators.required],
      pick_completed_time: [''],
      transaction_type: [4, Validators.required],
      items: this.fb.array([]),
      assignedWorker:[,Validators.required],
      status:[],
      id:[]
    });
  }

  ngOnInit(): void {
    if (this.isCreateMode) {
      this.generateInvoiceNumber();
    }
    this.setCurrentDateTime();
    this.setCurrentUser();
    this.addItem();
    this.loadWarehouses();

    if (this.emitdata) {
      this.getinward(this.emitdata);
    }

    this.setupItemSearch();
    this.applyModeControls();
    if (this.isApproveMode) {
      this.getWorkers();
    }
  }

  get isCreateMode(): boolean { return this.mode === 'create'; }
  get isApproveMode(): boolean { return this.mode === 'approve'; }
  get isViewMode(): boolean { return this.mode === 'view'; }

  private applyModeControls(): void {
    const assignedWorkerControl = this.requisitionForm.get('assignedWorker');

    if (this.isCreateMode) {
      this.requisitionForm.enable({ emitEvent: false });
      assignedWorkerControl?.clearValidators();
      assignedWorkerControl?.updateValueAndValidity({ emitEvent: false });
      return;
    }

    this.requisitionForm.disable({ emitEvent: false });

    if (this.isApproveMode) {
      assignedWorkerControl?.enable({ emitEvent: false });
      assignedWorkerControl?.setValidators([Validators.required]);
      assignedWorkerControl?.updateValueAndValidity({ emitEvent: false });
    } else {
      assignedWorkerControl?.clearValidators();
      assignedWorkerControl?.updateValueAndValidity({ emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getinward(a:any){
    this.api.get('/invoice/get-inward/'+a+'/').
      subscribe((res: any) => {
        console.log(res);
        if (res && res.status === 200 && res.data) {
          this.patchFormWithInward(res.data);
        }
      })
  }

  patchFormWithInward(data: any) {
    // Patch main fields
    this.requisitionForm.patchValue({
      invoiceNo: data.invoiceNo || '',
      id:data.id,
      date: data.date || '',
      inwardType: data.inwardType || 4,
      warehouseId: data.warehouseId || '',
      to_warehouse: data.to_warehouse || '',
      remarks: data.remarks || '',
      created_by_user: data.created_by_user || '',
      pick_start_time: data.pick_start_time || '',
      pick_completed_time: data.pick_completed_time || '',
      transaction_type: data.transaction_type || 4
    });

    // Patch items and their units
    const itemsArray = this.requisitionForm.get('items') as FormArray;
    itemsArray.clear();
    this.itemUnits = {};
    if (Array.isArray(data.items)) {
      data.items.forEach((item: any, idx: number) => {
        itemsArray.push(this.fb.group({
          itemId: [item.itemId || item.item_info?.id || null],
          item_code: [item.item_code || item.item_info?.item_code || ''],
          item_name: [item.item_name || item.item_info?.name || ''],
          barcode: [item.barcode || item.item_info?.barcode1 || ''],
          quantity: [item.quantity || 1],
          unit: [item.unit || (item.units && item.units[0]?.id) || 1]
        }));
        // Patch units for this item
        this.itemUnits[idx] = item.units || item.item_info?.units || [];
      });
    }
  }

  get itemsArray(): FormArray {
    return this.requisitionForm.get('items') as FormArray;
  }

  generateInvoiceNumber(): void {
    if (!this.isCreateMode) {
      return;
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const invoiceNo = `REQ-${year}-${month}${day}-${timestamp}`;

    this.requisitionForm.patchValue({ invoiceNo });
    this.errorMessage = null;
  }

  setCurrentDateTime(): void {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    this.requisitionForm.patchValue({
      date: dateStr,
      pick_start_time: timeStr
    });
  }

  setCurrentUser(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const username = parsedUser?.[0]?.username || parsedUser?.[0]?.email || parsedUser?.[0]?.first_name;
      this.requisitionForm.patchValue({ created_by_user: username || 'unknown_user' });
    }
  }
  getWorkers(): void {
    this.api.post('/employee/list_employees/',{company:1}).subscribe((res: any) => {
      if (res.status === 200) {
        this.workers = res.data;
      }
    });
  }

  loadWarehouses(): void {
    this.api.get('/warehouses/list-warehouse/').subscribe((res: any) => {
      if (res.status === 200) {
        this.warehouses = (res.data || []).map((w: any) => ({ id: w.id, name: w.name }));
      }
    });
  }

  onItemSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  private setupItemSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((searchTerm: string) => {
        const term = (searchTerm || '').trim();
        this.searchingItems = true;
        // Empty term → fetch all items (show on focus after clearing)
        return this.api.post('/items/list-item/s=' + (term ? encodeURIComponent(term) : '') + '/', {
          company: this.api.getCompanyId() ?? 1,
          warehouse: 1
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        this.searchingItems = false;
        if (res?.status === 200) {
          this.searchResults    = res.data || [];
          this.showSearchResults = this.searchResults.length > 0;
        }
      },
      error: () => {
        this.searchingItems    = false;
        this.searchResults     = [];
        this.showSearchResults = false;
      }
    });
  }

  onSearchInput(event: Event, itemIndex: number): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.activeSearchIndex = itemIndex;
      this.itemSearchTerms[itemIndex] = target.value;
      this.onItemSearch(target.value);
    }
  }

  onSearchFocus(itemIndex: number): void {
    this.activeSearchIndex = itemIndex;
    // If we already have results, show them immediately
    if (this.searchResults.length > 0) {
      this.showSearchResults = true;
      return;
    }
    // No results yet — load all items so dropdown is populated on first focus
    this.searchingItems = true;
    this.api.post('/items/list-item/s=/', {
      company: this.api.getCompanyId() ?? 1,
      warehouse: 1
    }).subscribe({
      next: (res: any) => {
        this.searchingItems = false;
        if (res?.status === 200) {
          this.searchResults  = res.data || [];
          this.showSearchResults = this.searchResults.length > 0;
        }
      },
      error: () => { this.searchingItems = false; }
    });
  }

  onSearchBlur(): void {
    // Delay hiding to allow for click events
    setTimeout(() => {
      this.showSearchResults = false;
      this.activeSearchIndex = null;
    }, 200);
  }

  selectItem(item: any, itemIndex: number): void {
    const itemControl = this.itemsArray.at(itemIndex);
    if (itemControl) {
      itemControl.patchValue({
        itemId: item.id,
        item_code: item.item_code,
        item_name: item.name,
        barcode: item.barcode1 || '',
        quantity: 1,
        unit: (item.units && item.units.length > 0) ? item.units[0].id : (item.unit || 1)
      });
      this.itemUnits[itemIndex] = item.units || [];
      this.itemSearchTerms[itemIndex] = item.name || item.item_name || '';
    }
    this.showSearchResults = false;
    this.activeSearchIndex = null;
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      itemId: [null, Validators.required],
      item_code: ['', Validators.required],
      item_name: ['', Validators.required],
      barcode: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: [1, Validators.required]
    });

    this.itemsArray.push(itemGroup);
    this.itemSearchTerms.push('');
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
      this.itemSearchTerms.splice(index, 1);
      delete this.itemUnits[index];
    }
  }

  onSubmit(a: any): void {
    const assignedWorker = this.requisitionForm.getRawValue().assignedWorker;
    const formValue = {
      requisition: this.requisitionForm.getRawValue().id,
      status: a,
      assignedWorker: assignedWorker
    };

    if (a === 2) {
      // Approve & assign: assignedWorker is required
      if (assignedWorker != null) {
        if (confirm('Are you sure you want to approve & assign this requisition?')) {
          this.api.post('/invoice/requisition-update/', formValue).subscribe((res: any) => {
            if (res.status == 200) {
              this.modalRef.close();
              this.requisitionCreated.emit(res)
            }
          });
        }
      } else {
        this.markFormGroupTouched();
      }
    } else if (a === 4) {
      // Reject: assignedWorker can be null
      if (confirm('Are you sure you want to reject this requisition?')) {
        this.api.post('/invoice/requisition-update/', formValue).subscribe((res: any) => {
          if (res.status == 200) {
            this.modalRef.close();
            this.requisitionCreated.emit(res)

          }
        });
      }
    } else {
      // Other cases (keep your existing logic or handle as needed)
      this.modalRef.close();
    }
  }

  createRequisition(): void {
    if (!this.isCreateMode) {
      return;
    }

    if (this.requisitionForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.errorMessage = null;

    const raw = this.requisitionForm.getRawValue();
    const payload = {
      invoiceNo: raw.invoiceNo,
      inwardType: 4,
      company: this.api.getUserCompany(),
      date: raw.date,
      supplierId: raw.supplierId ?? 1,
      warehouseId: raw.warehouseId,
      remarks: raw.remarks || '',
      pick_start_time: raw.pick_start_time,
      pick_completed_time: raw.pick_completed_time || '',
      poNo: raw.poNo ?? null,
      items: (raw.items || []).map((item: any) => ({
        itemId: item.itemId,
        quantity: Number(item.quantity) || 0,
        unit: item.unit,
        unitType: false,
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0,
        batchNo: item.batchNo || '',
        expiryDate: item.expiryDate || null
      }))
    };

    this.api.post('/invoice/create_requisition/', payload).subscribe({
      next: (res: any) => {
        if (this.isSuccessResponse(res)) {
          this.errorMessage = null;
          this.toast.show('Success', 'Requisition created successfully', 'success');
          this.requisitionCreated.emit(res);
          this.modalRef?.close('saved');
          return;
        }

        this.errorMessage = this.extractApiErrorMessage(res);
        this.toast.show('Error', this.errorMessage, 'danger');
      },
      error: (err) => {
        this.errorMessage = this.extractApiErrorMessage(err?.error ?? err);
        this.toast.show('Error', this.errorMessage, 'danger');
      }
    });
  }

  private isSuccessResponse(res: any): boolean {
    return res?.status === 200 || res?.status === 201;
  }

  private extractApiErrorMessage(res: any): string {
    if (!res) {
      return 'Failed to create requisition';
    }

    if (typeof res === 'string') {
      return res;
    }

    if (res.status && !this.isSuccessResponse(res)) {
      return res.error || res.message || 'Failed to create requisition';
    }

    return res.error || res.message || 'Failed to create requisition';
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  dismissSuccessToast(): void {
    this.showSuccessToast = false;
  }

  printRequisition(): void {
    if (this.createdRequisition) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = this.generatePrintContent();
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  downloadPDF(): void {
    if (this.createdRequisition) {
      // For now, we'll create a simple PDF-like HTML that can be printed
      // In a real implementation, you might want to use a library like jsPDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = this.generatePrintContent();
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Add print styles
        const style = printWindow.document.createElement('style');
        style.textContent = `
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
        `;
        printWindow.document.head.appendChild(style);
        
        // Trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  }

  private generatePrintContent(): string {
    if (!this.createdRequisition) return '';

    const requisition = this.createdRequisition;
    const formData = this.requisitionForm.value;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Requisition - ${requisition.invoiceNo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 18px; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-item { margin-bottom: 15px; }
          .info-label { font-weight: bold; color: #333; }
          .info-value { color: #666; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background: #f5f5f5; font-weight: bold; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-item { font-size: 18px; font-weight: bold; }
          .footer { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
          .signature-box { border-top: 1px solid #333; padding-top: 10px; text-align: center; }
          .signature-label { font-weight: bold; margin-bottom: 50px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">BILL OF MOVEMENT - REQUISITION</div>
          <div class="subtitle">${requisition.invoiceNo}</div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Requested From:</div>
            <div class="info-value">${this.getWarehouseName(requisition.warehouseId)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Requested To:</div>
            <div class="info-value">${this.getWarehouseName(requisition.to_warehouse)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date:</div>
            <div class="info-value">${requisition.date}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Pick Start Time:</div>
            <div class="info-value">${requisition.pick_start_time}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Created By:</div>
            <div class="info-value">${requisition.created_by_user}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status:</div>
            <div class="info-value">${requisition.status === 1 ? 'Active' : 'Inactive'}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Barcode</th>
              <th>Quantity</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            ${formData.items.map((item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.item_code}</td>
                <td>${item.item_name}</td>
                <td>${item.barcode || '-'}</td>
                <td>${item.quantity}</td>
                <td>${this.getUnitName(item.unit)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-item">Total Quantity: ${this.getTotalQuantity()}</div>
        </div>

        <div class="footer">
          <div class="signature-box">
            <div class="signature-label">Created By</div>
            <div>${requisition.created_by_user}</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">Approved By</div>
            <div>_________________</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">Picked By</div>
            <div>_________________</div>
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          Generated on ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.requisitionForm.controls).forEach(key => {
      const control = this.requisitionForm.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched();
      } else {
        control?.markAsTouched();
      }
    });
  }

  getTotalQuantity(): number {
    return this.itemsArray.controls.reduce((total, control) => {
      return total + (control.get('quantity')?.value || 0);
    }, 0);
  }

  // Sample data for dropdowns
  get units(): { id: number; name: string }[] {
    return [
      { id: 1, name: 'EA' },
      { id: 2, name: 'PCS' },
      { id: 3, name: 'KG' },
      { id: 4, name: 'L' },
      { id: 5, name: 'M' },
      { id: 6, name: 'BOX' },
      { id: 7, name: 'SET' }
    ];
  }

  getWarehouseName(id: number): string {
    const warehouse = this.warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : 'Unknown';
  }

  getUnitName(id: number): string {
    const unit = this.units.find(u => u.id === id);
    return unit ? unit.name : 'Unknown';
  }

  getItemImage(item: any) {
    // return this.inventoryService.getItemImage(item);
  }

  onImageError(event: any): void {
    event.target.src = '/placeholder.jpg';
  }

  shouldShowSearchResults(itemIndex: number): boolean {
    return this.showSearchResults && this.activeSearchIndex === itemIndex;
  }
}