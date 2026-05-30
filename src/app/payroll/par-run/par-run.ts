import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { PayrunDetail } from "../payrun-detail/payrun-detail";
import { FeaturesRoutingModule } from "../../features/features-routing-module";
import { Router, RouterLink } from '@angular/router';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-par-run',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PayrunDetail, FeaturesRoutingModule,RouterLink],
  templateUrl: './par-run.html',
  styleUrl: './par-run.scss'
})
export class ParRun implements OnInit {
  activeTab: 'run' | 'history' = 'run';
  selectedFilter: 'all' | 'regular' | 'bulk' = 'all';
  
  // Settings properties
  settings = {
    allowDeductionsAbove50Percent: true,
    allowFinalSettlement14Days: false,
    id: null
  };

  // Summary for current pay run (defaults derived, to be populated from API)
  runPayrollData: any 

  // Bulk settlement batches
  bulkSettlementBatches: any[] = [];

  // Payslip data to be set dynamically (e.g., when a payslip is opened)
  paySlipData: any = null;

  // History will be loaded from API
  payrollHistory: any[] = [];
  filteredPayrollHistory: any[] = [];
  
  // Modal state
  showSettingsModal = false;
  
  constructor(private fb: FormBuilder, private api: Api, private router: Router) {
    }

  getcurrency() {
    return this.api.getcurrencies();
  }

  setActiveTab(tab: 'run' | 'history'): void {
    this.activeTab = tab;
  }
  
  ngOnInit(): void {
    this.getPayrol();
    this.getPayrollHistory();
    this.loadSettings();
    this.applyRevisedSalary();
  }

  getPayrol(): void {
    this.api.get('/employee/current_month_payroll_run/').subscribe((response: any) => {
      if(response.status == 200){
        this.runPayrollData = response.data.payroll_runs;
      }
    });
  }
  // payroll_history/<int:company_id>/
  getPayrollHistory(): void {
    this.api.get('/employee/payroll_history/'+this.api.getCompanyId()+'/').subscribe((response: any) => {
      if(response.status == 200){
        this.payrollHistory = response.data.filter((item: any) => item.status == "PAID" || item.status == "7");
        this.filteredPayrollHistory = [...this.payrollHistory];
        this.bulkSettlementBatches = response.data.filter((item: any) => item.payroll_type=="Bulk Payroll");
      }
    });
  }
  // Helpers to compute period and totals without hardcoded values
  private getCurrentPeriod(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  get grossEarnings(): number {
    if (!this.paySlipData?.earnings) return 0;
    return this.paySlipData.earnings.reduce((total: number, item: any) => total + (item.amount || 0), 0);
  }

  get totalDeductions(): number {
    if (!this.paySlipData?.deductions) return 0;
    return this.paySlipData.deductions.reduce((total: number, item: any) => total + (item.amount || 0), 0);
  }

  get totalReimbursements(): number {
    if (!this.paySlipData?.reimbursements) return 0;
    return this.paySlipData.reimbursements.reduce((total: number, item: any) => total + (item.amount || 0), 0);
  }

  get netPayable(): number {
    return this.grossEarnings - this.totalDeductions + this.totalReimbursements;
  }

  // Settings methods
  openSettingsModal(): void {
    this.showSettingsModal = true;
  }

  closeSettingsModal(): void {
    this.showSettingsModal = false;
  }

  saveSettings(): void {
    // Save settings to localStorage or API
    localStorage.setItem('payRunSettings', JSON.stringify(this.settings));
    // update_payrun_deduction/<int:pk>/
    this.api.put('/employee/update_payrun_deduction/'+this.settings.id+'/', this.settings).subscribe((response: any) => {
      if(response.status == 200){
        console.log('Settings saved:', response);
        this.closeSettingsModal();
      }
    });
 
    console.log('Settings saved:', this.settings);
  }

  // Load settings on component initialization

  loadSettings(): void {
    this.api.get('/employee/list_payrun_deductions/'+this.api.getCompanyId()+'/').subscribe((response: any) => {
      if(response.status == 200){
        this.settings = response.data[0];
        this.settings.id=response.data[0].id;
        console.log(this.settings,'settings');
      }     
    });
    
  }

  openPayRunDetail(item: any): void {
    this.router.navigate(['../payroll/pay-run-detail',JSON.stringify(item)]);
  }
  // apply_revised_salary/
  applyRevisedSalary(): void {
    this.api.post('/employee/apply_revised_salary/', {}).subscribe((response: any) => {
      if(response.status == 200){
        console.log('Revised salary applied:', response);
      }
    });
  }

  // Filter methods
  setFilter(filter: 'all' | 'regular' | 'bulk'): void {
    this.selectedFilter = filter;
  }

  getTotalPendingCount(): number {
    const regularCount = this.runPayrollData?.length || 0;
    const bulkCount = this.bulkSettlementBatches?.length || 0;
    return regularCount + bulkCount;
  }

  getRegularPayrollCount(): number {
    return this.runPayrollData?.length || 0;
  }

  getBulkTerminationCount(): number {
    return this.bulkSettlementBatches?.length || 0;
  }
}
