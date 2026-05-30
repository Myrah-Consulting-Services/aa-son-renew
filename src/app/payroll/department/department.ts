import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';

interface IDepartment {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './department.html',
  styleUrl: './department.scss'
})
export class Department implements OnInit {
  departments: IDepartment[] = [];
  departmentForm: FormGroup;
  isEditing = false;
  editingIndex: number | null = null;

  @Output() closeModal = new EventEmitter<any>();

  constructor(private fb: FormBuilder,private api:Api) {
    this.departmentForm = this.fb.group({
      department_name: ['', Validators.required],
      description: [''],
      company: [1],
      active: [true]
    });
  }

  ngOnInit(): void {
    // Load sample departments
  
  }

  onSubmit(): void {
    if (this.departmentForm.valid) {
      const formValue = this.departmentForm.value;
      
      if (this.isEditing && this.editingIndex !== null) {
        // Update existing department
        this.departments[this.editingIndex] = {
          ...this.departments[this.editingIndex],
          ...formValue
        };
      } else {
        // Add new department
        this.api.post('/employee/create_department/',formValue).subscribe((res:any)=>{
          this.closeModal.emit(res.data);

          if(res.status==200){
            // then close the modal & send data to parent
            this.closeModal.emit(res.data);
          }else{
          }
        });
        const newDepartment: IDepartment = {
          id: this.departments.length + 1,
          ...formValue
        };
        this.departments.push(newDepartment);
      }
      
      this.resetForm();
    }
  }

  editDepartment(index: number): void {
    this.isEditing = true;
    this.editingIndex = index;
    const department = this.departments[index];
    this.departmentForm.patchValue({
      name: department.name,
      description: department.description,
      active: department.active
    });
  }

  deleteDepartment(index: number): void {
    if (confirm('Are you sure you want to delete this department?')) {
      this.departments.splice(index, 1);
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
    this.departmentForm.reset({ active: true });
    this.isEditing = false;
    this.editingIndex = null;
  }
}
