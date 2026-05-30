import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-benefit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './benefit.html',
  styleUrl: './benefit.scss'
})
export class Benefit implements OnInit {
  benefitForm: FormGroup;
  isEditing = false;
  editingBenefit: any = null;
  isLoading = false;
  isModalMode = false;
  benefits = [
    {id: 25, name: 'Other Non-Taxable Deduction'},
    {id: 26, name: 'Medical Insurance'},
  ];

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.benefitForm = this.fb.group({
      payslip_name: ['', [Validators.required, Validators.maxLength(100)]],
      head_type: ['3', Validators.required],
      earning_type: ['', Validators.required],
      deduction_frequency: [2],
      is_scheduled_earning:[true],
      active: [false],
      id: [null],
    });
    
    this.isModalMode = !!activeModal;
  }

  ngOnInit(): void {
    // Initialize component
    console.log('Benefit component initialized:', {
      isModalMode: this.isModalMode,
      editingBenefit: this.editingBenefit,
      isEditing: this.isEditing
    });
    
    // If we're in modal mode and have editing data, populate the form
    if (this.isModalMode && this.editingBenefit) {
      this.isEditing = true;
    }
  }

  resetForm() {
    this.isEditing = false;
    this.editingBenefit = null;
    this.benefitForm.reset({
      payslip_name: '',
      head_type: '3',
      earning_type: '',
      deduction_frequency:2,
      is_scheduled_earning:true,
      active: false
    });
  }

  editBenefit(benefit: any) {
    this.isEditing = true;
    this.editingBenefit = benefit;
 
  }

  setEditingData(benefit: any) {
    console.log('Setting editing data for benefit:', benefit);
    this.isEditing = true;
    this.editingBenefit = benefit;
    this.api.get(`/employee/get_payroll_head/${this.editingBenefit.id}/`).subscribe({
      next: (res: any) => {
        if(res.status == 200){
          this.benefitForm.patchValue({
            payslip_name: res.data.payslip_name,
            head_type: res.data.head_type,
            earning_type: res.data.earning_type,
            deduction_frequency: 2,
            is_scheduled_earning: res.data.is_scheduled_earning || true,
            active: res.data.active ,
            id: res.data.id
          });
          this.benefitForm.get('earning_type')?.disable();
        }
      },
      error: (error) => {
        console.error('Error loading payroll head:', error);
      }
    });
  }

  populateFormWithData(data: any) {
    console.log('Populating benefit form with data:', data);
    this.benefitForm.patchValue({
      payslip_name: data.head_name || data.payslip_name || '',
      head_type: data.head_type || '3',
      earning_type: data.earning_type || '',
      deduction_frequency:2,
      is_scheduled_earning: data.is_scheduled_earning || true,
      active: data.active !== undefined ? data.active : false
    });
  }

  onSubmit() {
    if (this.benefitForm.valid) {
      this.isLoading = true;
      const formData = this.benefitForm.getRawValue();
      
      console.log('Benefit Form Data:', formData);
      
      // Handle create or update based on editing state
      if (this.isEditing && this.editingBenefit?.id) {
        console.log('Updating benefit:', this.editingBenefit);
        // Update existing benefit
        this.api.put(`/employee/update_payroll_head/${this.editingBenefit.id}/`, formData).subscribe({
          next: (res: any) => {
            console.log('Benefit updated successfully:', res);
            this.isLoading = false;
            if(res.status == 200){
              this.toast.show('Success', 'Benefit updated successfully', 'success');
            if (this.isModalMode) {
              this.closeModalWithResult('updated');
            } else {
              this.toast.show('Error', 'Failed to update benefit. Please try again.', 'danger');
              this.resetForm();
              // Show success message
              console.log('Benefit updated successfully!');
            }}else{
              this.toast.show('Error', 'Failed to update benefit. Please try again.', 'danger');
            }
          },
          error: (error: any) => {
            console.error('Error updating benefit:', error);
            this.isLoading = false;
            // Handle error - show error message to user
          }
        });
      } else {
        console.log('Creating new benefit');
        // Create new benefit
        this.api.post('/employee/create_payroll_head/', formData).subscribe({
          next: (res: any) => {
            console.log('Benefit created successfully:', res);
            this.isLoading = false;
            if(res.status == 200){
              this.toast.show('Success', 'Benefit created successfully', 'success');
            if (this.isModalMode) {
              this.closeModalWithResult('created');
            } else {
              this.resetForm();
              // Show success message
              console.log('Benefit created successfully!');
            }}else{
              this.toast.show('Error', 'Failed to create benefit. Please try again.', 'danger');
            }
          },
          error: (error: any) => {
            console.error('Error creating benefit:', error);
            this.isLoading = false;
            // Handle error - show error message to user
            this.toast.show('Error', 'Failed to create benefit. Please try again.', 'danger');
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.benefitForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.benefitForm.get(controlName);
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

  markFormGroupTouched() {
    Object.keys(this.benefitForm.controls).forEach(key => {
      const control = this.benefitForm.get(key);
      control?.markAsTouched();
    });
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
