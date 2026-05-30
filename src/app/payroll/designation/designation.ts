import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';

interface IDesignation {
  id: number;
  designation_name: string;
  description: string;
  department: number;
  company: number;
}

@Component({
  selector: 'app-designation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './designation.html',
  styleUrl: './designation.scss'
})
export class Designation implements OnInit {
  designations: IDesignation[] = [];
  designationForm: FormGroup;
  isEditing = false;
  editingIndex: number | null = null;
  @Output() closeModal = new EventEmitter<any>();
  departmentlist: any[]=[]
  constructor(private fb: FormBuilder,private api:Api) {
    this.designationForm = this.fb.group({
      designation_name: ['', Validators.required],
      description: [''],
      department: [1, Validators.required],
      company: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    // Load sample designations
    this.getDesignationList()
  }
  getDesignationList(): void {
    this.api.get('/employee/list_departments/').subscribe((res:any)=>{
      if(res.status==200){
        this.departmentlist = res.data;
      }
    });
  }
  onSubmit(): void {
    if (this.designationForm.valid) {
      const formValue = this.designationForm.value;
      
      if (this.isEditing && this.editingIndex !== null) {
        // Update existing designation
        this.designations[this.editingIndex] = {
          ...this.designations[this.editingIndex],
          ...formValue
        };
      } else {
        // Add new designation
        this.api.post('/employee/create_designation/',formValue).subscribe((res:any)=>{
          if(res.status==200){
            this.closeModal.emit();
            this.resetForm();
          }else{

          }
        });
        
      }
      
    }
  }

  editDesignation(index: number): void {
    this.isEditing = true;
    this.editingIndex = index;
    const designation = this.designations[index];
    this.designationForm.patchValue({
      designation_name: designation.designation_name,
      description: designation.description,
      department: designation.department,
      company: designation.company
    });
  }

  deleteDesignation(index: number): void {
    if (confirm('Are you sure you want to delete this designation?')) {
      this.designations.splice(index, 1);
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
    this.designationForm.reset({ department: 1, company: 1, designation_name: '', description: '' });
    this.isEditing = false;
    this.editingIndex = null;
  }
}
