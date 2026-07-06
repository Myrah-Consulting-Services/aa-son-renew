import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loan-repayment',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './loan-repayment.html',
  styleUrl: './loan-repayment.scss',
})
export class LoanRepayment implements OnDestroy {
  repaymentForm: FormGroup;
  isRecordingRepayment: boolean = false;
  @Input() selectedEmployee: any = '';
  @Input() mode: 'create' | 'update' = 'create';
  @Input() repaymentData: any = null;
  @Input() modalRef: any = null;
  bankList: any[] = [];
  calculatedRemainingAmount: number = 0;
  private repaymentAmountSubscription?: Subscription;
  constructor(
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    public modalService: NgbModal
  ) {
    // Initialize repayment form
    this.repaymentForm = this.fb.group({
      repayment_amount: [null, [Validators.required, Validators.min(0.01)]],
      repayment_date: [
        new Date().toISOString().substring(0, 10),
        Validators.required,
      ],
      payment_type_id: ['', Validators.required],
      bank_account_id: ['', Validators.required],
      reference_number: [''],
      remarks: [''],
      loan_id: [''],
      id:[]
    });
  }
  ngOnInit(): void {
    this.loadBankList();
    console.log(this.selectedEmployee);
    
    // Initialize remaining amount
    this.calculatedRemainingAmount = this.selectedEmployee.total_balance_remaining
    
    if (this.mode === 'create') {
      this.repaymentForm.patchValue({
        loan_id: this.selectedEmployee.loan_id
      });
    } else if (this.mode === 'update' && this.repaymentData) {
      this.populateFormForUpdate();
    }
    
    // Subscribe to repayment amount changes
    this.repaymentAmountSubscription = this.repaymentForm.get('repayment_amount')?.valueChanges.subscribe(value => {
      this.calculateRemainingAmount(value);
    });
  }

  populateFormForUpdate(): void {
    this.repaymentForm.patchValue({
      repayment_amount: this.repaymentData.amount_deducted,
      repayment_date: this.repaymentData.deduction_date,
      reference_number: this.repaymentData.reference_number || '',
      remarks: this.repaymentData.remarks || '',
      loan_id: this.selectedEmployee?.loan_id,
      payment_type_id: this.repaymentData.payment_type_id,
      bank_account_id: this.repaymentData.bank_id,
      calculatedRemainingAmount: this.repaymentData.total_outstanding,
      id: this.repaymentData.id
    });
  }
  getCurrentDate(): string {
    return new Date().toISOString().substring(0, 10);
  } 
  loadBankList(): void {
    this.api.get('/money/list-bank/'+this.api.getUserCompany()+'/').subscribe(
      (response: any) => {
        if (response.status === 200) {
          this.bankList = response.data || [];
          console.log('Bank list loaded:', this.bankList);
        }
      },
      (error) => {
        console.error('Error loading bank list:', error);
      }
    );
  }

  recordRepayment(): void {
    if (this.repaymentForm.valid) {
      this.isRecordingRepayment = true;

      const repaymentData = {
        loan_id: this.selectedEmployee?.loan_id,
        repayment_amount: this.repaymentForm.value.repayment_amount,
        repayment_date: this.repaymentForm.value.repayment_date,
        payment_type_id: this.repaymentForm.value.payment_type_id,
        bank_account_id: this.repaymentForm.value.bank_account_id,
        reference_number: this.repaymentForm.value.reference_number,
        remarks: this.repaymentForm.value.remarks,
        // processed_by_id: 5
      };

      // Handle update mode
      if (this.mode === 'update' && this.repaymentData) {
        const updateData = {
          amount_deducted: this.repaymentForm.value.repayment_amount,
          deduction_date: this.repaymentForm.value.repayment_date,
          month: this.repaymentData.month,
          status_code: this.repaymentData.status_code || 'paid',
          reference_number: this.repaymentForm.value.reference_number,
          remarks: this.repaymentForm.value.remarks
        };

        this.api
          .put(
            `/attendance/update-repayment-by-id/${this.repaymentData.repayment_id}/`,
            updateData
          )
          .subscribe((response: any) => {
            this.isRecordingRepayment = false;
            if (response.status == 200 || response.status == 201) {
              console.log('Repayment updated successfully:', response);
              this.toast.show('Repayment updated successfully', 'success');
              this.modalService.dismissAll();
            } else {
              this.toast.show('Error updating repayment', 'danger');
            }
          }, (error) => {
            console.error('Error updating repayment:', error);
            this.toast.show('Error updating repayment', 'danger');
          });
      } else {
        this.api
          .post('/attendance/record-loan-repayment/', repaymentData)
          .subscribe((response: any) => {
            this.isRecordingRepayment = false;
            if (response.status == 200 || response.status == 201) {
              console.log('Repayment recorded successfully:', response);
              this.toast.show('Repayment recorded successfully', 'success');
              // Close modal
              this.modalService.dismissAll();
            }
          });
      }
    }
  }
  getRemainingAmount(loan: any): number {
    // If backend provides outstanding, prefer it
    if (loan?.outstanding_amount != null) return Number(loan.outstanding_amount);
    const principal = Number(loan?.principal_amount || 0);
    const paid = Number(loan?.total_amount_paid || 0);
    const remaining = principal - paid;
    return remaining > 0 ? remaining : 0;
  }

  calculateRemainingAmount(repaymentAmount: number): void {
    const currentRemaining = this.getRemainingAmount(this.selectedEmployee);
    const repayment = Number(repaymentAmount) || 0;
    
    if (this.mode === 'update' && this.repaymentData) {
      // For update mode, we need to add back the original repayment amount first
      const originalRepayment = Number(this.repaymentData.amount_deducted) || 0;
      this.calculatedRemainingAmount = currentRemaining + originalRepayment - repayment;
    } else {
      // For create mode, simply subtract the repayment amount
      this.calculatedRemainingAmount = currentRemaining - repayment;
    }
    
    // Ensure remaining amount doesn't go below 0
    this.calculatedRemainingAmount = Math.max(0, this.calculatedRemainingAmount);
  }

  ngOnDestroy(): void {
    if (this.repaymentAmountSubscription) {
      this.repaymentAmountSubscription.unsubscribe();
    }
  }
}
