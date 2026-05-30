import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-expense-category',
  standalone: true,
  imports: [ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './expense-category.html',
  styleUrl: './expense-category.scss'
})
export class ExpenseCategory implements OnInit {
  expenseCategoryForm: FormGroup;
  isLoading: boolean = false;
  
  @Input() expenseSelected: any;
  @Input() modalRef: any;
  @Output() emitdata = new EventEmitter<any>();
  
  constructor(
    private api: Api,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.expenseCategoryForm = this.fb.group({
      category: [''],
      company: [this.api.getUserCompany()],
      id: ['']
    });
  }
  
  ngOnInit(): void {
    if (this.expenseSelected) {
      this.expenseCategoryForm.patchValue({ id: this.expenseSelected.id });
      this.getExpenseCategory();
    }
  }
  
  getExpenseCategory() {
    this.api.get('/expense/get-expense-category/' + this.expenseSelected.id + '/').subscribe({
      next: (response: any) => {
        if (response.status == 200) {
          this.expenseCategoryForm.patchValue(response.data);
        }
      }
    });
  }
  
  onSubmit() {
    if (this.expenseCategoryForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    
    if (this.expenseSelected) {
      this.api.put('/expense/update-expense-category/', this.expenseCategoryForm.value).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status == 200) {
            this.emitdata.emit(response.data);
            this.expenseCategoryForm.reset();
            this.modalRef.dismiss();
            this.toast.show('Success', 'Expense category updated successfully', 'success');
          } else {
            this.toast.show('Error', response.message, 'danger');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toast.show('Error', 'Failed to update expense category', 'danger');
        }
      });
    } else {
      this.api.post('/expense/create-expense-category/', this.expenseCategoryForm.value).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status == 200) {
            this.emitdata.emit(response.data);
            this.expenseCategoryForm.reset();
            this.modalRef.dismiss();
            this.toast.show('Success', 'Expense category created successfully', 'success');
          } else {
            this.toast.show('Error', response.message, 'danger');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toast.show('Error', 'Failed to create expense category', 'danger');
        }
      });
    }
  }
  
  onCancel() {
    if (this.modalRef) {
      this.modalRef.dismiss();
    }
  }
}
