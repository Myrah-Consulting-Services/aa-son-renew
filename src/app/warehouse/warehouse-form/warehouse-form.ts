import { Component, OnInit, Input, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './warehouse-form.html',
  styleUrl: './warehouse-form.scss'
})
export class WarehouseForm implements OnInit {
  @Input() id: number | undefined;
  form: FormGroup;
  isEditMode = false;
  isModalMode = false;

  constructor(
    private fb: FormBuilder,
    public svc: Api,
    @Optional() public activeModal: NgbActiveModal,
    @Optional() private router: Router,
    @Optional() private route: ActivatedRoute,
    private toast: ToastService
  ) {
    this.isModalMode = !!activeModal;
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      contactPerson: [''],
      phone: [''],
      email: ['', Validators.email],
      is_active: [true],
      id: [null],
      company: [this.svc.getUserCompany(), Validators.required],
    });
  }

  ngOnInit() {
    if (this.isModalMode) {
      // Modal mode - use @Input id
      if (this.id) {
        this.isEditMode = true;
        this.loadWarehouse();
      }
    } else {
      // Route mode - get id from route params
      this.route?.params.subscribe(params => {
        const routeId = params['id'];
        if (routeId && routeId !== 'new') {
          this.id = +routeId;
          this.isEditMode = true;
          this.loadWarehouse();
        }
      });
    }
  }

  loadWarehouse() {
    if (this.id) {
      this.svc.get('/warehouses/get-warehouse/' + this.id).subscribe((res: any) => {
        if (res.status == 200) {
          const data = res.data;
          this.form.patchValue({
            name: data.name,
            address: data.address,
            // API may return contact_person (snake_case) — handle both
            contactPerson: data.contact_person ?? data.contactPerson ?? '',
            phone: data.phone ?? '',
            email: data.email ?? '',
            is_active: data.is_active ?? true,
            id: data.id,
            company: data.company ?? this.svc.getUserCompany(),
          });
        }
      });
    }
  }

  save() {
    if (this.form.valid) {
      const raw = this.form.value;
      // Normalize to API field names
      const formData: any = {
        id: this.id ?? raw.id,
        name: raw.name,
        address: raw.address,
        contact_person: raw.contactPerson,
        phone: raw.phone,
        email: raw.email,
        is_active: raw.is_active,
        company: raw.company,
      };

      if (this.isEditMode && this.id) {
        this.svc.put('/warehouses/update-warehouse/', formData).subscribe((res: any) => {
          if (res.status == 200) {
            this.toast.show('Warehouse Updated', 'Warehouse has been updated successfully.', 'success');
            this.handleSuccess();
          }
        });
      } else {
        this.svc.post('/warehouses/create-warehouse/', formData).subscribe((res: any) => {
          console.log(res);
          this.toast.show('Warehouse Created', 'Warehouse has been created successfully.', 'success');
          this.handleSuccess();
        });
      }
    } else {
      this.form.markAllAsTouched();
      this.toast.show('Form Invalid', 'Please fill all required fields correctly.', 'danger');
    }
  }

  handleSuccess() {
    if (this.isModalMode) {
      this.activeModal?.close('saved');
    } else {
      this.router?.navigate(['/warehouse/warehouses']);
    }
  }

  cancel() {
    if (this.isModalMode) {
      this.activeModal?.dismiss('cancel');
    } else {
      this.router?.navigate(['/warehouse/warehouses']);
    }
  }
}
