import { Component, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Api } from '../../core/services/api';
import { NgbActiveModal, NgbModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../core/services/toast.service';
import { LoanRepayment } from '../loan-repayment/loan-repayment';
import { CreateLoanComponent } from '../create-loan/create-loan';

@Component({
  selector: 'app-loan-management',
  standalone: true,
    imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LoanRepayment,
  ],
  templateUrl: './loan-management.html',
  styleUrls: ['./loan-management.scss'],
  providers: [Api,NgbActiveModal]
})
export class LoanManagementComponent implements OnInit {
  activeTab: 'loans' | 'ledger' = 'loans';
  loans: any[] = [];
  loanLedgers: any[] = [];
  loanForm: FormGroup; // used for loan creation
  selectedEmployeeId: any = '';
  employees: any[] = [];
  // simple accounts list for Paid Through Account
  paidThroughAccounts: string[] = ['Petty Cash', 'Cash', 'Bank Account'];
  currencies: string[] = [];
  // Pagination (Loans tab)
  loansPage: number = 1;

  displayedColumns: string[] = [
    'employeeName',
    'loanType',
    'principalAmount',
    'emiAmount',
    'tenure',
    'status',
    'actions'
  ];

  ledgerColumns: string[] = [
    'loanId',
    'loanType',
    'principalAmount',
    'totalPaid',
    'outstandingBalance',
    'actions'
  ];
  summary: any;
  repayment_history: any[] = [];
  loanTypes: any;
  selectedLoanForView: any = null;
  editingLoanId: string | null = null;
  paginatedLoans: any;
  totalData: any;
Math=Math;
currentPage: number=0;
  pageSize: any=10;
  totalPages: number=1;
  name: any;
  
  // Record Repayment properties
  selectedLoanForRepayment: any = null;
  isRecordingRepayment: boolean = false;
  bankList: any[] = [];

  // Update Repayment properties
  selectedRepaymentForUpdate: any = null;
  isUpdateMode: boolean = false;
  modalRef: any;

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private modalService: NgbModal,
    private toast:ToastService,
    private activeModal:NgbActiveModal
  ) {
    this.loanForm = this.fb.group({
      id: [''],
      employee_id: ['', Validators.required],
      loan_type: ['', Validators.required],
      currency: [this.api.getcurrencies() || 'AED', Validators.required],
      principal_amount: [null, [Validators.min(1)]],
      interest_rate: [null],
      tenure_months: [null],
      disbursement_date: [new Date().toISOString().substring(0, 10)],
      paid_through_account: ['Petty Cash', Validators.required],
      reference_number: [''],
      reason: [''],
      emi_start_date: [new Date().toISOString().substring(0, 10)],
      emi_amount: [null, [Validators.min(1)]],
      number_of_installments:[],
      company:[],
      status:[1]
    }); 
  }

  getcurrency() {
    return this.api.getcurrencies();
  }

  ngOnInit(): void {
    // Keep currency consistent across payroll UI
    this.currencies = [this.getcurrency() || 'AED'];
    this.loanForm.get('currency')?.setValue(this.getcurrency() || 'AED', { emitEvent: false });
    this.loadEmployees();
    this.loadLoans();
    this.loadLoanTypes();
    this.loadLoanLedgers(this.selectedEmployeeId);
  }

  toMoney(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Strip currency codes/symbols and commas, keep digits, decimal, minus
      const cleaned = value.replace(/[^\d.-]/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  setActiveTab(tab: string): void {
    if (tab == 'loans' || tab == 'ledger') {
      this.activeTab = tab as 'loans' | 'ledger';
    }
  }

  openForm(form:any){
    this.modalService.open(form,{size:'lg', backdrop:'static',keyboard:false})
  }
  
  openCreateForm(form:any){
    this.editingLoanId = null;
    this.loanForm.reset({
      id: '',
      employee_id: '',
      loan_type: '',
      currency: 'AED',
      principal_amount: null,
      interest_rate: null,
      tenure_months: null,
      disbursement_date: new Date().toISOString().substring(0, 10),
      paid_through_account: 'Petty Cash',
      reference_number: '',
      reason: '',
      emi_start_date: new Date().toISOString().substring(0, 10),
      emi_amount: null,
      number_of_installments: null,
      status: 1
    });
    this.modalService.open(form,{size:'lg', backdrop:'static',keyboard:false});
  }

  openEditForm(form:any, loan:any){
    this.editingLoanId = String(loan.id);
    this.loanForm.patchValue({
      id: loan.id,
      employee_id: loan.employee_id || loan.employee_details?.id,
      loan_type: loan.loan_type || loan.loan_type_details?.id,
      currency: loan.currency || 'AED',
      principal_amount: loan.principal_amount,
      interest_rate: loan.interest_rate,
      tenure_months: loan.tenure_months,
      disbursement_date: loan.disbursement_date,
      paid_through_account: loan.paid_through_account,
      reference_number: loan.reference_number,
      reason: loan.reason,
      emi_start_date: loan.emi_start_date || loan.disbursement_date,
      emi_amount: loan.emi_amount,
      number_of_installments: loan.number_of_installments,
      status: loan.status
    });
    this.modalService.open(form,{size:'lg', backdrop:'static',keyboard:false});
  }
  loadEmployees(): void {
    this.api.post('/employee/list_employees/',{company:this.api.getCompanyId(),pagination:false}).subscribe((response: any) => {
      if (response.status == 200) {
        this.employees = response.data;
      }
    });
  }
  // /attendance/loan-type/list/
  loadLoanTypes(): void {
    this.api.get('/attendance/loan-type/list/').subscribe((response: any) => {
      if (response.status == 200) {
        this.loanTypes = response.data;
      }
    });
  }
  openTypeForm(form:any){
    this.modalService.open(form,{size:'sm'})
  }
  createLoanType(){
    // attendance/loan-type/
    let payload={
      name:this.name
    }
    this.api.get('attendance/loan-type/',payload).subscribe((res:any)=>{
      if (res.status == 200) {
      }
    })
  }

  loadLoans(): void {
    // /attendance/loan/list/
    this.api.get('/attendance/list-loan/').subscribe((response: any) => {
      if (response.status == 200) {
        this.loans = response.data;
        this.paginatedLoans=response.pagination_data
        this.totalData=this.paginatedLoans.total_data
        this.totalPages = Math.ceil(this.totalData / this.pageSize);

      }
    });
  }
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(5, this.totalPages);
    const startPage = Math.max(0, Math.min(this.currentPage - 2, this.totalPages - maxPages));
    
    for (let i = startPage; i < startPage + maxPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  onPageChange(event: any) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  loadLoanLedgers(employeeId: any): void {
    this.api.post('/attendance/employee-loan-payment-history/',{
      employee_id: employeeId,
      company_id:this.api.getCompanyId()
    }).subscribe((response: any) => {
      if (response.status == 200) {
        if(!employeeId){
          this.loanLedgers = response.data.employees;
        }else{
          this.loanLedgers = [response.data];
        }
        this.summary = response.data.overall_summary;
        // this.repayment_history = response.data.repayment_history;
      }
    });
  }

  // Derived UI helpers for creation form
  get totalInstallments(): number {
    const amount = Number(this.loanForm.get('principal_amount')?.value || 0);
    const inst = Number(this.loanForm.get('emi_amount')?.value || 0);
    if (!amount || !inst) return 0;
    return Math.ceil(amount / inst);
  }

  get firstDeductionDate(): string {
    return this.loanForm.get('emi_start_date')?.value || '';
  }

  // Interest/EMI calculations (simple reducing balance EMI formula)
  get interestRate(): number {
    const interestRateValue = this.loanForm.get('interest_rate')?.value;
    const annualRate = Number(interestRateValue);
    // Only calculate monthly rate if interest rate is provided and not zero
    if (!interestRateValue || annualRate === 0) return 0;
    return annualRate / 12 / 100;

  }

  get tenureMonths(): number {
    return Number(this.loanForm.get('tenure_months')?.value || 0);
  }

  // get calculatedEmi(): number {
  //   const principal = Number(this.loanForm.get('principal_amount')?.value || 0);
  //   const r = this.interestRate;
  //   const n = this.tenureMonths;
  //   if (!principal || !r || !n) return 0;
  //   const pow = Math.pow(1 + r, n);
  //   return (principal * r * pow) / (pow - 1);
  // }
  get calculatedEmi(): number {
    const principal = Number(this.loanForm.get('principal_amount')?.value || 0);
    const r = this.interestRate;
    const n = this.tenureMonths;
  
    if (!principal || !n) return 0;
  
    // ✅ Case when interest = 0 → simple division
    if (!r || r === 0) {
      return principal / n;
    }
  
    // ✅ Standard EMI formula
    const pow = Math.pow(1 + r, n);
    return (principal * r * pow) / (pow - 1);
  }
  

  get calculatedTotalPayable(): number {
    const emi = this.calculatedEmi;
    const n = this.tenureMonths;
    if (!emi || !n) return 0;
    return emi * n;
  }

  get calculatedTotalInterest(): number {
    const principal = Number(this.loanForm.get('principal_amount')?.value || 0);
    const total = this.calculatedTotalPayable;
    if (!principal || !total) return 0;
    return total - principal;
  }

  useCalculatedEmi(): void {
    const emi = this.calculatedEmi;
    if (emi > 0) {
      this.loanForm.get('emi_amount')?.setValue(Number(emi.toFixed(2)));
    }
  }

  saveLoan(): void {
    if (this.loanForm.invalid) {
      this.loanForm.markAllAsTouched();
      return;
    }

    const v = this.loanForm.value;
    const payload = {
      employee: v.employee_id,
      loan_type: v.loan_type,
      currency: v.currency,
      principal_amount: Number(v.principal_amount),
      interest_rate: Number(v.interest_rate),
      tenure_months: Number(v.tenure_months),
      disbursement_date: v.disbursement_date,
      paid_through_account: v.paid_through_account,
      reference_number: v.reference_number,
      reason: v.reason,
      emi_start_date: v.emi_start_date,
      emi_amount: Number(v.emi_amount),
      number_of_installments: this.totalInstallments,
      company:this.api.getCompanyId(),
      status: v.status
    };

    if (this.editingLoanId) {
      this.api.put(`/attendance/update-loan/${this.editingLoanId}/`, payload).subscribe((response: any) => {
        if(response.status==200){ 
        this.modalService.dismissAll();
          this.loadLoans();
          this.editingLoanId = null;
          this.toast.show('Success',response.message?response.message:'Loan updated successfully','success');

        }
      });
    } else {
      this.api.post('/attendance/loan/', payload).subscribe((response: any) => {
        if(response.status==200){
          this.toast.show('Success',response.message?response.message:'Loan created successfully','success');
          this.modalService.dismissAll();
          this.loadLoans();
        }
      });
    }
  }

  createLoan(): void {
    if (this.loanForm.invalid) {
      this.loanForm.markAllAsTouched();
      return;
    }

    const v = this.loanForm.value;
    const payload = {
      employee_id: v.employee_id,
      loan_type: v.loan_type,
      currency: v.currency,
      principal_amount: Number(v.principal_amount),
      interest_rate: Number(v.interest_rate),
      tenure_months: Number(v.tenure_months),
      disbursement_date: v.disbursement_date,
      paid_through_account: v.paid_through_account,
      reference_number: v.reference_number,
      reason: v.reason,
      emi_start_date: v.emi_start_date,
      emi_amount: Number(v.emi_amount),
      number_of_installments: this.totalInstallments
    };

    // /attendance/loan/
    this.api.post('/attendance/loan/', payload).subscribe((response: any) => {
      if(response.status==200){
      this.toast.show('Loan created successfully','success');
      this.activeModal.close()
      this.loadLoans();
      this.loanForm.reset({
        loan_type: '',
        employee_id: '',
        currency: 'AED',
        principal_amount: null,
        disbursement_date: new Date().toISOString().substring(0, 10),
        paid_through_account: 'Petty Cash',
        reference_number: '',
        reason: '',
        emi_start_date: new Date().toISOString().substring(0, 10),
        emi_amount: null
      });
      }
    });
  }

  closeLoan(loanId: string): void {
    // /attendance/post-loan/2/
    this.api.post('/attendance/post-loan/'+loanId+"/").subscribe((response: any) => {
      alert('Loan updated successfully');
      this.loadLoans();
      this.loadLoanLedgers(this.selectedEmployeeId);
    })
  }

  deleteLoan(loanId: string): void {
    if (!loanId) return;
    const ok = confirm('Are you sure you want to delete this loan?');
    if (!ok) return;
    this.api.delete(`/attendance/delete-loan/${loanId}/`).subscribe((response: any) => {
      this.toast.show('Loan deleted','success');
      this.loadLoans();
    });
  }

  selectedLoanId: string = '';
  showPaymentHistory = false;
  paymentHistory: any[] = [];

  openPaymentHistory(modalTpl: TemplateRef<any>, loanId: any): void {
    this.repayment_history = loanId.repayment_history;
    console.log(this.repayment_history);
    
    this.modalService.open(modalTpl, { size: 'lg', scrollable: true , keyboard:false,backdrop:'static'});
  }

  openLoanView(modalTpl: TemplateRef<any>, loan: any): void {
    this.selectedLoanForView = loan;
    console.log(this.selectedLoanForView);
    this.modalService.open(modalTpl, { size: 'xl', scrollable: true , keyboard:false,backdrop:'static'});
  }

  getSelectedLoan(): any {
    return this.loans.find(loan => loan.id === this.selectedLoanId);
  }

  // Helpers for the loan view modal
  getLoanClosingDate(loan: any): string {
    try {
      const start = new Date(loan?.emi_start_date || loan?.disbursement_date);
      const tenure = Number(loan?.tenure_months || 0);
      if (!isFinite(start.getTime()) || !tenure) return '';
      const d = new Date(start);
      d.setMonth(d.getMonth() + tenure);
      return d.toISOString().substring(0, 10);
    } catch {
      return '';
    }
  }

  getInstallmentsRemaining(loan: any): number {
    const tenure = Number(loan?.tenure_months || 0);
    const paid = Number(loan?.installments_paid || 0);
    if (!tenure) return 0;
    return Math.max(0, tenure - paid);
  }

  getRemainingAmount(loan: any): number {
    // If backend provides outstanding, prefer it
    if (loan?.outstanding_amount != null) return Number(loan.outstanding_amount);
    const principal = Number(loan?.principal_amount || 0);
    const paid = Number(loan?.total_amount_paid || 0);
    const remaining = principal - paid;
    return remaining > 0 ? remaining : 0;
  }

  getTotalPrincipalPaid(): number {
    return this.paymentHistory.reduce((sum, p) => sum + p.principalPaid, 0);
  }

  getTotalInterestPaid(): number {
    return this.paymentHistory.reduce((sum, p) => sum + p.interestPaid, 0);
  }
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      active: 'green',
      closed: 'gray',
      defaulted: 'red'
    };
    return colors[status] || 'black';
  }

  // Record Repayment Methods
  openRecordRepayment(modal: TemplateRef<any>, loan: any): void {
    this.selectedLoanForRepayment = loan;
    this.isUpdateMode = false;
    this.selectedRepaymentForUpdate = null;
    let modalRef=this.modalService.open(modal, { size: 'md' , keyboard:false,backdrop:'static'});
    modalRef.result.then((result: any) => {
      if(result){
        this.loadLoans();
        this.loadLoanLedgers(this.selectedEmployeeId);
      }
    });
  }



  getCurrentDate(): string {
    return new Date().toISOString().substring(0, 10);
  }

  // Update Repayment methods
  openUpdateRepayment(modal: TemplateRef<any>, repayment: any): void {
    this.selectedRepaymentForUpdate = repayment;
    this.isUpdateMode = true;
    this.selectedLoanForRepayment = this.selectedLoanForView; // Use the current loan being viewed
    let modalRef = this.modalService.open(modal, { size: 'md', keyboard: false, backdrop: 'static' });
    modalRef.result.then((result: any) => {
      if(result){
        this.loadLoans();
        this.loadLoanLedgers(this.selectedEmployeeId);
      }
    });
    this.modalRef = modalRef;
  }


  deleteRepayment(repaymentId: number): void {
    if (confirm('Are you sure you want to delete this repayment? This action cannot be undone.')) {
      this.api.delete(`/attendance/delete-repayment-by-id/${repaymentId}/`)
        .subscribe((response: any) => {
          if (response.status === 200) {
            this.toast.show('Success', response.message || 'Repayment deleted successfully', 'success');
            this.loadLoanLedgers(this.selectedEmployeeId);
          } else {
            this.toast.show('Error', response.message || 'Failed to delete repayment', 'danger');
          }
        }, (error) => {
          console.error('Error deleting repayment:', error);
          this.toast.show('Error', 'Failed to delete repayment', 'danger');
        });
    }
  }


} 