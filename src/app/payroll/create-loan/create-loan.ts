import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-create-loan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-loan.html',
  styleUrl: './create-loan.scss'
})
export class CreateLoanComponent implements OnInit, OnDestroy {
  @Input() selectedEmployee: any = null;
  @Input() modalRef: any = null;

  loanForm: FormGroup;
  private destroy$ = new Subject<void>();

  // Data arrays
  employees: any[] = [];
  loanTypes: any[] = [];
  currencies = ['AED', 'USD', 'EUR', 'GBP', 'INR'];
  paidThroughAccounts = ['Petty Cash', 'Bank Transfer', 'Cash', 'Cheque'];

  // Calculated values
  calculatedEmi = 0;
  calculatedTotalPayable = 0;
  calculatedTotalInterest = 0;
  totalInstallments = 0;
  tenureMonths = 0;
  firstDeductionDate = '';
  @Input() loanData: any = null;
  constructor(
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    private activeModal: NgbActiveModal
  ) {
    this.loanForm = this.fb.group({
      id: [''],
      employee_id: ['', Validators.required],
      loan_type: ['', Validators.required],
      currency: ['AED', Validators.required],
      principal_amount: [null, [Validators.min(1)]],
      interest_rate: [null],
      tenure_months: [null],
      disbursement_date: [new Date().toISOString().substring(0, 10)],
      paid_through_account: ['Petty Cash', Validators.required],
      reference_number: [''],
      reason: ['', Validators.required],
      emi_start_date: [new Date().toISOString().substring(0, 10)],
      emi_amount: [null, [Validators.min(1)]],
      number_of_installments: [],
      company: [],
      status: [1]
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadLoanTypes();
    
    // If employee is pre-selected, set it in the form
    if (this.selectedEmployee) {
      this.loanForm.patchValue({
        employee_id: this.selectedEmployee.id,
        id: this.loanData
      });
    }

    // Subscribe to form changes for calculations
    this.loanForm.get('principal_amount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.useCalculatedEmi());

    this.loanForm.get('interest_rate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.useCalculatedEmi());

    this.loanForm.get('tenure_months')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.useCalculatedEmi());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployees(): void {
    this.api.post('/employee/list_employees/',{company:this.api.getCompanyId(),pagination:false}).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.employees = res.data;
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  loadLoanTypes(): void {
    this.api.get('/attendance/loan-type/list/').subscribe((response: any) => {
        if (response.status == 200) {
          this.loanTypes = response.data;
        }
      });
  }

  useCalculatedEmi(): void {
    const principal = Number(this.loanForm.get('principal_amount')?.value || 0);
    const interestRate = Number(this.loanForm.get('interest_rate')?.value || 0);
    const tenure = Number(this.loanForm.get('tenure_months')?.value || 0);

    if (principal > 0 && tenure > 0) {
      const monthlyRate = interestRate / 100 / 12;
      const emi = monthlyRate > 0 
        ? (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1)
        : principal / tenure;

      this.calculatedEmi = Number(emi.toFixed(2));
      this.calculatedTotalPayable = this.calculatedEmi * tenure;
      this.calculatedTotalInterest = this.calculatedTotalPayable - principal;
      this.totalInstallments = tenure;
      this.tenureMonths = tenure;

      // Update form
      this.loanForm.get('emi_amount')?.setValue(Number(emi.toFixed(2)));
      this.loanForm.get('number_of_installments')?.setValue(tenure);

      // Calculate first deduction date
      const emiStartDate = this.loanForm.get('emi_start_date')?.value;
      if (emiStartDate) {
        this.firstDeductionDate = emiStartDate;
      }
    }
  }

  createLoan(): void {
    if (this.loanForm.invalid) {
      this.loanForm.markAllAsTouched();
      this.toast.show('Error', 'Please fill in all required fields', 'danger');
      return;
    }

    const formData = this.loanForm.value;
    const loanData = {
      employee_id: formData.employee_id,
      loan_type: formData.loan_type,
      currency: formData.currency,
      principal_amount: formData.principal_amount,
      interest_rate: formData.interest_rate || 0,
      tenure_months: formData.tenure_months,
      disbursement_date: formData.disbursement_date,
      paid_through_account: formData.paid_through_account,
      reference_number: formData.reference_number,
      reason: formData.reason,
      emi_start_date: formData.emi_start_date,
      emi_amount: formData.emi_amount,
      number_of_installments: formData.number_of_installments,
      company: this.api.getCompanyId(),
      status: formData.status,
      id: this.loanForm.get('id')?.value
    };
    if (this.loanForm.get('id')?.value) {
        this.api.put(`/attendance/update-loan/${this.loanForm.get('id')?.value}/`, loanData).subscribe((response: any) => {
          if(response.status==200){ 
          this.activeModal.dismiss();
            this.loanForm.get('id')?.setValue(null);
            this.toast.show('Success',response.message?response.message:'Loan updated successfully','success');
  
          }
        });
      } else {
    this.api.post('/attendance/loan/', loanData).subscribe((response: any) => {
        if (response.status === 200) {
          this.toast.show('Success',response.message?response.message:'Loan created successfully','success');
          this.activeModal.dismiss(response.data);
        } else {
          this.toast.show('Error', response.message?response.message:'Failed to create loan', 'danger');
        }
      });
      }
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  resetForm(): void {
    this.loanForm.reset({
      currency: 'AED',
      disbursement_date: new Date().toISOString().substring(0, 10),
      paid_through_account: 'Petty Cash',
      emi_start_date: new Date().toISOString().substring(0, 10),
      status: 1
    });
    this.calculatedEmi = 0;
    this.calculatedTotalPayable = 0;
    this.calculatedTotalInterest = 0;
    this.totalInstallments = 0;
    this.tenureMonths = 0;
    this.firstDeductionDate = '';
  }
}
