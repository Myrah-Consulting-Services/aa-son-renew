import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';

interface IBranch {
  id: number;
  company: number;
  branchName: string;
  address: string;
  city: string;
  pincode: string;
}

@Component({
  selector: 'app-branch',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './branch.html',
  styleUrl: './branch.scss'
})
export class Branch implements OnInit {
  uaeEmirates = [
    { value: '1', label: 'Dubai' },
    { value: '2', label: 'Abu Dhabi' },
    { value: '3', label: 'Sharjah' },
    { value: '4', label: 'Ajman' },
    { value: '5', label: 'Umm Al Quwain' },
    { value: '6', label: 'Ras Al Khaimah' },
    { value: '7', label: 'Fujairah' }
  ];
  branches: IBranch[] = [];
  branchForm: FormGroup;
  isEditing = false;
  editingIndex: number | null = null;
  @Output() closeModal = new EventEmitter<any>();
  constructor(private fb: FormBuilder,private api:Api) {
    this.branchForm = this.fb.group({
      company: [this.api.getCompanyId(), Validators.required],
      branchName: ['', Validators.required],
      address: [''],
      city: [''],
      pincode: [''],
    });
  }

  ngOnInit(): void {
    // Load sample branches
    // this.branches = [
    //   { id: 1, company: 1, branchName: 'Main Office', address: 'Dubai, UAE', city: 'Dubai', pincode: '00000', deleted: false },
    //   { id: 2, company: 1, branchName: 'Abu Dhabi Branch', address: 'Abu Dhabi, UAE', city: 'Abu Dhabi', pincode: '00000', deleted: false },
    //   { id: 3, company: 1, branchName: 'Sharjah Branch', address: 'Sharjah, UAE', city: 'Sharjah', pincode: '00000', deleted: false },
    //   { id: 4, company: 1, branchName: 'Ajman Branch', address: 'Ajman, UAE', city: 'Ajman', pincode: '00000', deleted: true }
    // ];
  }

  onSubmit(): void {
    if (this.branchForm.valid) {
      const formValue = this.branchForm.value;
      
      if (this.isEditing && this.editingIndex !== null) {
        // Update existing branch
        this.branches[this.editingIndex] = {
          ...this.branches[this.editingIndex],
          ...formValue
        };
      } else {
        // Add new branch
        this.api.post('/employee/create_branch/',formValue).subscribe((res:any)=>{
          if(res.status==200){
            this.closeModal.emit(res.data);
            this.resetForm();
          }
        });
      }
      
    }
  }

  editBranch(index: number): void {
    this.isEditing = true;
    this.editingIndex = index;
    const branch = this.branches[index];
    this.branchForm.patchValue({
      company: branch.company,
      branchName: branch.branchName,
      address: branch.address,
      city: branch.city,
      pincode: branch.pincode,
      id: branch.id
    });
  }

  deleteBranch(index: number): void {
    if (confirm('Are you sure you want to delete this branch?')) {
      this.branches.splice(index, 1);
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
    this.branchForm.reset({ company: this.api.getCompanyId() });
    this.isEditing = false;
    this.editingIndex = null;
  }
}
