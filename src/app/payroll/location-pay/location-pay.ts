import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';
import { Department } from '../department/department';
import { Branch } from '../branch/branch';

interface ILocationPay {
  id: number;
  Location_name: string;
  company: number;
  branch?: string;
  department?: string;
  emirate?: string;
  address?: string;
}

@Component({
  selector: 'app-location-pay',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Department, Branch],
  templateUrl: './location-pay.html',
  styleUrl: './location-pay.scss'
})
export class LocationPay implements OnInit, OnDestroy {
  locations: ILocationPay[] = [];
  locationForm: FormGroup;
  isEditing = false;
  editingIndex: number | null = null;
  
  // Modal properties
  showDepartmentModal = false;
  showBranchModal = false;
  
  // Data lists
  departmentList: any[] = [];
  branchList: any[] = [];
  
  // UAE Emirates list
  uaeEmirates = [
    { value: '1', label: 'Dubai' },
    { value: '2', label: 'Abu Dhabi' },
    { value: '3', label: 'Sharjah' },
    { value: '4', label: 'Ajman' },
    { value: '5', label: 'Umm Al Quwain' },
    { value: '6', label: 'Ras Al Khaimah' },
    { value: '7', label: 'Fujairah' }
  ];
  
  @Output() closeModal = new EventEmitter<any>();
  
  constructor(private fb: FormBuilder, private api: Api) {
    this.locationForm = this.fb.group({
      Location_name: ['', Validators.required],
      company: [this.api.getCompanyId(), Validators.required],
      id: [],
      branch: [''],
      department: [''],
      emirate: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    // Load data lists
    this.getDepartmentList();
    this.getBranchList();
  }

  ngOnDestroy(): void {
    // Clean up any open modals
    if (this.showDepartmentModal || this.showBranchModal) {
      document.body.classList.remove('modal-open');
    }
  }

  onSubmit(): void {
    if (this.locationForm.valid) {
      const formValue = this.locationForm.value;
      
      if (this.isEditing && this.editingIndex !== null) {
        // Update existing location
        this.locations[this.editingIndex] = {
          ...this.locations[this.editingIndex],
          ...formValue
        };
      } else {
        // Add new location
       this.api.post('/employee/create_location/',formValue).subscribe((res:any)=>{
        if(res.status==200){
          this.closeModal.emit(res.data);
          this.resetForm();
        }
       });
      }
      
      this.resetForm();
    }
  }

  editLocation(index: number): void {
    this.isEditing = true;
    this.editingIndex = index;
    const location = this.locations[index];
    this.locationForm.patchValue({
      Location_name: location.Location_name,
      company: location.company,
      id: location.id,
      branch: location.branch || '',
      department: location.department || '',
      emirate: location.emirate || '',
      address: location.address || ''
    });
  }

  deleteLocation(index: number): void {
    if (confirm('Are you sure you want to delete this location?')) {
      this.locations.splice(index, 1);
      if (this.editingIndex === index) {
        this.resetForm();
      } else if (this.editingIndex !== null && this.editingIndex > index) {
        this.editingIndex--;
      }
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.locationForm.reset({ 
      company: this.api.getCompanyId(), 
      Location_name: '',
      branch: '',
      department: '',
      emirate: '',
      address: ''
    });
    this.isEditing = false;
    this.editingIndex = null;
  }

  // Modal methods
  openDepartmentModal(): void {
    this.showDepartmentModal = true;
    document.body.classList.add('modal-open');
  }

  closeDepartmentModal(): void {
    this.showDepartmentModal = false;
    document.body.classList.remove('modal-open');
    this.getDepartmentList();
  }

  openBranchModal(): void {
    this.showBranchModal = true;
    document.body.classList.add('modal-open');
  }

  closeBranchModal(): void {
    this.showBranchModal = false;
    document.body.classList.remove('modal-open');
    this.getBranchList();
  }

  // Handle backdrop click
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      if (this.showDepartmentModal) {
        this.closeDepartmentModal();
      } else if (this.showBranchModal) {
        this.closeBranchModal();
      }
    }
  }

  // API methods
  getDepartmentList(): void {
    this.api.get('/employee/list_departments/').subscribe((res: any) => {
      if (res.status == 200) {
        this.departmentList = res.data;
      }
    });
  }

  getBranchList(): void {
    this.api.get('/employee/list_branches/').subscribe((res: any) => {
      if (res.status == 200) {
        this.branchList = res.data;
      }
    });
  }
}
