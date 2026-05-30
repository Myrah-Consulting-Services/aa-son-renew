import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-deduction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './deduction.html',
  styleUrl: './deduction.scss'
})
export class Deduction implements OnInit {
  deductionForm: FormGroup;
  isEditing = false;
  editingDeduction: any = null;
  isLoading = false;
  isModalMode = false;

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.deductionForm = this.fb.group({
      payslip_name: ['', [Validators.required, Validators.maxLength(100)]],
      head_type: ['2', Validators.required],
      deduction_frequency: [1, Validators.required],
      is_scheduled_earning:[true], // 1: One-time, 2: Recurring
      active: [false],
      earning_type:[31],
      id: [null],
    });
    
    this.isModalMode = !!activeModal;
  }

  ngOnInit(): void {
    // Initialize component
    console.log('Deduction component initialized:', {
      isModalMode: this.isModalMode,
      editingDeduction: this.editingDeduction,
      isEditing: this.isEditing
    });
    
    // If we're in modal mode and have editing data, populate the form
    if (this.isModalMode && this.editingDeduction) {
      this.isEditing = true;
    //   this.api.get(`/employee/get_payroll_head/${this.editingDeduction.id}/`).subscribe({
    //     next: (res: any) => {
    //       // this.populateFormWithData(res.data);
    //     },
    //     error: (error) => {
    //       console.error('Error loading payroll head:', error);
    //     }
    //   });
      // this.populateFormWithData(this.editingDeduction);
    }
  }

  editDeduction(deduction: any) {
    this.isEditing = true;
    this.editingDeduction = deduction;
    // this.populateFormWithData(deduction);
  }

  setEditingData(deduction: any) {
    this.isEditing = true;
    this.editingDeduction = deduction;
    console.log(this.editingDeduction, 'editingDeduction');
    this.api.get(`/employee/get_payroll_head/${this.editingDeduction.id}/`).subscribe({
          next: (res: any) => {
            if(res.status == 200){
                           const formData = {
               payslip_name: res.data.payslip_name,
               head_type: res.data.head_type,
               deduction_frequency: parseInt(res.data.deduction_frequency) || 1,
               active: res.data.active,
               is_scheduled_earning: res.data.is_scheduled_earning || true,
               earning_type:res.data.earning_type || 31,
               id: res.data.id 
             };
             
             console.log('Setting form data:', formData);
             console.log('Original deduction_frequency:', res.data.deduction_frequency, 'Type:', typeof res.data.deduction_frequency);
             console.log('Converted deduction_frequency:', formData.deduction_frequency, 'Type:', typeof formData.deduction_frequency);
             
             this.deductionForm.patchValue(formData);
             if(formData.earning_type ==27 || formData.earning_type ==28 || formData.earning_type ==29 || formData.earning_type ==30){
              this.deductionForm.get('deduction_frequency')?.disable();
              this.deductionForm.get('active')?.disable();
             }else{
              this.deductionForm.get('deduction_frequency')?.enable();
              this.deductionForm.get('active')?.enable();
             }
             // Debug: Check form value after setting
             setTimeout(() => {
               console.log('Form value after patchValue:', this.deductionForm.value);
               console.log('deduction_frequency control value:', this.deductionForm.get('deduction_frequency')?.value);
             }, 100);
            }
          },
          error: (error) => {
            console.error('Error loading payroll head:', error);
          }
        });
    // this.populateFormWithData(deduction);
  }

  resetForm() {
    this.isEditing = false;
    this.editingDeduction = null;
    this.deductionForm.reset({
      payslip_name: '',
      head_type: '2',
      deduction_frequency: 1,
      active: false,
      earning_type:31
    });
  }

  populateFormWithData(data: any) {
    console.log('Populating deduction form with data:', data);
    
   
  }

  onSubmit() {
    if (this.deductionForm.valid) {
      this.isLoading = true;
      const formData = this.deductionForm.getRawValue();
      
      console.log('Deduction Form Data:', formData);
      
      // Handle create or update based on editing state
      if (this.isEditing && this.editingDeduction?.id) {
        console.log('Updating deduction:', this.editingDeduction);
        // Update existing deduction
        this.api.put(`/employee/update_payroll_head/${this.editingDeduction.id}/`, formData).subscribe({
          next: (res: any) => {
            console.log('Deduction updated successfully:', res);
            this.isLoading = false;
            if(res.status == 200){
              this.toast.show('Success', 'Deduction updated successfully', 'success');
            if (this.isModalMode) {
              this.closeModalWithResult('updated');
            } else {
              this.resetForm();
              // Show success message
              console.log('Deduction updated successfully!');
            }}else{
              this.toast.show('Error', 'Failed to update deduction. Please try again.', 'danger');
            }
          },
          error: (error: any) => {
            console.error('Error updating deduction:', error);
            this.isLoading = false;
            // Handle error - show error message to user
            this.toast.show('Error', 'Failed to update deduction. Please try again.', 'danger');
          }
        });
      } else {
        console.log('Creating new deduction');
        // Create new deduction
        this.api.post('/employee/create_payroll_head/', formData).subscribe({
          next: (res: any) => {
            console.log('Deduction created successfully:', res);
            this.isLoading = false;
            if(res.status == 200){
            if (this.isModalMode) {
              this.toast.show('Success', 'Deduction created successfully', 'success');
              this.closeModalWithResult('created');
            } else {
              this.resetForm();
              // Show success message
              console.log('Deduction created successfully!');
            }}else{
              this.toast.show('Error', 'Failed to create deduction. Please try again.', 'danger');
              // this.showToastMessage('Failed to create deduction. Please try again.', 'error');
            }
          },
          error: (error: any) => {
            console.error('Error creating deduction:', error);
            this.isLoading = false;
            // Handle error - show error message to user
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.deductionForm.controls).forEach(key => {
      const control = this.deductionForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.deductionForm.get(controlName);
    if (control?.errors && control?.touched) {
      if (control.errors['required']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
      }
      if (control.errors['maxlength']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} cannot exceed ${control.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.deductionForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  closeModal() {
    if (this.isModalMode) {
      this.activeModal?.dismiss('cancel');
    }
  }

  closeModalWithResult(result: string) {
    if (this.isModalMode) {
      this.activeModal?.close(result);
    }
  }
}
