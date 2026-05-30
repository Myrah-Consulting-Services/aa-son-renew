import { Component, OnInit, Input, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-damage-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './damage-form.html',
  styleUrl: './damage-form.scss'
})
export class DamageForm implements OnInit {
  @Input() id: number | undefined;
  form: FormGroup;
  isEditMode = false;
  warehouses: any[] = [];
  locations: any[] = [];
  items: any[] = [];

  constructor(
    private fb: FormBuilder,
    public svc: Api,
    @Optional() public activeModal: NgbActiveModal,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      date: ['', Validators.required],
      warehouseId: ['', Validators.required],
      locationId: ['', Validators.required],
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      source: ['Manual Entry'],
      id: [null]
    });
  }

  ngOnInit() {
    this.loadInitialData();
    if (this.id) {
      this.isEditMode = true;
      // This form is for creation only from the modal, so no load logic needed for now.
    } else {
      this.form.patchValue({ date: new Date().toISOString().split('T')[0] });
    }
  }

  loadInitialData() {
    this.svc.get('/warehouses/list-warehouse/').subscribe((res: any) => {
      if(res.status == 200){
        this.warehouses = res.data;
      }
    });
    this.svc.get('/warehouses/list-location/').subscribe((res: any) => {
      if(res.status == 200){
        this.locations = res.data;
      }
    });
    this.svc.post('/items/list-item/s=/', { company: 1 }).subscribe((res: any) => {
      if(res.status == 200){
        this.items = res.data;
      }
    });
  }

  save() {
    if (this.form.valid) {
      const formData = this.form.value;
      formData.id = this.id;
      const newDamageReport = { 
        id: Date.now(), 
        ...formData,
        itemId: +formData.itemId,
        warehouseId: +formData.warehouseId,
        locationId: +formData.locationId,
        quantity: +formData.quantity,
      };
      
      this.svc.post('/warehouses/create-damage-report/', newDamageReport).subscribe((res: any) => {
        if(res.status == 200){
          this.toast.show('Damage Report Saved', 'Damage Report has been saved successfully.', 'success');
          if (this.activeModal) {
            this.activeModal.close('saved');
          } else {
            // Navigate back to list when used as route component
            this.router.navigate(['/warehouse/damage-list']);
          }
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel() {
    if (this.activeModal) {
      this.activeModal.dismiss('cancel');
    } else {
      // Handle route navigation when used as route component
      this.router.navigate(['/warehouse/damage-list']);
    }
  }
}
