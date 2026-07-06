import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Api } from '../../core/services/api';
import { DeductionDetail } from '../deduction-detail/deduction-detail';
import { OverallInsight } from '../overall-insight/overall-insight';
import { PayrunDrawer } from '../payrun-drawer/payrun-drawer';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payrun-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DeductionDetail, OverallInsight, PayrunDrawer],
  templateUrl: './payrun-detail.html',
  styleUrl: './payrun-detail.scss'
})
export class PayrunDetail implements OnInit {
 
  activeTab: 'run' | 'history' = 'run';
  modalTab: 'employee' | 'deductions' | 'insights' = 'employee';

  // runPayrollData: any = null;
  payrollSummary: any = null;
  employees: Array<any> = [];
  filteredEmployees: Array<any> = [];
  searchQuery: string = '';
  selectedEmployee: any = null;
  selectedEmployeeDetail: any = null;
  private employeeDetailsById: Map<string, any> = new Map();
  missingData: any;
  payrollRunId: any = null;
  isSubmitting: boolean = false;
  payslipData: any;
  isRecordingPayment: boolean = false;
  bankList: any[] = [];
  recordPaymentForm: FormGroup;
  showRecordPaymentModal: boolean = false;

  constructor(private fb: FormBuilder, private api: Api, private router: Router, private route: ActivatedRoute) {
    this.recordPaymentForm = this.fb.group({
      pay_date: [this.getCurrentDate(), Validators.required],
      bank_id: ['', Validators.required],
      send_notification: [true],
      payroll_run_id:[]
    });
  }

  getcurrency() {
    return this.api.getcurrencies();
  }
  ngOnInit(): void {
    // Get the payroll run ID from route parameters
    this.route.params.subscribe(params => {
      this.payrollRunId = JSON.parse(params['data']);
      console.log(this.payrollRunId,'payrollRunId');
      this.loadCurrentPayRun();
      this.loadData();
    });
  }
  loadData(){
    this.api.get('/employee/employees-missing-data/'+this.api.getUserCompany()+'/').subscribe((res: any) => {
      if(res.status == 200){
        this.missingData=res
        console.log(this.missingData,'missingData');
      }
    });
  }

  // Missing data action methods
  viewMissingSalaryEmployees() {
    // Open modal or navigate to view employees without salary structure
    console.log('Viewing employees without salary structure:', this.missingData.employees_without_salary_structure.employees);
    // Implement navigation or modal opening logic here
    this.router.navigate(['/payroll/missing-data',this.payrollSummary.payrun_id]);
  }

  viewMissingLabourCardEmployees() {
    // Open modal or navigate to view employees without labour card
    console.log('Viewing employees without labour card:', this.missingData.employees_without_labour_card.employees);
    this.router.navigate(['/payroll/missing-data',this.payrollSummary.payrun_id]);
  }

  // Get current pay run summary (no hardcoded values)
  loadCurrentPayRun(){
    // this.api.get('/employee/current_month_payroll_run/').subscribe((res: any) => {
    //   if(res.status == 200){
    //   this.runPayrollData = res?.data || res;
    //   console.log(this.runPayrollData,'runPayrollData');
      if(this.payrollRunId.status == '4' || this.payrollRunId.status == '5'){
        this.getEmpPayroll()
      }
      // this.payrollRunId=this.payrollRunId.payrun_id;
      if(this.payrollRunId.status == '6' || this.payrollRunId.status == '7'){
        this.loadSpecificPayRun(this.payrollRunId);
      }else{
        // this.getEmpPayroll();
      }
    //   }
    // });
  }

  // Load specific payroll run by ID
  loadSpecificPayRun(payrollRunId: any): void {
    let payload={
      "payroll_run_id": payrollRunId.payrun_id || payrollRunId.payroll_run_id,
      "company_id":this.api.getUserCompany()
    }
    this.api.post(`/employee/submit_payroll_run_with_payslip/`, payload).subscribe((response: any) => {
      if(response.status == 200){
        this.payslipData=response.data.employee_payslip_details
        this.payslipData.payrun_id=payrollRunId
        this.payrollRunId = response.data;
        this.payrollSummary = response.data.payroll_summary;
        this.payrollSummary.status=response.data.status
        this.employees = response.data.employees || [];
        this.filteredEmployees = [...this.employees];
      }
    });
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/payroll/par-run']);
  }

  // Submit and Approve functionality
  submitAndApprove(): void {
    this.isSubmitting = true;
    
    const payload = {
      payroll_run_id: this.payrollSummary?.payrun_id,
      company_id: this.api.getUserCompany(),
    };

    this.api.post('/employee/submit_payroll_run_with_payslip/', payload).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          alert('Payroll submitted and approved successfully!');
          // Update the status
          if (this.payrollSummary) {
            this.payrollSummary.status = '6';
            this.payrollRunId.status = '6';
          }
          // Refresh the data
          this.loadCurrentPayRun();
        } else {
          alert('Failed to submit payroll. Please try again.');
        }
        this.isSubmitting = false;
      },
      error: (error: any) => {
        console.error('Error submitting payroll:', error);
        alert('An error occurred while submitting payroll. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  canSubmit(): boolean {
    // Check if there are any missing data issues
 
    
    // Check if payroll summary exists and has required data
    if (!this.payrollSummary || !this.payrollSummary.payrun_id) {
      return false;
    }
    
    // Check if there are employees in the payroll
    if (!this.employees || this.employees.length === 0) {
      return false;
    }
    
    return true;
  }

  // Additional header actions
  exportPayroll(): void {
    console.log('Exporting payroll...');
    // Implement export functionality
    alert('Export functionality will be implemented');
  }

  printPayroll(): void {
    console.log('Printing payroll...');
    // Implement print functionality
    window.print();
  }

  viewHelp(): void {
    console.log('Opening help...');
    // Implement help functionality
    alert('Help documentation will be opened');
  }

  // Additional methods for new functionality
  fetchData(): void {
    console.log('Fetching data...');
    // Implement fetch data functionality
    alert('Fetching leave and attendance data...');
  }

  deletePayRun(): void {
    if (confirm('Are you sure you want to delete this pay run?')) {
      console.log('Deleting pay run...');
      // Implement delete functionality
      alert('Pay run deletion will be implemented');
    }
  }

  // Preview payroll process for current month/year; parameters can be adjusted by filters/UI
  getEmpPayroll(){
    const payload={
      pay_date:this.payrollRunId?.pay_date,
      pay_period_start_date:this.payrollRunId?.pay_period_start_date,
      pay_period_end_date:this.payrollRunId?.pay_period_end_date,
      company:this.api.getUserCompany()
    }
    this.api.post('/employee/payroll_process_preview/', payload).subscribe((res: any) => {
      const data = res?.data || res;
      this.payrollSummary = data?.payroll_summary || null;
      this.employees = Array.isArray(data?.employees) ? data.employees : [];
      this.filteredEmployees = [...this.employees];
      const detailsArr = Array.isArray(data?.detailed_employee_data) ? data.detailed_employee_data : [];
      this.employeeDetailsById = new Map(
        detailsArr.map((d: any) => [String(d?.employee_info?.employee_id), d])
      );
    });
  }
 
  setTab(tab: 'employee' | 'deductions' | 'insights'){
    this.modalTab = tab;
  }
 
  onSearchEmployees(term: string): void {
    this.searchQuery = term || '';
    const q = this.searchQuery.trim().toLowerCase();
    if(!q){
      this.filteredEmployees = [...this.employees];
      return;
    }
    this.filteredEmployees = this.employees.filter((e: any) => {
      const name: string = String(e?.employee_name || '').toLowerCase();
      const id: string = String(e?.employee_id || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }
 
  formatCurrency(amount: number | null | undefined): string {
    const value = Number(amount || 0);
    return `${this.getcurrency()}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
 
  get periodLabel(): string {
    const p = this.payrollSummary?.period;
    if (p) return p;
    return '';
  }
 
  get baseDays(): number {
    return Number(this.payrollSummary?.base_days || 0);
  }
 
  get payDay(): string {
    const day = this.payrollSummary?.pay_day;
    if(!day) return '';
    try{
      const d = new Date(day);
      // e.g., 01 OCT, 2025
      const dd = d.toLocaleDateString('en-GB', { day: '2-digit' });
      const mon = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
      const yr = d.getFullYear();
      return `${dd} ${mon}, ${yr}`;
    }catch{
      return String(day);
    }
  }
 
  get payrollCost(): string { return this.formatCurrency(this.payrollSummary?.payroll_cost); }
  get totalNetPay(): string { return this.formatCurrency(this.payrollSummary?.total_net_pay); }
  get totalEmployees(): number { return Number(this.payrollSummary?.total_employees || 0); }
  get totalBenefitContribution(): string { return this.formatCurrency(this.payrollSummary?.deductions_summary?.total_benefit_contribution); }
  get totalDeductions(): string { return this.formatCurrency(this.payrollSummary?.deductions_summary?.total_deductions); }
 
  openEmployeeDrawer(emp: any){
    this.selectedEmployee = emp;
    const key = String(emp?.employee_id ?? '');
    this.selectedEmployeeDetail = this.employeeDetailsById.get(key) || null;
  }
  openPayslipDrawer(emp: any){
    this.selectedEmployee = emp;
    const key = String(emp?.employee_id ?? '');
    this.selectedEmployeeDetail = this.employeeDetailsById.get(key) || null;
    if (this.payslipData && Array.isArray(this.payslipData)) {
      this.payslipData = this.payslipData.find((item: any) => String(item.employee_id) === String(emp.employee_id)) || null;
    } else {
      this.payslipData = null;
    }
    // Set payslip data for the drawer
    // this.payslipData = this.getPayslipDataForEmployee(emp.employee_id);
  }

  closeDrawer(): void {
    this.selectedEmployee = null;
    this.selectedEmployeeDetail = null;
    this.payslipData = null;
  }

  // Record Payment Modal Methods
  recordPayment(): void {
    this.loadBankList();
    this.showRecordPaymentModal = true;
  }

  closeRecordPaymentModal(): void {
    this.showRecordPaymentModal = false;
  }

  loadBankList(): void {
    this.api.get('/money/list-bank/'+this.api.getUserCompany()+'/').subscribe((response: any) => {
      if (response.status === 200) {
        this.bankList = response.data || [];
        console.log('Bank list loaded:', this.bankList);
      }
    }, (error) => {
      console.error('Error loading bank list:', error);
    });
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getBankTransferCount(): number {
    // Count employees with bank transfer payment mode
    return this.employees.filter(emp => emp.payment_mode === 'bank_transfer').length;
  }

  getCashCount(): number {
    // Count employees with cash payment mode
    return this.employees.filter(emp => emp.payment_mode === 'cash').length;
  }

  confirmRecordPayment(): void {
    if (this.recordPaymentForm.valid) {
      this.isRecordingPayment = true;
      
      const paymentData = {
        payroll_run_id: this.payrollSummary?.payrun_id,
        pay_date: this.recordPaymentForm.value.pay_date,
        bank_id: this.recordPaymentForm.value.bank_id,
        send_notification: this.recordPaymentForm.value.send_notification
      };

      this.api.post('/employee/payroll_record/', paymentData).subscribe((response: any) => {
        this.isRecordingPayment = false;
        if (response.status === 200) {
          console.log('Payment recorded successfully:', response);
          this.closeRecordPaymentModal();
          // Refresh data or show success message
          this.loadCurrentPayRun();
        }
      }, (error) => {
        this.isRecordingPayment = false;
        console.error('Error recording payment:', error);
      });
    }
  }
}
