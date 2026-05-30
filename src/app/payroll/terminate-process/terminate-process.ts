import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Api } from '../../core/services/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-terminate-process',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './terminate-process.html',
  styleUrl: './terminate-process.scss'
})
export class TerminateProcess implements OnInit, OnChanges {
  exitForm!: FormGroup;
  isSubmitting = false;
  reasonsForExit: any[] = [];
  @Input() employeeData: any;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private api: Api,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmployeeData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeData'] && this.employeeData) {
      this.initializeForm();
    }
  }

  initializeForm(): void {
    // Initialize form with safe defaults
    const personalEmail = this.employeeData?.personal_info?.personal_email || 'Not Available';
    
    this.exitForm = this.fb.group({
      lastWorkingDay: ['', [Validators.required]],
      reason_for_exit: ['', [Validators.required]],
      paySettlement: ['regular', [Validators.required]],
      specificPayDate: [''],
      personalEmail: [personalEmail, [Validators.email]],
      notes: [''],
      id: [],
      employee: [this.employeeData.id],
      company: [this.api.getCompanyId(), [Validators.required]]
    });

    // Add conditional validation for specific pay date
    this.exitForm.get('paySettlement')?.valueChanges.subscribe(value => {
      const specificDateControl = this.exitForm.get('specificPayDate');
      if (value === 'specific') {
        specificDateControl?.setValidators([Validators.required]);
      } else {
        specificDateControl?.clearValidators();
      }
      specificDateControl?.updateValueAndValidity();
    });
  }

  loadEmployeeData(): void {
    // /employee/list_reasons_for_exit/
    this.api.get('/employee/list_reasons_for_exit/').subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.reasonsForExit = response.data.reasons;
        }
      },
      error: (error) => {
        console.error('Error loading exit reasons:', error);
        this.reasonsForExit = [];
      }
    });
    
    this.route.params.subscribe(params => {
      if (params['employeeData']) {
        // Load employee data based on ID
        this.loadEmployeeById(params['employeeData']);
      }
    });
  }

  loadEmployeeById(employeeData: any): void {
    // TODO: Implement API call to load employee data
  
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.exitForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.exitForm.valid) {
      this.isSubmitting = true;
      
      const formData = this.exitForm.value;
      console.log('Exit process form data:', formData);
      
      // TODO: Implement API call to submit exit process
      this.submitExitProcess(formData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.exitForm.controls).forEach(key => {
        this.exitForm.get(key)?.markAsTouched();
      });
    }
  }

  submitExitProcess(data: any): void {
    this.api.post('/employee/create_exit_process/', data).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          alert('Exit process submitted successfully!');
          this.isSubmitting = false;
          this.modalService.dismissAll();
          this.router.navigate(['/payroll/employees']);
        } else {
          alert(response.error);
          this.isSubmitting = false;
        }
      },
      error: (error: any) => {
        alert(error.error.message);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.modalService.dismissAll();
    // if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
    //   this.router.navigate(['/payroll/employees']);
    // }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}