import { Component, OnInit, Input, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location-form.html',
  styleUrl: './location-form.scss'
})
export class LocationForm implements OnInit {
  @Input() id: number | undefined;
  form: FormGroup;
  isEditMode = false;
  isModalMode = false;
  warehouses: any[] = [];

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
      warehouse: ['', Validators.required],
      description: [''],
      capacity: [null, [Validators.min(0)]],
      isActive: [true],
      id: [null]
    });
  }

  ngOnInit() {
    this.loadWarehouses();
    
    if (this.isModalMode) {
      // Modal mode - use @Input id
      if (this.id) {
        this.isEditMode = true;
        this.loadLocation();
      }
    } else {
      // Route mode - get id from route params
      this.route?.params.subscribe(params => {
        const routeId = params['id'];
        if (routeId && routeId !== 'new') {
          this.id = +routeId;
          this.isEditMode = true;
          this.loadLocation();
        }
      });
    }
  }

  loadWarehouses() {
    this.svc.get('/warehouses/list-warehouse/').subscribe((res: any) => {
      if(res.status == 200){
        this.warehouses = res.data;
      }
    });
  }

  loadLocation() {
    if (this.id) {
      this.svc.get('/warehouses/get-location/' + this.id).subscribe((res: any) => {
        if(res.status == 200){
          this.form.patchValue(res.data);
        }
      });
    }
  }

  save() {
    if (this.form.valid) {
      this.form.value.id = this.id;
      const formData = this.form.value;
      if (this.isEditMode && this.id) {
        this.svc.put('/warehouses/update-location/', formData).subscribe((res: any) => {
          if(res.status == 200){
            this.toast.show('Location Updated', 'Location has been updated successfully.', 'success');
            this.handleSuccess();
          }
        });
      } else {
        const newLocation = { id: Date.now(), ...formData };
        this.svc.post('/warehouses/create-location/', newLocation).subscribe((res: any) => {
          if(res.status == 200){
            this.toast.show('Location Created', 'Location has been created successfully.', 'success');
            this.handleSuccess();
          }
        });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  handleSuccess() {
    if (this.isModalMode) {
      this.activeModal?.close('saved');
    } else {
      this.router?.navigate(['/warehouse/locations']);
    }
  }

  cancel() {
    if (this.isModalMode) {
      this.activeModal?.dismiss('cancel');
    } else {
      this.router?.navigate(['/warehouse/locations']);
    }
  }
}
